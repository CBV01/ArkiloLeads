import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { leads } = await req.json();

        if (!Array.isArray(leads)) {
            return NextResponse.json({ error: 'Invalid leads data' }, { status: 400 });
        }

        // Insert leads into database using batching for performance
        const leadStatements = leads
            .filter(lead => lead.email && lead.firstName)
            .map(lead => ({
                sql: `INSERT OR REPLACE INTO leads (id, userId, firstName, lastName, email, company, city, industry, country, status) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    lead.id || uuidv4(),
                    session.id,
                    lead.firstName || '',
                    lead.lastName || '',
                    lead.email,
                    lead.company || '',
                    lead.city || '',
                    lead.industry || 'Unknown',
                    lead.country || '',
                    lead.status || 'pending'
                ]
            }));

        // Execute in chunks to avoid overwhelming the database connection
        const chunkSize = 50;
        let count = 0;
        for (let i = 0; i < leadStatements.length; i += chunkSize) {
            const chunk = leadStatements.slice(i, i + chunkSize);
            await db.batch(chunk, 'write');
            count += chunk.length;
        }

        // Add notification
        if (count > 0) {
            const notifId = uuidv4();
            await db.execute({
                sql: 'INSERT INTO notifications (id, userId, title, message, type) VALUES (?, ?, ?, ?, ?)',
                args: [notifId, session.id, 'Import Complete', `Successfully imported ${count} leads to your database.`, 'success']
            });
        }

        return NextResponse.json({ success: true, count });
    } catch (error) {
        console.error('Failed to upload leads:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
