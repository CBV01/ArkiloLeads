const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    console.log('Running SMTP migration...');
    try {
        await db.execute(`
      CREATE TABLE IF NOT EXISTS smtp_settings (
        userId TEXT PRIMARY KEY,
        host TEXT,
        port INTEGER,
        user TEXT,
        pass TEXT,
        fromEmail TEXT,
        fromName TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('SMTP settings table created successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();
