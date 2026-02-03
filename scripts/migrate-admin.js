const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function migrateAdmin() {
    console.log('Initializing Admin Settings and User Status...');
    try {
        // 1. Create settings table if not exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        `);

        // 2. Set default admin password and global passkey if they don't exist
        const defaultSettings = [
            { key: 'admin_password', value: 'admin123' },
            { key: 'global_passkey', value: 'arkilo_master_2024' }
        ];

        for (const setting of defaultSettings) {
            const check = await db.execute({
                sql: 'SELECT key FROM settings WHERE key = ?',
                args: [setting.key]
            });

            if (check.rows.length === 0) {
                await db.execute({
                    sql: 'INSERT INTO settings (key, value) VALUES (?, ?)',
                    args: [setting.key, setting.value]
                });
                console.log(`Initialized default ${setting.key}`);
            }
        }

        // 3. Add status column to users table
        try {
            await db.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
            console.log('Added status column to users');
        } catch (e) {
            console.log('Status column already exists or error:', e.message);
        }

        console.log('Admin migration complete');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrateAdmin();
