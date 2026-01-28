/**
 * Sheets Controller
 * 
 * Handles:
 * - Preview parsed data before sync
 * - Validate structure
 */

import { Request, Response, NextFunction } from 'express';
import { parseCapstoneRow, generateEventTitle, generateEventDescription } from '../services/sheetsParserService';
import { sheetsPreviewInputSchema } from '../validations/sheetsValidation';
import { UnauthorizedError } from '../utils/errors';

/**
 * POST /api/sheets/preview
 * 
 * Preview what will be synced without actually creating calendar events
 * Returns parsed project and event structure
 */
export const previewSheetRow = async (
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
    const { sheetId, tabName, rowNumber, rowData } = await sheetsPreviewInputSchema.parseAsync(
      req.body
    );

    // Parse the row
    const parsed = parseCapstoneRow(rowData);

    // Generate calendar event previews for each stage
    const eventPreviews = parsed.events.map((event) => ({
      stage: event.stage,
      title: generateEventTitle(event.stage, parsed.groupCode, parsed.topicCode),
      description: generateEventDescription(parsed, event),
      // Event details
      date: event.date,
      slot: event.slot,
      room: event.room,
      reviewer1: event.reviewer1,
      reviewer2: event.reviewer2,
      councilCode: event.councilCode,
      result: event.result,
      // Sync-ability
      canSync: !!(event.date && event.slot && event.room),
    }));

    res.status(200).json({
      success: true,
      message: 'Preview generated successfully',
      data: {
        project: {
          topicCode: parsed.topicCode,
          groupCode: parsed.groupCode,
          topicNameEn: parsed.topicNameEn,
          topicNameVi: parsed.topicNameVi,
          mentor: parsed.mentor,
          mentor1: parsed.mentor1,
          mentor2: parsed.mentor2,
          sheetMetadata: {
            sheetId,
            tabName,
            rowNumber,
          },
        },
        events: eventPreviews,
        summary: {
          totalEvents: eventPreviews.length,
          syncableEvents: eventPreviews.filter((e) => e.canSync).length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
