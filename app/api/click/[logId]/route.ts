import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ logId: string }> }
) {
    const { logId } = await params;
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new NextResponse('Missing target URL', { status: 400 });
    }

    try {
        // Log the click
        await db.execute({
            sql: 'UPDATE email_logs SET clicked_at = CURRENT_TIMESTAMP WHERE id = ? AND clicked_at IS NULL',
            args: [logId]
        });

        // Update analytics
        const logRes = await db.execute({
            sql: 'SELECT userId, lead_id FROM email_logs WHERE id = ?',
            args: [logId]
        });

        if (logRes.rows.length > 0) {
            const { userId, lead_id } = logRes.rows[0] as unknown as { userId: string, lead_id: string };
            const today = new Date().toISOString().split('T')[0];

            await db.execute({
                sql: `INSERT INTO analytics (userId, date, clicks) VALUES (?, ?, 1) 
              ON CONFLICT(userId, date) DO UPDATE SET clicks = clicks + 1`,
                args: [userId, today]
            });

            await db.execute({
                sql: 'UPDATE leads SET status = "clicked" WHERE id = ? AND userId = ? AND status NOT IN ("replied")',
                args: [lead_id, userId]
            });
        }
    } catch (error) {
        console.error('Click tracking error:', error);
    }

    // Redirect to the target URL
    return NextResponse.redirect(targetUrl);
}
