import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Stats queries
        const userCount = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const leadCount = await db.execute('SELECT COUNT(*) as count FROM leads');
        const sentCount = await db.execute('SELECT SUM(sent) as count FROM analytics');

        // Time-based stats
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const getSentCount = async (since: string) => {
            const res = await db.execute({
                sql: 'SELECT SUM(sent) as count FROM analytics WHERE date >= ?',
                args: [since]
            });
            return res.rows[0]?.count || 0;
        };

        const getLeadCount = async (since: string) => {
            const res = await db.execute({
                sql: 'SELECT COUNT(*) as count FROM leads WHERE date(createdAt) >= ?',
                args: [since]
            });
            return res.rows[0]?.count || 0;
        };

        // Recent activity (Last 5 email logs with user names)
        const recentActivity = await db.execute(`
            SELECT e.*, u.name as userName, l.email as leadEmail
            FROM email_logs e
            JOIN users u ON e.userId = u.id
            JOIN leads l ON e.lead_id = l.id
            ORDER BY e.sent_at DESC
            LIMIT 5
        `);

        // Get daily stats for chart (Last 7 days)
        const dailyStats = await db.execute(`
            SELECT date, SUM(sent) as sent, SUM(replies) as replies
            FROM analytics
            GROUP BY date
            ORDER BY date DESC
            LIMIT 7
        `);

        return NextResponse.json({
            stats: {
                totalUsers: userCount.rows[0]?.count || 0,
                totalLeads: leadCount.rows[0]?.count || 0,
                totalSent: sentCount.rows[0]?.count || 0,
                dailySent: await getSentCount(today),
                weeklySent: await getSentCount(last7Days),
                monthlySent: await getSentCount(last30Days),
                dailyLeads: await getLeadCount(today),
                weeklyLeads: await getLeadCount(last7Days),
                monthlyLeads: await getLeadCount(last30Days),
            },
            recentActivity: recentActivity.rows,
            dailyStats: dailyStats.rows.reverse()
        });
    } catch (error) {
        console.error('Failed to fetch admin overview:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
