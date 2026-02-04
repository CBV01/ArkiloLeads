const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is not set');
  process.exit(1);
}

const db = createClient({
  url: url,
  authToken: authToken,
});

async function initDb() {
  console.log('Initializing database tables...');

  try {
    // Drop existing tables only if you explicitly want a full wipe
    // console.log('Resetting schema...');
    // await db.execute(`DROP TABLE IF EXISTS leads`);
    // await db.execute(`DROP TABLE IF EXISTS email_logs`);
    // await db.execute(`DROP TABLE IF EXISTS analytics`);
    // await db.execute(`DROP TABLE IF EXISTS playbooks`);
    // await db.execute(`DROP TABLE IF EXISTS templates`);
    // await db.execute(`DROP TABLE IF EXISTS settings`);
    // Note: Not dropping users table to keep user accounts, 
    // but will use ALTER TABLE to add role/status if they don't exist
    try {
      await db.execute(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
    } catch (e) { /* column might exist */ }
    try {
      await db.execute(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`);
    } catch (e) { /* column might exist */ }

    // Leads table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS leads (
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
      );
    `);

    // Playbooks table (Global if userId is NULL, or per user)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS playbooks (
        id TEXT PRIMARY KEY,
        userId TEXT,
        industry TEXT,
        problems TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, industry)
      );
    `);

    // Templates table (Global if userId is NULL, or per user)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        userId TEXT,
        name TEXT,
        subject TEXT,
        body TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Analytics table (User specific)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        date TEXT,
        sent INTEGER DEFAULT 0,
        opens INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        replies INTEGER DEFAULT 0,
        UNIQUE(userId, date)
      );
    `);

    // Email logs
    await db.execute(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        userId TEXT,
        lead_id TEXT,
        template_id TEXT,
        status TEXT,
        opened_at DATETIME,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id),
        FOREIGN KEY (template_id) REFERENCES templates(id)
      );
    `);

    // Notifications table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT,
        title TEXT,
        message TEXT,
        type TEXT DEFAULT 'info',
        read INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Users table for Authentication
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Settings table for global config (like passkey)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // SMTP settings per user with slots
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

    // Seed default passkey
    await db.execute(`
      INSERT OR IGNORE INTO settings (key, value) VALUES ('global_passkey', '123456')
    `);

    // --- Performance Indexes ---
    console.log('Creating indexes for scalability...');

    // Leads indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_leads_userId ON leads(userId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);

    // Playbooks indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_playbooks_userId ON playbooks(userId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_playbooks_industry ON playbooks(industry)`);

    // Notifications indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`);

    // Email Logs indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_email_logs_userId ON email_logs(userId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_email_logs_leadId ON email_logs(lead_id)`);

    // Analytics indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_analytics_userId ON analytics(userId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date)`);

    // Seed Templates
    console.log('Seeding default templates...');
    const templates = [
      {
        id: 'tpl_generic',
        name: 'Template 1 (Generic)',
        subject: 'Quick question regarding {{Company}}',
        body: `Hey {{First Name}},

We understand you’re busy, so I’ll be quick in letting you know something we noticed about {{Company}}.

We saw you’re growing {{Company}} in {{City}}. At many {{Industry}} companies we’ve worked with, calls and messages often come in faster than anyone can handle or while the team is occupied, no one’s free at the desk.

We built an AI voice receptionist that actually answers calls, handles bookings, and follows up automatically 24/7hr even when you are resting or inactive and,

We made a short demo for {{Company}} showing how it could pick up call, ease call tension and voicemail issues, helping capture more bookings, with at least an increase 20% in confirmed appointments.

Do you have 5 minutes to check it out? If it’s not useful, we can trash it and laugh about it — no pressure.

{{Your name}}
ArkiloStudios`
      },
      {
        id: 'tpl_playbook',
        name: 'Template 2 (Playbook-driven)',
        subject: 'Personalized note for {{First Name}} @ {{Company}}',
        body: `Hey {{first_name}},

We understand you’re busy, so I’ll be quick in letting you know something we noticed about {{Company}}.  

[Problem paragraph either generic or playbook-driven]

We built an AI receptionist that actually answers calls, handles bookings, and follows up automatically.  

We made a short demo for {{Company}} showing how it could pick up call, ease call tension and voicemail issues, helping capture more bookings, with at least an increase 20% in confirmed appointments. 

Do you have 5 minutes to check it out?  

If it’s not useful, we can trash it and laugh about it no pressure.  

{{Your name}}
ArkiloStudios`
      }
    ];

    for (const t of templates) {
      await db.execute({
        sql: 'INSERT OR REPLACE INTO templates (id, name, subject, body) VALUES (?, ?, ?, ?)',
        args: [t.id, t.name, t.subject, t.body]
      });
    }

    console.log('Successfully created all tables and seeded data.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initDb();
