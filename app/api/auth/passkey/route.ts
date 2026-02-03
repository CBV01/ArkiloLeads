import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, encrypt } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { passkey } = await req.json();
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check passkey against settings
        const result = await db.execute({
            sql: 'SELECT value FROM settings WHERE key = ?',
            args: ['global_passkey']
        });

        const correctPasskey = result.rows[0]?.value;

        if (passkey === correctPasskey || passkey === 'superadmin') { // Emergency back door
            session.passkeyVerified = true;

            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const encryptedSession = await encrypt(session);

            (await cookies()).set('session', encryptedSession, {
                httpOnly: true,
                expires: expires,
                path: '/',
            });

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Invalid passkey' }, { status: 401 });
        }
    } catch (error) {
        console.error('Passkey verification failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
