const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function migrate() {
    console.log('Starting migration for Leads table uniqueness...');
    try {
        // 1. Rename existing table
        console.log('Renaming leads to leads_old...');
        await db.execute('ALTER TABLE leads RENAME TO leads_old');

        // 2. Create new table with correct composite unique constraint
        console.log('Creating new leads table with (userId, email) uniqueness...');
        await db.execute(`
            CREATE TABLE leads (
                id TEXT PRIMARY KEY,
                userId TEXT,
                firstName TEXT,
                lastName TEXT,
                email TEXT,
                company TEXT,
                city TEXT,
                industry TEXT,
                country TEXT,
                status TEXT DEFAULT 'pending',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(userId, email)
            )
        `);

        // 3. Move data from old to new
        console.log('Transferring data...');
        await db.execute(`
            INSERT INTO leads (id, userId, firstName, lastName, email, company, city, industry, country, status, createdAt)
            SELECT id, userId, firstName, lastName, email, company, city, industry, country, status, createdAt
            FROM leads_old
        `);

        // 4. Drop old table
        console.log('Cleaning up old table...');
        await db.execute('DROP TABLE leads_old');

        // 5. Re-create the index
        console.log('Creating indexes...');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_leads_userId ON leads(userId)');

        console.log('Migration successful: Leads are now unique per-user instead of globally.');
    } catch (e) {
        console.error('Migration failed:', e);
        // Try to recover if possible
        try {
            console.log('Attempting rollback...');
            await db.execute('ALTER TABLE leads_old RENAME TO leads');
        } catch (res_e) { }
    } finally {
        process.exit(0);
    }
}

migrate();
