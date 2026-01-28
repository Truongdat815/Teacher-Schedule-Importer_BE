import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid request data',
      details: errors,
    });
  }

  // Handle Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Database Validation Error',
      message: 'Invalid data format for database operation',
    });
  }

  // Handle Custom App Errors
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.constructor.name,
      message: err.message,
      ...(err.code && { code: err.code }),
    });
  }

  // Handle Unknown Errors
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Handle Prisma specific errors
 */
const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError, res: Response) => {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'A record with this value already exists',
        field: err.meta?.target,
      });

    case 'P2025':
      // Record not found
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Record not found',
      });

    case 'P2003':
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        error: 'Invalid Reference',
        message: 'Referenced record does not exist',
      });

    case 'P2014':
      // Required relation violation
      return res.status(400).json({
        success: false,
        error: 'Invalid Relation',
        message: 'Required relation is missing',
      });

    default:
      return res.status(500).json({
        success: false,
        error: 'Database Error',
        message: 'A database error occurred',
        ...(process.env.NODE_ENV === 'development' && { code: err.code }),
      });
  }
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};
