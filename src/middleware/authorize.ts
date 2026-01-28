import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, NotFoundError } from '../utils/errors';
import prisma from '../config/prisma';

/**
 * Authorization middleware - Check if user owns the capstone project
 */
export const authorizeEventAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    if (!projectId) {
      throw new UnauthorizedError('Project ID is required');
    }

    // Check if project exists and user owns it
    const project = await prisma.capstoneProject.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.userId !== userId) {
      throw new UnauthorizedError('You do not have permission to access this project');
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
