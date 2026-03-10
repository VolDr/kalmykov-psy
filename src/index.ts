import 'dotenv/config';
import * as schema from './db/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
export const db = drizzle<typeof schema>(process.env.DATABASE_URL!);
