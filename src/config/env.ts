import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment variables schema
 */
const envSchema = z.object({
  // Server
  PORT: z.string().default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Google OAuth (optional for development, required for production)
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),

  // JWT (with default for development - must be at least 32 chars)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long')
    .default('dev-secret-key-change-in-production-min-32-chars-long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
});

/**
 * Validate and parse environment variables
 */
export const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variables validation failed:');
      error.issues.forEach((err: z.ZodIssue) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      process.exit(1);
    }
    throw error;
  }
};

// Validate on import (but don't fail if .env doesn't exist yet)
let env: z.infer<typeof envSchema>;
try {
  env = validateEnv();
} catch (error) {
  // If validation fails, use defaults (for development)
  console.warn('⚠️  Environment validation failed, using defaults. Please check your .env file.');
  env = {
    PORT: 5000,
    NODE_ENV: 'development',
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: 'dev-secret-key-change-in-production-min-32-chars-long',
    JWT_EXPIRES_IN: '7d',
    JWT_REFRESH_EXPIRES_IN: '30d',
  } as any;
}

export default env;
