import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const result = await db.execute({
            sql: 'SELECT * FROM users WHERE email = ?',
            args: [email]
        });

        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password as string))) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (user.status === 'paused') {
            return NextResponse.json({ error: 'Your account has been paused by the administrator. Please contact support.' }, { status: 403 });
        }

        // Create session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const sessionPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'user',
            passkeyVerified: user.role === 'admin',
            expires
        };
        const encryptedSession = await encrypt(sessionPayload);

        (await cookies()).set('session', encryptedSession, {
            expires,
            httpOnly: true,
            path: '/',
        });

        return NextResponse.json({ success: true, user: sessionPayload });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
