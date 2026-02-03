import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const result = await db.execute({
            sql: "SELECT value FROM settings WHERE key = 'global_broadcast_message' LIMIT 1"
        });

        const message = result.rows[0]?.value || '';
        return NextResponse.json({ message });
    } catch (error) {
        return NextResponse.json({ message: '' });
    }
}
