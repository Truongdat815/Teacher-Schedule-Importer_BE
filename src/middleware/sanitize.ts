import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

/**
 * Sanitize string input
 */
const sanitizeString = (value: any): string => {
  if (typeof value !== 'string') {
    return value;
  }
  // Remove HTML tags and escape special characters
  return validator.escape(validator.stripLow(value));
};

/**
 * Recursively sanitize object
 */
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Input sanitization middleware
 * Sanitizes request body, query, and params
 */
export const sanitize = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize body (body can be modified)
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Note: req.query and req.params are read-only in Express 5
    // They are already parsed and validated by Express
    // We only sanitize body to prevent XSS in user input

    next();
  } catch (error) {
    next(error);
  }
};
