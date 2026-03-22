#!/usr/bin/env node
/**
 * Database migration script for Production (Render, Railway, etc.)
 * Reads SQL files and executes them against the database
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'src', 'db', 'migrations', '001_initial_schema.sql');
    console.log(`Reading migration from: ${migrationPath}`);

    if (!fs.existsSync(migrationPath)) {
      console.error('ERROR: Migration file not found');
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Executing migration...');

    // Execute the SQL
    await pool.query(sql);
    console.log('Migration completed successfully!');

    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('Tables created:', result.rows.map(r => r.table_name).join(', '));

  } catch (error) {
    console.error('Migration failed:', error.message);

    // If tables already exist, that's okay
    if (error.message.includes('already exists')) {
      console.log('Tables already exist, continuing...');
    } else {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

migrate();
