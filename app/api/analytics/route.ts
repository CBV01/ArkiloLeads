import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const userId = session.id;

        // Aggregate stats from analytics table for current user
        const globalStats = await db.execute({
            sql: 'SELECT SUM(sent) as sent, SUM(opens) as opens, SUM(clicks) as clicks, SUM(replies) as replies FROM analytics WHERE userId = ?',
            args: [userId]
        });

        const leadsCount = await db.execute({
            sql: 'SELECT COUNT(*) as count FROM leads WHERE userId = ?',
            args: [userId]
        });

        const stats = globalStats.rows[0] as any || { sent: 0, opens: 0, clicks: 0, replies: 0 };

        // Get chart data for last 7 days for current user
        const chartData = await db.execute({
            sql: `
              SELECT date, sent, opens, clicks, replies 
              FROM analytics 
              WHERE userId = ?
              ORDER BY date DESC 
              LIMIT 7
            `,
            args: [userId]
        });

        return NextResponse.json({
            stats: {
                totalLeads: leadsCount.rows[0].count,
                totalSent: stats.sent || 0,
                totalOpened: stats.opens || 0,
                totalClicked: stats.clicks || 0,
                totalReplied: stats.replies || 0,
            },
            chartData: chartData.rows.reverse()
        });
    } catch (error) {
        console.error('Failed to fetch analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
