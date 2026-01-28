import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  type?: 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn } as jwt.SignOptions
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  return jwt.sign(
    { userId, email, type: 'refresh' },
    secret,
    { expiresIn } as jwt.SignOptions
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const expiredError = new Error('Token has expired');
      expiredError.name = 'TokenExpiredError';
      throw expiredError;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      const invalidError = new Error('Invalid token');
      invalidError.name = 'JsonWebTokenError';
      throw invalidError;
    }
    throw error;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};
