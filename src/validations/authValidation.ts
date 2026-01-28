import { z } from 'zod';

// Google OAuth Callback Query Schema
export const googleCallbackQuerySchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
});

// Refresh Token Body Schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Type exports
export type GoogleCallbackQuery = z.infer<typeof googleCallbackQuerySchema>;
