import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { id } = await params;
        const { industry, problems } = await req.json();

        await db.execute({
            sql: 'UPDATE playbooks SET industry = ?, problems = ? WHERE id = ? AND userId = ?',
            args: [industry, JSON.stringify(problems), id, session.id]
        });

        return NextResponse.json({ id, industry, problems });
    } catch (error) {
        console.error('Failed to update playbook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { id } = await params;
        await db.execute({
            sql: 'DELETE FROM playbooks WHERE id = ? AND userId = ?',
            args: [id, session.id]
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete playbook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
