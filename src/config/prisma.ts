import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create PostgreSQL connection pool
// Use shared database URL from .env or fallback to default shared database
const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_DeJuhH0yWw3q@ep-aged-thunder-ahrj0nsr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Prisma Client initialization with adapter (required for Prisma 7)
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});

export default prisma;
