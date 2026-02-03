const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function restoreOriginalTemplates() {
    const templates = [
        {
            id: 'tpl_generic',
            subject: 'Quick question regarding {{Company}}',
            body: `Hey {{First Name}},

We understand you’re busy, so I’ll be quick in letting you know something we noticed about {{Company}}.

We saw you’re growing {{Company}} in {{City}}. At many {{Industry}} we’ve worked with, calls and messages often come in faster than anyone can handle or while the team is occupied, no one’s free at the desk.

We built an AI voice receptionist that actually answers calls, handles bookings, and follows up automatically 24/7hr even when you are resting or inactive and,

We made a short demo for {{Company}} showing how it could pick up call, ease call tension and voicemail issues, helping capture more bookings, with at least an increase 20% in confirmed appointments.

Do you have 5 minutes to check it out? If it’s not useful, we can trash it and laugh about it — no pressure.

{{Your name}}`
        },
        {
            id: 'tpl_playbook',
            subject: 'Personalized note for {{First Name}} @ {{Company}}',
            body: `Hey {{first_name}},

We understand you’re busy, so I’ll be quick in letting you know something we noticed about {{Company}}.  

[Problem paragraph either generic or playbook-driven]

We built an AI receptionist that actually answers calls, handles bookings, and follows up automatically.  

We made a short demo for {{Company}} showing how it could pick up call, ease call tension and voicemail issues, helping capture more bookings, with at least an increase 20% in confirmed appointments. 

Do you have 5 minutes to check it out?  

If it’s not useful, we can trash it and laugh about it no pressure.  

{{Your name}}
ArkiloStudio`
        }
    ];

    try {
        for (const t of templates) {
            await db.execute({
                sql: 'UPDATE templates SET subject = ?, body = ? WHERE id = ?',
                args: [t.subject, t.body, t.id]
            });
            console.log(`Restored original wording for template: ${t.id}`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

restoreOriginalTemplates();
