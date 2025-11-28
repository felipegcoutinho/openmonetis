#!/usr/bin/env node

/**
 * Script to initialize database extensions before running migrations
 * This ensures pgcrypto extension is available for gen_random_bytes()
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env
config();

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    console.log('🔧 Initializing database extensions...');

    // Read and execute init.sql as a single query
    const initSqlPath = path.join(process.cwd(), 'scripts', 'postgres', 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf-8');

    console.log('Executing init.sql...');
    await db.execute(initSql);

    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();