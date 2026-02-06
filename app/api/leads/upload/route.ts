import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { leads: incomingLeads } = await req.json();

        if (!Array.isArray(incomingLeads)) {
            return NextResponse.json({ error: 'Invalid leads data' }, { status: 400 });
        }

        // 1. Get existing leads for this user to check for duplicates
        const existingLeadsRes = await db.execute({
            sql: 'SELECT email FROM leads WHERE userId = ?',
            args: [session.id]
        });
        const existingEmails = new Set(existingLeadsRes.rows.map(r => (r.email as string).toLowerCase()));

        // 2. Filter out duplicates and invalid leads
        const newLeads = [];
        let duplicateCount = 0;
        const seenInBatch = new Set(); // Prevent duplicates within the same CSV

        for (const lead of incomingLeads) {
            if (!lead.email) continue;

            const emailLower = lead.email.toLowerCase();
            if (existingEmails.has(emailLower) || seenInBatch.has(emailLower)) {
                duplicateCount++;
                continue;
            }

            seenInBatch.add(emailLower);
            newLeads.push({
                ...lead,
                id: lead.id || uuidv4()
            });
        }

        // 3. Prepare Batch Insert
        const leadStatements = newLeads.map(lead => ({
            sql: `INSERT INTO leads (id, userId, firstName, lastName, email, company, city, industry, country, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                lead.id,
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

        // 4. Execute in chunks
        const chunkSize = 100;
        let importedCount = 0;
        for (let i = 0; i < leadStatements.length; i += chunkSize) {
            const chunk = leadStatements.slice(i, i + chunkSize);
            await db.batch(chunk, 'write');
            importedCount += chunk.length;
        }

        // 5. Add notification with detail
        if (importedCount > 0 || duplicateCount > 0) {
            const message = duplicateCount > 0
                ? `Imported ${importedCount} new leads. ${duplicateCount} duplicates were skipped.`
                : `Successfully imported ${importedCount} leads.`;

            await db.execute({
                sql: 'INSERT INTO notifications (id, userId, title, message, type) VALUES (?, ?, ?, ?, ?)',
                args: [uuidv4(), session.id, 'Import Complete', message, duplicateCount > 0 ? 'info' : 'success']
            });
        }

        return NextResponse.json({
            success: true,
            count: importedCount,
            skipped: duplicateCount
        });
    } catch (error) {
        console.error('Failed to upload leads:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
