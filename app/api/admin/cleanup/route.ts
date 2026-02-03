import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { target } = await req.json();

        switch (target) {
            case 'all_leads':
                await db.execute('DELETE FROM email_logs');
                await db.execute('DELETE FROM leads');
                await db.execute('DELETE FROM analytics');
                break;
            case 'all_smtp':
                await db.execute('DELETE FROM smtp_settings');
                break;
            case 'all_tracking':
                await db.execute('UPDATE email_logs SET opened_at = NULL, clicked_at = NULL, replied_at = NULL');
                await db.execute('UPDATE analytics SET opens = 0, clicks = 0, replies = 0');
                break;
            case 'all_users':
                // Delete everyone except the admin who is doing the cleaning
                await db.execute({
                    sql: 'DELETE FROM users WHERE role = "user" AND id != ?',
                    args: [session.id]
                });
                break;
            default:
                return NextResponse.json({ error: 'Invalid cleaning target' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: `System cleaned: ${target}` });
    } catch (error: any) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: error.message || 'Cleanup failed' }, { status: 500 });
    }
}
