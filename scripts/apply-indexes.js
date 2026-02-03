const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function applyIndexes() {
    console.log('Applying performance indexes for scalability...');
    const statements = [
        `CREATE INDEX IF NOT EXISTS idx_leads_userId ON leads(userId)`,
        `CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry)`,
        `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`,
        `CREATE INDEX IF NOT EXISTS idx_playbooks_userId ON playbooks(userId)`,
        `CREATE INDEX IF NOT EXISTS idx_playbooks_industry ON playbooks(industry)`,
        `CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId)`,
        `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`,
        `CREATE INDEX IF NOT EXISTS idx_email_logs_userId ON email_logs(userId)`,
        `CREATE INDEX IF NOT EXISTS idx_email_logs_leadId ON email_logs(lead_id)`,
        `CREATE INDEX IF NOT EXISTS idx_analytics_userId ON analytics(userId)`,
        `CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date)`
    ];

    for (const sql of statements) {
        try {
            await db.execute(sql);
            console.log(`Executed: ${sql}`);
        } catch (e) {
            console.error(`Error executing ${sql}:`, e.message);
        }
    }
    console.log('Index application complete.');
    process.exit(0);
}

applyIndexes();
