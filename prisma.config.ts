import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Shared database URL - mọi người dùng chung database này
const SHARED_DATABASE_URL = 'postgresql://neondb_owner:npg_DeJuhH0yWw3q@ep-aged-thunder-ahrj0nsr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL') || SHARED_DATABASE_URL,
  },
});
