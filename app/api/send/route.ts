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
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // 1. Inject Tracking Pixel (Opens)
        const trackingPixel = `<img src="${baseUrl}/api/track/${logId}" width="1" height="1" style="display:none;" />`;

        // 2. Rewrite Links (Clicks)
        // Find links in the body and wrap them in our tracking redirect
        let trackedBody = body;
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
        trackedBody = trackedBody.replace(linkRegex, (match: string, quote: string, url: string) => {
            // Don't track links that are already tracking links or internal
            if (url.includes('/api/click/')) return match;
            const trackedUrl = `${baseUrl}/api/click/${logId}?url=${encodeURIComponent(url)}`;
            return match.replace(url, trackedUrl);
        });

        const htmlBody = `
            <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                ${trackedBody.replace(/\n/g, '<br />')}
                ${trackingPixel}
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

        // Send actual email
        await transporter.sendMail({
            from: `"${smtp.fromName || 'ArkiLeads'}" <${smtp.fromEmail || smtp.user}>`,
            to: (await db.execute({ sql: 'SELECT email FROM leads WHERE id = ?', args: [leadId] })).rows[0].email as string,
            subject: subject,
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
