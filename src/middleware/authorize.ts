import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, NotFoundError } from '../utils/errors';
import prisma from '../config/prisma';

/**
 * Authorization middleware - Check if user owns the event
 */
export const authorizeEventAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const eventId = req.params.id as string;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    if (!eventId) {
      throw new UnauthorizedError('Event ID is required');
    }

    // Check if event exists and user owns it
    const event = await prisma.eventMapping.findUnique({
      where: { id: eventId },
      select: { userId: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.userId !== userId) {
      throw new UnauthorizedError('You do not have permission to access this event');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware - Check if user can access events by status
 * This middleware ensures userId is available for the controller
 * The controller will pass userId to the service
 */
export const authorizeEventsByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    // userId is already in req.user, controller will use it
    next();
  } catch (error) {
    next(error);
  }
};
