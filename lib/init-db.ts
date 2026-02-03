import { db } from './db';

export async function initDb() {
  console.log('Initializing database...');

  try {
    // Leads table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        firstName TEXT,
        lastName TEXT,
        email TEXT UNIQUE,
        company TEXT,
        city TEXT,
        industry TEXT,
        country TEXT,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Playbooks table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS playbooks (
        id TEXT PRIMARY KEY,
        industry TEXT UNIQUE,
        problems TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Templates table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT,
        subject TEXT,
        body TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Analytics table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        sent INTEGER DEFAULT 0,
        opens INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        replies INTEGER DEFAULT 0,
        UNIQUE(date)
      );
    `);

    // Email logs
    await db.execute(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        lead_id TEXT,
        template_id TEXT,
        status TEXT,
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

    // SMTP settings per user
    await db.execute(`
      CREATE TABLE IF NOT EXISTS smtp_settings (
        id TEXT PRIMARY KEY,
        userId TEXT,
        host TEXT,
        port INTEGER,
        user TEXT,
        pass TEXT,
        fromEmail TEXT,
        fromName TEXT,
        isActive INTEGER DEFAULT 1,
        slot INTEGER DEFAULT 1,
        dailySent INTEGER DEFAULT 0,
        lastSentAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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

    // Seed Templates
    console.log('Seeding default templates...');
    const defaultTemplates = [
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
