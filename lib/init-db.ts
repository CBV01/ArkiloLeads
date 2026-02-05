import { db } from './db';

export async function initDb() {
  console.log('Initializing database...');

  try {
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
        replied_at DATETIME,
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
        id TEXT PRIMARY KEY,
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
        UNIQUE(userId, slot)
      );
    `);

    // Seed default passkey
    await db.execute(`
      INSERT OR IGNORE INTO settings (key, value) VALUES ('global_passkey', '123456')
    `);

    // --- Performance Indexes ---
    console.log('Creating indexes for scalability...');
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_leads_userId ON leads(userId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_email_logs_userId ON email_logs(userId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_analytics_userId ON analytics(userId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_smtp_settings_userId ON smtp_settings(userId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_playbooks_userId ON playbooks(userId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_templates_userId ON templates(userId)`);

    // Seed Templates
    console.log('Seeding default templates...');
    const defaultTemplates = [
      {
        id: 'tpl_generic',
        name: 'Generic Template (tpl_generic)',
        subject: '{After-hours booking|Quick question|Checking in} at {{Company}}',
        body: `{Hey|Hi|Hello} {{First Name}},

{We understand you’re busy, so I’ll be quick|I’ll keep this brief as I know you have a lot on your plate|Just a quick note} in letting you know something we noticed about {{Company}}.

We saw you’re growing {{Company}} in {{City}}. At many {{Industry}} companies we’ve worked with, calls and messages often come in faster than anyone can handle or while the team is occupied, {no one’s free at the desk|the phones go unanswered}.

We built an AI voice receptionist that actually answers calls, handles bookings, and follows up automatically 24/7hr {even when you are resting or inactive|around the clock} and,

We made a short demo for {{Company}} showing how it could {pick up calls|answer the phone}, {ease call tension|stop missed voicemails} and voicemail issues, helping capture more bookings, with {at least an increase 20%|a 20%+ increase} in confirmed appointments.

{Do you have 5 minutes to check it out?|Any interest in seeing the demo?|Open to a quick look?} if it’s not useful, we can trash it and laugh about it — no pressure.

{{Your name}}`
      },
      {
        id: 'tpl_playbook',
        name: 'Playbook Template (tpl_playbook)',
        subject: '{After-hours booking|Question|New demo} at {{Company}}',
        body: `{Hey|Hi|Hello} {{first_name}},

{We understand you’re busy, so I’ll be quick|I\'ll be brief since I know you\'re likely slammed|Just wanted to share a quick observation} in letting you know something we noticed about {{Company}}.  

[Problem paragraph either generic or playbook-driven]

We built an AI receptionist that actually {answers calls|handles the phones}, {handles bookings|manages appointments}, and follows up automatically.  

We made a short demo for {{Company}} showing how it could {pick up calls|answer every ring}, {ease call tension|eliminate missed voicemails} and voicemail issues, helping capture more bookings, with {at least an increase 20%|over a 20% increase} in confirmed appointments. 

{Do you have 5 minutes to check it out?|Would you be open to seeing how it works?|Worth a 5-minute look?}  

If it’s not useful, we can trash it and laugh about it no pressure.  

{{Your name}}`
      }
    ];

    for (const t of defaultTemplates) {
      await db.execute({
        sql: 'INSERT OR REPLACE INTO templates (id, name, subject, body, userId) VALUES (?, ?, ?, ?, NULL)',
        args: [t.id, t.name, t.subject, t.body]
      });
    }

    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
