import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const result = await db.execute({
            sql: 'SELECT * FROM templates WHERE userId IS NULL OR userId = ? ORDER BY createdAt DESC',
            args: [session.id]
        });
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch templates:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { name, subject, body } = await req.json();

        if (!name || !subject || !body) {
            return NextResponse.json({ error: 'Missing template fields' }, { status: 400 });
        }

        const id = uuidv4();
        await db.execute({
            sql: 'INSERT INTO templates (id, name, subject, body, userId) VALUES (?, ?, ?, ?, ?)',
            args: [id, name, subject, body, session.id]
        });

        return NextResponse.json({ id, name, subject, body });
    } catch (error) {
        console.error('Failed to create template:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
