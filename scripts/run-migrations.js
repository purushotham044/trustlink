// Migration runner — runs 001_schema.sql and 002_rls.sql against Supabase
// Uses the direct DB connection via the pg client
// Run: node scripts/run-migrations.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase DB connection — uses the project's Postgres direct connection
// Connection string format for Supabase:
// postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
//
// The password for the DB connection is the database password you set when
// creating the project (different from the service_role JWT).
// Find it in: Supabase Dashboard → Settings → Database → Connection string

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('ERROR: DATABASE_URL environment variable not set.');
  console.error('Set it to your Supabase direct connection string:');
  console.error('  postgresql://postgres:[DB_PASSWORD]@db.cadlxgwohwtwqwtdwdnh.supabase.co:5432/postgres');
  process.exit(1);
}

const migrations = [
  path.join(__dirname, '..', 'supabase', 'migrations', '001_schema.sql'),
  path.join(__dirname, '..', 'supabase', 'migrations', '002_rls.sql'),
];

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Supabase PostgreSQL.\n');

  for (const migrationPath of migrations) {
    const name = path.basename(migrationPath);
    console.log(`Running ${name}...`);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    try {
      await client.query(sql);
      console.log(`  ✓ ${name} completed.\n`);
    } catch (err) {
      console.error(`  ✗ ${name} failed:`, err.message);
      await client.end();
      process.exit(1);
    }
  }

  console.log('All migrations completed successfully.');
  await client.end();
}

run().catch(err => {
  console.error('Migration runner error:', err.message);
  process.exit(1);
});
