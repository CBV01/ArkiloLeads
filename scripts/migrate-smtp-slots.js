const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    console.log('Running SMTP Slots migration...');
    try {
        // 1. Rename old table to backup if it exists
        try {
            await db.execute('ALTER TABLE smtp_settings RENAME TO smtp_settings_old');
            console.log('Backed up old smtp_settings table.');
        } catch (e) {
            console.log('No old smtp_settings table found or already renamed.');
        }

        // 2. Create new table with slots
        await db.execute(`
            CREATE TABLE IF NOT EXISTS smtp_settings (
                userId TEXT,
                slot INTEGER,
                host TEXT,
                port INTEGER,
                user TEXT,
                pass TEXT,
                fromEmail TEXT,
                fromName TEXT,
                isActive INTEGER DEFAULT 0,
                dailySent INTEGER DEFAULT 0,
                lastSentAt DATETIME,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (userId, slot)
            );
        `);
        console.log('New smtp_settings table created with slots.');

        // 3. Migrate data if old table exists
        try {
            // Check if backup exists
            const backupCheck = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='smtp_settings_old'");
            if (backupCheck.rows.length > 0) {
                await db.execute(`
                    INSERT INTO smtp_settings (userId, slot, host, port, user, pass, fromEmail, fromName, isActive)
                    SELECT userId, 1, host, port, user, pass, fromEmail, fromName, 1 FROM smtp_settings_old
                `);
                console.log('Migrated data from old table to Slot 1.');
            }
        } catch (e) {
            console.error('Data migration failed (maybe already done):', e.message);
        }

        console.log('SMTP Slots migration complete!');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
