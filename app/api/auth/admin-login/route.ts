import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        // Check against settings table
        const result = await db.execute({
            sql: 'SELECT value FROM settings WHERE key = ?',
            args: ['admin_password']
        });

        const correctPassword = result.rows[0]?.value;

        if (password === correctPassword) {
            // Create session for admin
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const sessionPayload = {
                id: 'admin_master',
                name: 'System Administrator',
                email: 'admin@arkilo.com',
                role: 'admin',
                passkeyVerified: true, // Admins bypass user passkey
                expires
            };
            const encryptedSession = await encrypt(sessionPayload);

            (await cookies()).set('session', encryptedSession, {
                expires,
                httpOnly: true,
                path: '/',
            });

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
