import { z } from 'zod';

// Google OAuth Callback Query Schema
export const googleCallbackQuerySchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
});

// Type exports
export type GoogleCallbackQuery = z.infer<typeof googleCallbackQuerySchema>;
