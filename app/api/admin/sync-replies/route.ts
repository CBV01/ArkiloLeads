import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export async function POST() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        // Fetch ACTIVE SMTP settings 
        const smtpResult = await db.execute({
            sql: 'SELECT user, pass FROM smtp_settings WHERE userId = ? AND isActive = 1',
            args: [session.id]
        });

        const smtp = smtpResult.rows[0];
        if (!smtp || !smtp.user || !smtp.pass) {
            return NextResponse.json({ error: 'No active SMTP/IMAP credentials found' }, { status: 400 });
        }

        const client = new ImapFlow({
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: {
                user: smtp.user as string,
                pass: smtp.pass as string
            },
            logger: false
        });

        await client.connect();
        let lock = await client.getMailboxLock('INBOX');

        let newRepliesCount = 0;

        try {
            // Search for messages from the last 7 days
            let dayOffset = new Date();
            dayOffset.setDate(dayOffset.getDate() - 7);

            let messages = await client.search({
                since: dayOffset
            });

            if (messages && Array.isArray(messages)) {
                for (let uid of messages) {
                    let message = await client.fetchOne(uid, { source: true });
                    if (!message || !message.source) continue;

                    let parsed = await simpleParser(message.source);

                    const fromEmail = parsed.from?.value[0]?.address;
                    if (!fromEmail) continue;

                    // Check if this email corresponds to a lead we've sent to (Case insensitive)
                    const leadRes = await db.execute({
                        sql: 'SELECT id FROM leads WHERE userId = ? AND LOWER(email) = LOWER(?) AND status != "replied"',
                        args: [session.id, fromEmail]
                    });

                    if (leadRes.rows.length > 0) {
                        const leadId = leadRes.rows[0].id as string;

                        // Update lead status
                        await db.execute({
                            sql: 'UPDATE leads SET status = "replied" WHERE id = ? AND userId = ?',
                            args: [leadId, session.id]
                        });

                        // Update email logs
                        await db.execute({
                            sql: 'UPDATE email_logs SET replied_at = CURRENT_TIMESTAMP WHERE lead_id = ? AND userId = ? AND replied_at IS NULL',
                            args: [leadId, session.id]
                        });

                        // Update analytics
                        const today = new Date().toISOString().split('T')[0];
                        await db.execute({
                            sql: `INSERT INTO analytics (userId, date, replies) VALUES (?, ?, 1) 
                                  ON CONFLICT(userId, date) DO UPDATE SET replies = replies + 1`,
                            args: [session.id, today]
                        });

                        newRepliesCount++;
                    }
                }
            }
        } finally {
            lock.release();
        }

        await client.logout();

        return NextResponse.json({
            success: true,
            message: `Sync complete. Found ${newRepliesCount} new replies.`
        });

    } catch (error: any) {
        console.error('IMAP Sync Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to sync replies' }, { status: 500 });
    }
}
