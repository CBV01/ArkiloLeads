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
            sql: 'SELECT * FROM playbooks WHERE userId IS NULL OR userId = ? ORDER BY industry ASC',
            args: [session.id]
        });

        const playbooks = result.rows.map(row => ({
            ...row,
            problems: JSON.parse(row.problems as string)
        }));
        return NextResponse.json(playbooks);
    } catch (error) {
        console.error('Failed to fetch playbooks:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { industry, problems } = await req.json();

        if (!industry || !Array.isArray(problems)) {
            return NextResponse.json({ error: 'Invalid playbook data' }, { status: 400 });
        }

        const id = uuidv4();
        await db.execute({
            sql: 'INSERT INTO playbooks (id, industry, problems, userId) VALUES (?, ?, ?, ?)',
            args: [id, industry, JSON.stringify(problems), session.id]
        });

        return NextResponse.json({ id, industry, problems });
    } catch (error) {
        console.error('Failed to create playbook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
