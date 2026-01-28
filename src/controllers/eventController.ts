import { Request, Response } from 'express';
import * as eventService from '../services/eventService';

/**
 * Create or update event mapping (idempotent)
 */
export const createOrUpdateEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.userId; // Assuming auth middleware sets user
    if (!userId) {
      res.status(401).json({ error: 'User ID is required' });
      return;
    }

    const {
      sheetId,
      tabName,
      rowNumber,
      title,
      startTime,
      endTime,
      attributes,
    } = req.body;

    // Validation
    if (!sheetId || !tabName || !title || !startTime || !endTime) {
      res.status(400).json({
        error: 'Missing required fields: sheetId, tabName, title, startTime, endTime',
      });
      return;
    }

    const event = await eventService.upsertEventMapping({
      userId,
      sheetId,
      tabName,
      rowNumber: rowNumber || 0,
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attributes,
    });

    res.status(200).json({
      message: 'Event mapping created/updated successfully',
      data: event,
    });
  } catch (error: any) {
    console.error('Error creating/updating event:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get all events for current user
 */
export const getUserEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (typeof req.query.userId === 'string' ? req.query.userId : undefined);
    if (!userId) {
      res.status(401).json({ error: 'User ID is required' });
      return;
    }

    const events = await eventService.getUserEventMappings(userId);
    res.status(200).json({
      message: 'Events retrieved successfully',
      data: events,
      count: events.length,
    });
  } catch (error: any) {
    console.error('Error getting user events:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get event by ID
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const event = await eventService.getEventMappingById(id);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.status(200).json({
      message: 'Event retrieved successfully',
      data: event,
    });
  } catch (error: any) {
    console.error('Error getting event:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Update event mapping
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const updateData = req.body;

    const event = await eventService.updateEventMapping(id, {
      title: updateData.title,
      startTime: updateData.startTime ? new Date(updateData.startTime) : undefined,
      endTime: updateData.endTime ? new Date(updateData.endTime) : undefined,
      googleEventId: updateData.googleEventId,
      syncStatus: updateData.syncStatus,
      attributes: updateData.attributes,
    });

    res.status(200).json({
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Delete event mapping
 */
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    await eventService.deleteEventMapping(id);

    res.status(200).json({
      message: 'Event deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get events by sync status
 */
export const getEventsBySyncStatus = async (req: Request, res: Response) => {
  try {
    const statusParam = req.query.status;
    const status = typeof statusParam === 'string' ? statusParam : (Array.isArray(statusParam) ? String(statusParam[0]) : String(statusParam));
    if (!status || status === 'undefined') {
      res.status(400).json({ error: 'Status query parameter is required' });
      return;
    }

    const events = await eventService.getEventsBySyncStatus(status);
    res.status(200).json({
      message: 'Events retrieved successfully',
      data: events,
      count: events.length,
    });
  } catch (error: any) {
    console.error('Error getting events by status:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
