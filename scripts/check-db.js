const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

async function checkSchema() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        console.log('--- Database Schema Check ---');

        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables:', tables.rows.map(r => r.name).join(', '));

        for (const table of tables.rows) {
            console.log(`\nTable: ${table.name}`);
            const info = await db.execute(`PRAGMA table_info(${table.name})`);
            console.table(info.rows);

            // Check count
            const count = await db.execute(`SELECT COUNT(*) as count FROM ${table.name}`);
            console.log(`Row count: ${count.rows[0].count}`);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

checkSchema();
