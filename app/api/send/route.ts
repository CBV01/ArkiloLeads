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
            // Batch these for speed
            await db.batch([
                {
                    sql: 'INSERT INTO email_logs (id, userId, lead_id, template_id, status) VALUES (?, ?, ?, ?, ?)',
                    args: [logId, session.id, leadId, templateId, 'sent']
                },
                {
                    sql: 'UPDATE smtp_settings SET dailySent = dailySent + 1, lastSentAt = CURRENT_TIMESTAMP WHERE userId = ? AND slot = ?',
                    args: [session.id, smtp.slot]
                },
                {
                    sql: 'UPDATE leads SET status = ? WHERE id = ? AND userId = ?',
                    args: ['sent', leadId, session.id]
                }
            ], 'write');

            // Add a notification for certain intervals or success
            const notifId = uuidv4();
            await db.execute({
                sql: 'INSERT INTO notifications (id, userId, title, message, type) VALUES (?, ?, ?, ?, ?)',
                args: [notifId, session.id, 'Email Sent', `Email sent successfully to lead ID ${leadId}`, 'success']
            });

            // 4. Update analytics (Global dashboard view)
            const today = new Date().toISOString().split('T')[0];
            await db.execute({
                sql: `INSERT INTO analytics (userId, date, sent) VALUES (?, ?, 1) 
              ON CONFLICT(userId, date) DO UPDATE SET sent = sent + 1`,
                args: [session.id, today]
            });
        } catch (dbError) {
            console.error('Database update failed during send:', dbError);
        }

        return NextResponse.json({ success: true, logId });
    } catch (error: any) {
        console.error('Failed to execute send route:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
