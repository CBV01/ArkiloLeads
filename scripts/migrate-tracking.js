const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function migrate() {
    console.log('Migrating database for Tracking & Multi-user analytics...');
    try {
        // 1. Update email_logs
        const logsCols = [
            { name: 'userId', type: 'TEXT' },
            { name: 'opened_at', type: 'DATETIME' },
            { name: 'clicked_at', type: 'DATETIME' },
            { name: 'replied_at', type: 'DATETIME' }
        ];

        for (const col of logsCols) {
            try {
                await db.execute(`ALTER TABLE email_logs ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added ${col.name} to email_logs`);
            } catch (e) {
                console.log(`${col.name} already exists or error:`, e.message);
            }
        }

        // 2. Fix Analytics Table (Needs userId and better UNIQUE constraint)
        try {
            // Check if userId exists in analytics
            const checkAnalytics = await db.execute("PRAGMA table_info(analytics)");
            const hasUserId = checkAnalytics.rows.some(r => r.name === 'userId');

            if (!hasUserId) {
                console.log('Upgrading analytics table...');
                // SQLite doesn't support sophisticated ALTER TABLE for primary keys/unique constraints
                // We need to recreate it if we want to change UNIQUE(date) to UNIQUE(userId, date)

                // First, rename old one
                await db.execute("ALTER TABLE analytics RENAME TO analytics_old");

                // Create new one
                await db.execute(`
                    CREATE TABLE analytics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        userId TEXT,
                        date TEXT,
                        sent INTEGER DEFAULT 0,
                        opens INTEGER DEFAULT 0,
                        clicks INTEGER DEFAULT 0,
                        replies INTEGER DEFAULT 0,
                        UNIQUE(userId, date)
                    )
                `);

                // Copy data (ignoring duplicates if any)
                try {
                    await db.execute("INSERT INTO analytics (date, sent, opens, clicks, replies) SELECT date, sent, opens, clicks, replies FROM analytics_old");
                    console.log('Data migrated to new analytics table');
                } catch (e) {
                    console.log('Data migration error (likely empty table):', e.message);
                }

                // Drop old
                await db.execute("DROP TABLE analytics_old");
            }
        } catch (e) {
            console.log('Analytics migration error:', e.message);
        }

        console.log('Migration complete');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrate();
