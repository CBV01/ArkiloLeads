import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Check if user exists
        const existing = await db.execute({
            sql: 'SELECT id FROM users WHERE email = ?',
            args: [email]
        });

        if (existing.rows.length > 0) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        await db.execute({
            sql: 'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
            args: [userId, name, email, hashedPassword]
        });

        // Create session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const sessionPayload = {
            id: userId,
            name,
            email,
            role: 'user',
            passkeyVerified: false,
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
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
