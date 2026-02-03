import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ logId: string }> }
) {
    const { logId } = await params;

    try {
        // Update the log to mark as opened
        await db.execute({
            sql: 'UPDATE email_logs SET opened_at = CURRENT_TIMESTAMP WHERE id = ? AND opened_at IS NULL',
            args: [logId]
        });

        // Also update analytics and lead status
        const logRes = await db.execute({
            sql: 'SELECT userId, lead_id FROM email_logs WHERE id = ?',
            args: [logId]
        });

        if (logRes.rows.length > 0) {
            const { userId, lead_id } = logRes.rows[0] as unknown as { userId: string, lead_id: string };
            const today = new Date().toISOString().split('T')[0];

            await db.execute({
                sql: `INSERT INTO analytics (userId, date, opens) VALUES (?, ?, 1) 
              ON CONFLICT(userId, date) DO UPDATE SET opens = opens + 1`,
                args: [userId, today]
            });

            await db.execute({
                sql: 'UPDATE leads SET status = "opened" WHERE id = ? AND userId = ?',
                args: [lead_id, userId]
            });
        }

    } catch (error) {
        console.error('Tracking pixel error:', error);
    }

    // Return a 1x1 transparent GIF
    const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
    );

    return new NextResponse(pixel, {
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
