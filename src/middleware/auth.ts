import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import prisma from '../config/prisma';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to extract token from Authorization header first
    const authHeader = req.headers.authorization;
    let token = extractTokenFromHeader(authHeader);

    // If no Authorization header, try to get from httpOnly cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError('No token provided. Please login first.');
    }

    // Verify token - wrap in try-catch to handle JWT errors
    let decoded: JWTPayload;
    try {
      decoded = verifyToken(token);
    } catch (tokenError: any) {
      // JWT verification failed - always return 401
      const error = new UnauthorizedError('Invalid or expired token. Please login again.');
      return next(error);
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found. Token may be invalid.');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error: any) {
    // Handle other errors (like UnauthorizedError from above)
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    // Handle unexpected errors
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if token is missing
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true },
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
};
