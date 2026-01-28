/**
 * Calendar Controller
 * 
 * Handles:
 * - Sync parsed capstone project and events to Google Calendar
 * - Create multiple calendar events (one per stage)
 * - Update existing events if googleEventId already exists
 */

import { Request, Response, NextFunction } from 'express';
import { parseCapstoneRow, generateEventTitle, generateEventDescription } from '../services/sheetsParserService';
import * as capstoneService from '../services/capstoneProjectService';
import { calendarSyncInputSchema } from '../validations/sheetsValidation';
import { UnauthorizedError, NotFoundError } from '../utils/errors';
import { google } from 'googleapis';
import prisma from '../config/prisma';

/**
 * POST /api/calendar/sync
 * 
 * Parse sheet row, create/update CapstoneProject and ProjectEvents
 * Sync each stage to Google Calendar
 */
export const syncSheetToCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID is required. Please login first.');
    }

    // Validate input
    const { sheetId, tabName, rowNumber, rowData, syncOptions } =
      await calendarSyncInputSchema.parseAsync(req.body);

    // Get user's Google credential
    const credential = await prisma.googleCredential.findUnique({
      where: { userId },
    });

    if (!credential) {
      throw new UnauthorizedError(
        'Google credential not found. Please authenticate with Google first.'
      );
    }

    // Initialize OAuth2 client with user's credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );
    
    // Set the credentials
    oauth2Client.setCredentials({
      access_token: credential.accessToken,
      refresh_token: credential.refreshToken,
    });

    // Parse the sheet row
    const parsed = parseCapstoneRow(rowData);

    // Create/Update CapstoneProject
    const { project, events: createdEvents } =
      await capstoneService.upsertCapstoneProject(
        userId,
        sheetId,
        tabName,
        rowNumber,
        parsed
      );

    // Determine which stages to sync
    const stagesToSync = syncOptions?.stagesToSync || [
      'REV1',
      'REV2',
      'REV3',
      'DEF1',
      'DEF2',
    ]; // Exclude SUPERVISOR by default
    const eventsToSync = createdEvents.filter(
      (e: any) =>
        stagesToSync.includes(e.stage) &&
        e.date && // Must have date
        e.slot && // Must have slot
        e.room // Must have room
    );

    // Sync to Google Calendar
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const syncResults: any[] = [];

    for (const event of eventsToSync) {
      try {
        const eventTitle = generateEventTitle(
          event.stage as any,
          parsed.groupCode,
          parsed.topicCode
        );
        const eventDescription = generateEventDescription(parsed, {
          stage: event.stage as any,
          councilCode: event.councilCode || undefined,
          reviewer1: event.reviewer1 || undefined,
          reviewer2: event.reviewer2 || undefined,
          date: event.date?.toISOString().split('T')[0],
          slot: event.slot || undefined,
          room: event.room || undefined,
          result: event.result || undefined,
        });

        // Calculate event time (dummy: 1 hour duration starting at 8 AM + slot)
        const eventDate = new Date(event.date!);
        const startTime = new Date(eventDate);
        startTime.setHours(8 + (parseInt(event.slot || '0') - 1)); // Slot-based start time
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1);

        const calendarEvent = {
          summary: eventTitle,
          description: eventDescription,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'Asia/Ho_Chi_Minh',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'Asia/Ho_Chi_Minh',
          },
          location: event.room,
        };

        let googleEventId = event.googleEventId;
        let syncStatus: 'success' | 'failed' = 'success';

        if (event.googleEventId) {
          // Update existing event
          try {
            await calendar.events.update({
              calendarId: 'primary',
              eventId: event.googleEventId,
              requestBody: calendarEvent,
            });
          } catch (updateError) {
            console.error(`Failed to update event ${event.googleEventId}:`, updateError);
            syncStatus = 'failed';
          }
        } else {
          // Create new event
          try {
            const createResponse = await calendar.events.insert({
              calendarId: 'primary',
              requestBody: calendarEvent,
            });
            googleEventId = createResponse.data.id!;
          } catch (createError) {
            console.error('Failed to create event:', createError);
            syncStatus = 'failed';
          }
        }

        // Update event sync status
        await capstoneService.updateEventSyncStatus(
          event.id,
          googleEventId || null,
          syncStatus
        );

        syncResults.push({
          stage: event.stage,
          status: syncStatus,
          googleEventId,
          error: syncStatus === 'failed' ? 'Calendar sync failed' : null,
        });
      } catch (eventError) {
        console.error(`Error syncing ${event.stage}:`, eventError);
        syncResults.push({
          stage: event.stage,
          status: 'failed',
          error: String(eventError),
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Sheet synced to calendar successfully',
      data: {
        project: {
          id: project.id,
          topicCode: project.topicCode,
          groupCode: project.groupCode,
          topicNameVi: project.topicNameVi,
        },
        syncResults,
        summary: {
          totalStages: eventsToSync.length,
          successfulSyncs: syncResults.filter((r) => r.status === 'success').length,
          failedSyncs: syncResults.filter((r) => r.status === 'failed').length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/calendar/events
 * 
 * Get all calendar events synced for current user
 * Returns all ProjectEvents associated with user's CapstoneProjects
 */
export const getSyncedEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID is required. Please login first.');
    }

    // Get all capstone projects for this user with their events
    const projects = await prisma.capstoneProject.findMany({
      where: { userId },
      include: {
        events: {
          select: {
            id: true,
            stage: true,
            date: true,
            slot: true,
            room: true,
            councilCode: true,
            reviewer1: true,
            reviewer2: true,
            googleEventId: true,
            lastSyncedAt: true,
            syncStatus: true,
          },
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Flatten events from all projects with type assertion
    const allEvents = projects.flatMap((project: any) =>
      project.events.map((event: any) => ({
        ...event,
        projectId: project.id,
        projectTopicCode: project.topicCode,
        projectGroupCode: project.groupCode,
      }))
    );

    res.status(200).json({
      success: true,
      message: 'Synced events retrieved successfully',
      data: {
        events: allEvents,
        projectCount: projects.length,
        eventCount: allEvents.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
