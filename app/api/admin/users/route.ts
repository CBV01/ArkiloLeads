import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get users with detailed stats
        const users = await db.execute(`
            SELECT 
                u.id, u.name, u.email, u.status, u.role, u.createdAt,
                (SELECT COUNT(*) FROM leads l WHERE l.userId = u.id) as leadsCount,
                COALESCE((SELECT SUM(sent) FROM analytics a WHERE a.userId = u.id), 0) as sentCount,
                COALESCE((SELECT SUM(opens) FROM analytics a WHERE a.userId = u.id), 0) as opensCount,
                COALESCE((SELECT SUM(clicks) FROM analytics a WHERE a.userId = u.id), 0) as clicksCount,
                COALESCE((SELECT SUM(replies) FROM analytics a WHERE a.userId = u.id), 0) as repliesCount
            FROM users u
            WHERE u.role = 'user'
            ORDER BY u.createdAt DESC
        `);

        return NextResponse.json(users.rows);
    } catch (error) {
        console.error('Failed to fetch admin users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, status } = await req.json();

        await db.execute({
            sql: 'UPDATE users SET status = ? WHERE id = ?',
            args: [status, userId]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const action = searchParams.get('action'); // 'delete_user' or 'wipe_leads'

        if (action === 'wipe_leads' && userId) {
            await db.execute({ sql: 'DELETE FROM email_logs WHERE userId = ?', args: [userId] });
            await db.execute({ sql: 'DELETE FROM leads WHERE userId = ?', args: [userId] });
            await db.execute({ sql: 'DELETE FROM analytics WHERE userId = ?', args: [userId] });
            return NextResponse.json({ success: true, message: 'Leads wiped' });
        }

        if (action === 'delete_user' && userId) {
            await db.execute({ sql: 'DELETE FROM email_logs WHERE userId = ?', args: [userId] });
            await db.execute({ sql: 'DELETE FROM leads WHERE userId = ?', args: [userId] });
            await db.execute({ sql: 'DELETE FROM analytics WHERE userId = ?', args: [userId] });
            await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [userId] });
            return NextResponse.json({ success: true, message: 'User deleted' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
