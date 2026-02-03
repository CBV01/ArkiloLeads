import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const playbooks = await db.execute('SELECT * FROM playbooks WHERE userId IS NULL ORDER BY industry ASC');
        return NextResponse.json(playbooks.rows.map(p => ({
            ...p,
            problems: JSON.parse(p.problems as string)
        })));
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { industry, problems } = await req.json();
        const id = uuidv4();

        await db.execute({
            sql: 'INSERT INTO playbooks (id, industry, problems, userId) VALUES (?, ?, ?, NULL)',
            args: [id, industry, JSON.stringify(problems)]
        });

        return NextResponse.json({ id });
    } catch (error) {
        return NextResponse.json({ error: 'Create failed' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, industry, problems } = await req.json();
        await db.execute({
            sql: 'UPDATE playbooks SET industry = ?, problems = ? WHERE id = ? AND userId IS NULL',
            args: [industry, JSON.stringify(problems), id]
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
        const id = searchParams.get('id');

        await db.execute({
            sql: 'DELETE FROM playbooks WHERE id = ? AND userId IS NULL',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
