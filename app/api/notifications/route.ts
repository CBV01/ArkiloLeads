import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const result = await db.execute({
            sql: 'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
            args: [session.id]
        });

        return NextResponse.json({ notifications: result.rows });
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { id } = await req.json();

        if (id) {
            await db.execute({
                sql: 'UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?',
                args: [id, session.id]
            });
        } else {
            await db.execute({
                sql: 'UPDATE notifications SET read = 1 WHERE userId = ?',
                args: [session.id]
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
