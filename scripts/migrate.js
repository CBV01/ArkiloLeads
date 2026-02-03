const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function migrate() {
    console.log('Migrating database...');
    try {
        try {
            await db.execute('ALTER TABLE email_logs ADD COLUMN opened_at DATETIME');
            console.log('Added opened_at to email_logs');
        } catch (e) { console.log('opened_at already exists or error:', e.message); }

        try {
            await db.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          userId TEXT,
          title TEXT,
          message TEXT,
          type TEXT DEFAULT 'info',
          read INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            console.log('Created notifications table');
        } catch (e) { console.log('Notification table error:', e.message); }

        console.log('Migration complete');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrate();
