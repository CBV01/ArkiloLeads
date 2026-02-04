import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/auth';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { leadId, templateId, subject, body } = await req.json();

        if (!leadId || !templateId) {
            return NextResponse.json({ error: 'Missing lead or template ID' }, { status: 400 });
        }

        // Fetch ACTIVE SMTP settings
        const smtpResult = await db.execute({
            sql: 'SELECT * FROM smtp_settings WHERE userId = ? AND isActive = 1',
            args: [session.id]
        });

        const smtp = smtpResult.rows[0];
        if (!smtp) {
            return NextResponse.json({ error: 'No active SMTP configured. Please go to SMTP Library to set one up.' }, { status: 400 });
        }

        // Auto-reset daily limit if date changed
        if (smtp.lastSentAt) {
            const lastSent = new Date(smtp.lastSentAt as string);
            const today = new Date();
            if (lastSent.toDateString() !== today.toDateString()) {
                await db.execute({
                    sql: 'UPDATE smtp_settings SET dailySent = 0 WHERE userId = ? AND slot = ?',
                    args: [session.id, smtp.slot]
                });
                smtp.dailySent = 0;
            }
        }

        // Check Daily Limit (500)
        if ((smtp.dailySent as number) >= 500) {
            return NextResponse.json({
                error: 'Daily limit reached for this SMTP account (500/500). Please rotate to another SMTP slot in your library.',
                limitReached: true
            }, { status: 403 });
        }

        const logId = uuidv4();

        // Helper function for Spintax {Hi|Hello|Hey}
        const resolveSpintax = (text: string) => {
            return text.replace(/\{([^{}]+)\}/g, (match, options) => {
                const choices = options.split('|');
                return choices[Math.floor(Math.random() * choices.length)];
            });
        };

        const finalSubject = resolveSpintax(subject);
        const finalBody = resolveSpintax(body);

        // Send clean HTML without tracking for better deliverability
        const htmlBody = `
            <div style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px;">
                ${finalBody.replace(/\n/g, '<br />')}
            </div>
        `;

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: (smtp.host as string) || 'smtp.gmail.com',
            port: (smtp.port as number) || 465,
            secure: true,
            auth: {
                user: smtp.user as string,
                pass: smtp.pass as string,
            },
        });

        // Send actual email with both HTML and Plain Text for maximum "Trust" from Gmail
        await transporter.sendMail({
            from: `"${smtp.fromName || 'ArkiLeads'}" <${smtp.fromEmail || smtp.user}>`,
            to: (await db.execute({ sql: 'SELECT email FROM leads WHERE id = ?', args: [leadId] })).rows[0].email as string,
            subject: finalSubject,
            text: finalBody, // Plain text version (Crucial for Inboxing)
            html: htmlBody,
        });

        // 2. Log the email and UPDATE SMTP usage
        try {
            console.log(`[Send API] Starting DB updates for lead ${leadId}, user ${session.id}`);

            // 1. Log Email (Critical for history)
            try {
                await db.execute({
                    sql: 'INSERT INTO email_logs (id, userId, lead_id, template_id, status) VALUES (?, ?, ?, ?, ?)',
                    args: [logId, session.id, leadId, templateId, 'sent']
                });
                console.log(`[Send API] Email log created: ${logId}`);
            } catch (logError: any) {
                console.error('[Send API] Failed to log email:', logError.message);
                // Try fallback without templateId
                try {
                    await db.execute({
                        sql: 'INSERT INTO email_logs (id, userId, lead_id, status) VALUES (?, ?, ?, ?)',
                        args: [logId, session.id, leadId, 'sent']
                    });
                } catch (e) { }
            }

            // 2. Update SMTP Usage (Critical for limit tracking)
            try {
                const slot = Number(smtp.slot);
                const smtpUpdate = await db.execute({
                    sql: 'UPDATE smtp_settings SET dailySent = dailySent + 1, lastSentAt = CURRENT_TIMESTAMP WHERE userId = ? AND slot = ?',
                    args: [session.id, slot]
                });
                console.log(`[Send API] SMTP usage updated. Rows affected: ${smtpUpdate.rowsAffected}`);
            } catch (smtpError: any) {
                console.error('[Send API] Failed to update SMTP usage:', smtpError.message);
            }

            // 3. Update Lead Status (Critical for UI)
            try {
                // First try with userId for security
                let leadUpdate = await db.execute({
                    sql: 'UPDATE leads SET status = ? WHERE id = ? AND userId = ?',
                    args: ['sent', leadId, session.id]
                });

                // If 0 rows affected, it might be a userId mismatch in the DB
                if (leadUpdate.rowsAffected === 0) {
                    console.warn(`[Send API] Lead status update affected 0 rows with userId ${session.id}. Retrying without userId filter.`);
                    leadUpdate = await db.execute({
                        sql: 'UPDATE leads SET status = ? WHERE id = ?',
                        args: ['sent', leadId]
                    });
                }
                console.log(`[Send API] Lead status updated to "sent". Rows affected: ${leadUpdate.rowsAffected}`);
            } catch (leadError: any) {
                console.error('[Send API] Failed to update lead status:', leadError.message);
            }

            // 4. Update analytics (Global dashboard view)
            try {
                const today = new Date().toISOString().split('T')[0];
                await db.execute({
                    sql: `INSERT INTO analytics (userId, date, sent) VALUES (?, ?, 1) 
                          ON CONFLICT(userId, date) DO UPDATE SET sent = sent + 1`,
                    args: [session.id, today]
                });
                console.log(`[Send API] Analytics updated for ${session.id} on ${today}`);
            } catch (analyticsError: any) {
                console.error('[Send API] Analytics update failed:', analyticsError.message);
            }

            // 5. Add Notification
            try {
                await db.execute({
                    sql: 'INSERT INTO notifications (id, userId, title, message, type) VALUES (?, ?, ?, ?, ?)',
                    args: [uuidv4(), session.id, 'Email Sent', `Email sent successfully to lead.`, 'success']
                });
            } catch (e) { }

        } catch (dbError: any) {
            console.error('Serious database error during send:', dbError.message);
        }

        return NextResponse.json({ success: true, logId });
    } catch (error: any) {
        console.error('Failed to execute send route:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
