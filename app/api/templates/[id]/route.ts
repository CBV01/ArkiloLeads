import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { name, subject, body } = await req.json();

        await db.execute({
            sql: 'UPDATE templates SET name = ?, subject = ?, body = ? WHERE id = ?',
            args: [name, subject, body, id]
        });

        return NextResponse.json({ id, name, subject, body });
    } catch (error) {
        console.error('Failed to update template:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await db.execute({
            sql: 'DELETE FROM templates WHERE id = ?',
            args: [id]
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete template:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
