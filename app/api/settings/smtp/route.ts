import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import nodemailer from 'nodemailer';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const slot = searchParams.get('slot');

        if (slot) {
            const result = await db.execute({
                sql: 'SELECT userId, slot, host, port, user, fromEmail, fromName, isActive, dailySent, lastSentAt FROM smtp_settings WHERE userId = ? AND slot = ?',
                args: [session.id, parseInt(slot)]
            });
            const row: any = result.rows[0];
            if (row && row.lastSentAt) {
                const lastSent = new Date(row.lastSentAt);
                const today = new Date();
                if (lastSent.toDateString() !== today.toDateString()) {
                    await db.execute({
                        sql: 'UPDATE smtp_settings SET dailySent = 0 WHERE userId = ? AND slot = ?',
                        args: [session.id, parseInt(slot)]
                    });
                    row.dailySent = 0;
                }
            }
            return NextResponse.json(row || null);
        }

        const result = await db.execute({
            sql: 'SELECT userId, slot, host, port, user, fromEmail, fromName, isActive, dailySent, lastSentAt FROM smtp_settings WHERE userId = ? ORDER BY slot ASC',
            args: [session.id]
        });

        // Check for reset on all slots
        const slots = await Promise.all(result.rows.map(async (row: any) => {
            if (row.lastSentAt) {
                const lastSent = new Date(row.lastSentAt);
                const today = new Date();
                if (lastSent.toDateString() !== today.toDateString()) {
                    await db.execute({
                        sql: 'UPDATE smtp_settings SET dailySent = 0 WHERE userId = ? AND slot = ?',
                        args: [session.id, row.slot]
                    });
                    return { ...row, dailySent: 0 };
                }
            }
            return row;
        }));

        return NextResponse.json(slots);
    } catch (error) {
        console.error('Failed to fetch SMTP settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const body = await req.json();
        const { slot, host, port, user, pass, fromEmail, fromName, isTest, makeActive } = body;

        if (!slot || slot < 1 || slot > 10) {
            return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
        }

        if (isTest) {
            // Validate SMTP by sending a test email
            const transporter = nodemailer.createTransport({
                host: host || 'smtp.gmail.com',
                port: port || 465,
                secure: true,
                auth: {
                    user: user,
                    pass: pass,
                },
            });

            await transporter.sendMail({
                from: `"${fromName || 'ArkiLeads'}" <${fromEmail || user}>`,
                to: user,
                subject: 'ArkiLeads SMTP Test',
                text: 'Your SMTP settings are working correctly!',
                html: '<b>Your SMTP settings are working correctly!</b>',
            });

            return NextResponse.json({ success: true, message: 'Test email sent successfully' });
        }

        if (makeActive) {
            // Deactivate all others first
            await db.execute({
                sql: 'UPDATE smtp_settings SET isActive = 0 WHERE userId = ?',
                args: [session.id]
            });
            // Activate this one
            await db.execute({
                sql: 'UPDATE smtp_settings SET isActive = 1 WHERE userId = ? AND slot = ?',
                args: [session.id, slot]
            });
            return NextResponse.json({ success: true, message: `SMTP Slot ${slot} is now active` });
        }

        // Save settings for specific slot
        // check if this is the first one, if so make it active
        const existingCountRes = await db.execute({
            sql: 'SELECT COUNT(*) as count FROM smtp_settings WHERE userId = ?',
            args: [session.id]
        });
        const makeInitialActive = existingCountRes.rows[0].count === 0;

        await db.execute({
            sql: `INSERT OR REPLACE INTO smtp_settings (userId, slot, host, port, user, pass, fromEmail, fromName, isActive) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                session.id,
                slot,
                host || 'smtp.gmail.com',
                port || 465,
                user,
                pass,
                fromEmail || user,
                fromName || 'ArkiLeads',
                makeInitialActive ? 1 : 0
            ]
        });

        // Add notification
        await db.execute({
            sql: 'INSERT INTO notifications (id, userId, title, message, type) VALUES (?, ?, ?, ?, ?)',
            args: [crypto.randomUUID(), session.id, 'SMTP Configured', `SMTP Slot ${slot} configured successfully.`, 'success']
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('SMTP Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process SMTP request' }, { status: 400 });
    }
}
