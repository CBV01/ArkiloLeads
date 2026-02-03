import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const passkeyRes = await db.execute({
            sql: 'SELECT value FROM settings WHERE key = ?',
            args: ['global_passkey']
        });

        const adminRes = await db.execute({
            sql: 'SELECT name, email FROM users WHERE id = ?',
            args: [session.id]
        });

        const broadcastRes = await db.execute({
            sql: 'SELECT value FROM settings WHERE key = ?',
            args: ['global_broadcast_message']
        });

        return NextResponse.json({
            passkey: passkeyRes.rows[0]?.value || '',
            broadcast: broadcastRes.rows[0]?.value || '',
            admin: adminRes.rows[0] || { name: 'System Admin', email: 'admin@arkilo.com' }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { type } = body;

        if (type === 'passkey') {
            await db.execute({
                sql: 'UPDATE settings SET value = ? WHERE key = ?',
                args: [body.passkey, 'global_passkey']
            });
            return NextResponse.json({ success: true, message: 'Passkey updated' });
        }

        if (type === 'password') {
            await db.execute({
                sql: 'UPDATE settings SET value = ? WHERE key = ?',
                args: [body.password, 'admin_password']
            });
            return NextResponse.json({ success: true, message: 'Admin login password updated' });
        }

        if (type === 'broadcast') {
            // Check if it exists first because UPDATE won't work if zero rows match
            const exists = await db.execute({
                sql: 'SELECT key FROM settings WHERE key = ?',
                args: ['global_broadcast_message']
            });

            if (exists.rows.length > 0) {
                await db.execute({
                    sql: 'UPDATE settings SET value = ? WHERE key = ?',
                    args: [body.message, 'global_broadcast_message']
                });
            } else {
                await db.execute({
                    sql: 'INSERT INTO settings (key, value) VALUES (?, ?)',
                    args: ['global_broadcast_message', body.message]
                });
            }
            return NextResponse.json({ success: true, message: body.message });
        }

        if (type === 'admin') {
            const { name, email, password } = body;
            const updates = [];
            const args = [];

            if (name) { updates.push('name = ?'); args.push(name); }
            if (email) { updates.push('email = ?'); args.push(email); }
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updates.push('password = ?');
                args.push(hashedPassword);
            }

            if (updates.length > 0) {
                args.push(session.id);
                await db.execute({
                    sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                    args: args
                });
            }
            return NextResponse.json({ success: true, message: 'Admin details updated' });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        console.error('Settings update failed:', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
