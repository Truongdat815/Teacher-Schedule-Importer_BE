import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/eventService';
import { UnauthorizedError, NotFoundError } from '../utils/errors';

/**
 * Create or update event mapping (idempotent)
 */
export const createOrUpdateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    const event = await eventService.upsertEventMapping({
      userId,
      sheetId: req.body.sheetId,
      tabName: req.body.tabName,
      rowNumber: req.body.rowNumber || 0,
      title: req.body.title,
      startTime: new Date(req.body.startTime),
      endTime: new Date(req.body.endTime),
      attributes: req.body.attributes,
    });

    res.status(200).json({
      success: true,
      message: 'Event mapping created/updated successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all events for current user
 */
export const getUserEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    const events = await eventService.getUserEventMappings(userId);
    res.status(200).json({
      success: true,
      message: 'Events retrieved successfully',
      data: events,
      count: events.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get event by ID
 */
export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const event = await eventService.getEventMappingById(id);

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    res.status(200).json({
      success: true,
      message: 'Event retrieved successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update event mapping
 */
export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const event = await eventService.updateEventMapping(id, {
      title: req.body.title,
      startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
      endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      googleEventId: req.body.googleEventId,
      syncStatus: req.body.syncStatus,
      attributes: req.body.attributes,
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete event mapping
 */
export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await eventService.deleteEventMapping(id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get events by sync status
 */
export const getEventsBySyncStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string;
    const events = await eventService.getEventsBySyncStatus(status);
    res.status(200).json({
      success: true,
      message: 'Events retrieved successfully',
      data: events,
      count: events.length,
    });
  } catch (error) {
    next(error);
  }
};
