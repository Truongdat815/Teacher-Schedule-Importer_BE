import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/eventService';
import { UnauthorizedError, NotFoundError } from '../utils/errors';

/**
 * Create or update event mapping (idempotent)
 */
export const createOrUpdateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // User must be authenticated (from middleware)
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID is required. Please login first.');
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
    // User must be authenticated (from middleware)
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID is required. Please login first.');
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
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User ID is required. Please login first.');
    }

    const event = await eventService.getEventMappingById(id);

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check ownership (authorization middleware should handle this, but double-check)
    if (event.userId !== userId) {
      throw new UnauthorizedError('You do not have permission to access this event');
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
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User ID is required. Please login first.');
    }

    // Check ownership before updating (authorization middleware should handle this)
    const existingEvent = await eventService.getEventMappingById(id);
    if (!existingEvent) {
      throw new NotFoundError('Event not found');
    }
    if (existingEvent.userId !== userId) {
      throw new UnauthorizedError('You do not have permission to update this event');
    }

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
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User ID is required. Please login first.');
    }

    // Check ownership before deleting (authorization middleware should handle this)
    const existingEvent = await eventService.getEventMappingById(id);
    if (!existingEvent) {
      throw new NotFoundError('Event not found');
    }
    if (existingEvent.userId !== userId) {
      throw new UnauthorizedError('You do not have permission to delete this event');
    }

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
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User ID is required. Please login first.');
    }

    // Get events by status for this user only
    const events = await eventService.getEventsBySyncStatus(status, userId);
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
