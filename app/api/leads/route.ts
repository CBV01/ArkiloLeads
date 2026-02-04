import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const industry = searchParams.get('industry');
        const country = searchParams.get('country');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '1000');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = 'FROM leads WHERE userId = ?';
        let args: any[] = [session.id];

        if (industry) {
            query += ' AND industry = ?';
            args.push(industry);
        }
        if (country) {
            query += ' AND country = ?';
            args.push(country);
        }
        if (search) {
            query += ' AND (firstName LIKE ? OR lastName LIKE ? OR email LIKE ? OR company LIKE ?)';
            const searchPattern = `%${search}%`;
            args.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        // Get total count for pagination
        const countResult = await db.execute({
            sql: `SELECT COUNT(*) as count ${query}`,
            args
        });
        const total = countResult.rows[0].count;

        // Get paginated data
        const dataResult = await db.execute({
            sql: `SELECT * ${query} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
            args: [...args, limit, offset]
        });

        return NextResponse.json({
            leads: dataResult.rows,
            pagination: {
                total,
                limit,
                offset
            }
        });
    } catch (error) {
        console.error('Failed to fetch leads:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const body = await req.json();
        const { firstName, lastName, email, company, city, industry, country } = body;

        if (!firstName || !email) {
            return NextResponse.json({ error: 'First name and email are required' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        await db.execute({
            sql: `INSERT INTO leads (id, userId, firstName, lastName, email, company, city, industry, country, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                session.id,
                firstName,
                lastName || '',
                email,
                company || '',
                city || '',
                industry || 'Unknown',
                country || '',
                'pending'
            ]
        });

        // Add notification
        await db.execute({
            sql: 'INSERT INTO notifications (id, userId, title, message, type) VALUES (?, ?, ?, ?, ?)',
            args: [crypto.randomUUID(), session.id, 'Lead Added', `Successfully added ${firstName} to your leads.`, 'success']
        });

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
            return NextResponse.json({ error: 'A lead with this email already exists' }, { status: 400 });
        }
        console.error('Failed to add lead:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { id, ids } = await req.json();
        
        if (ids && Array.isArray(ids)) {
            // Bulk Delete
            if (ids.length === 0) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });

            // Create placeholders for SQL IN clause
            const placeholders = ids.map(() => '?').join(',');
            
            await db.execute({
                sql: `DELETE FROM leads WHERE id IN (${placeholders}) AND userId = ?`,
                args: [...ids, session.id]
            });

            // Also delete email logs
            await db.execute({
                sql: `DELETE FROM email_logs WHERE lead_id IN (${placeholders}) AND userId = ?`,
                args: [...ids, session.id]
            });

            return NextResponse.json({ success: true });
        }

        if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });

        await db.execute({
            sql: 'DELETE FROM leads WHERE id = ? AND userId = ?',
            args: [id, session.id]
        });

        // Also delete email logs
        await db.execute({
            sql: 'DELETE FROM email_logs WHERE lead_id = ? AND userId = ?',
            args: [id, session.id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete lead:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
