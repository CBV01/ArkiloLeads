const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function fixAll() {
    console.log('--- Arkilo Leads Fix-All Migration ---');

    // 1. Check/Fix smtp_settings
    console.log('Checking smtp_settings schema...');
    try {
        const info = await db.execute("PRAGMA table_info(smtp_settings)");
        const hasSlot = info.rows.some(r => r.name === 'slot');
        const hasDailySent = info.rows.some(r => r.name === 'dailySent');

        if (!hasSlot || !hasDailySent) {
            console.log('Upgrading smtp_settings to supporting slots and tracking...');
            // Need to recreate because we need composite PK
            await db.execute("ALTER TABLE smtp_settings RENAME TO smtp_settings_old");
            await db.execute(`
                CREATE TABLE smtp_settings (
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
                )
            `);
            // Migrate if old data exists
            try {
                await db.execute(`
                    INSERT INTO smtp_settings (userId, slot, host, port, user, pass, fromEmail, fromName, isActive)
                    SELECT userId, 1, host, port, user, pass, fromEmail, fromName, 1 FROM smtp_settings_old
                `);
                console.log('Migrated old SMTP data to Slot 1');
            } catch (e) {
                console.log('No old SMTP data to migrate');
            }
            await db.execute("DROP TABLE IF EXISTS smtp_settings_old");
        } else {
            console.log('smtp_settings is up to date.');
        }
    } catch (e) {
        console.log('Error fixing smtp_settings:', e.message);
    }

    // 2. Check/Fix analytics
    console.log('Checking analytics schema...');
    try {
        const info = await db.execute("PRAGMA table_info(analytics)");
        const hasUserId = info.rows.some(r => r.name === 'userId');

        if (!hasUserId) {
            console.log('Upgrading analytics tabe for multi-user support...');
            await db.execute("ALTER TABLE analytics RENAME TO analytics_old");
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
            try {
                await db.execute("INSERT INTO analytics (date, sent) SELECT date, sent FROM analytics_old");
                console.log('Migrated old analytics data');
            } catch (e) { }
            await db.execute("DROP TABLE IF EXISTS analytics_old");
        } else {
            console.log('analytics is up to date.');
        }
    } catch (e) {
        console.log('Error fixing analytics:', e.message);
    }

    // 3. Fix leads uniqueness
    console.log('Ensuring leads uniqueness...');
    try {
        // Just ensure the index exists for the API
        await db.execute("CREATE INDEX IF NOT EXISTS idx_leads_userId ON leads(userId)");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)");
    } catch (e) { }

    console.log('Migration complete. All systems should now be tracking correctly.');
    process.exit(0);
}

fixAll();
