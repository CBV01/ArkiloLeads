'use client'

import React from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Users,
    Mail,
    TrendingUp,
    BarChart3,
    Activity,
    ArrowUpRight,
    Loader2
} from 'lucide-react'
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function AdminOverview() {
    const [data, setData] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        fetch('/api/admin/overview')
            .then(res => res.json())
            .then(setData)
            .catch(e => toast.error('Failed to load dashboard'))
            .finally(() => setIsLoading(false))
    }, [])

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center p-20 grayscale opacity-50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        )
    }

    const stats = [
        {
            label: 'Users',
            main: data?.stats?.totalUsers || 0,
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            label: 'Leads',
            main: data?.stats?.totalLeads || 0,
            sub: [
                { label: 'Day', val: data?.stats?.dailyLeads || 0 },
                { label: 'Week', val: data?.stats?.weeklyLeads || 0 },
                { label: 'Month', val: data?.stats?.monthlyLeads || 0 }
            ],
            icon: Activity,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        {
            label: 'Outreach',
            main: data?.stats?.totalSent || 0,
            sub: [
                { label: 'Day', val: data?.stats?.dailySent || 0 },
                { label: 'Week', val: data?.stats?.weeklySent || 0 },
                { label: 'Month', val: data?.stats?.monthlySent || 0 }
            ],
            icon: Mail,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
    ]

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Platform activities and performance monitoring</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="border-border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden group hover:border-primary/50 transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2 text-foreground">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                    <div className={`${stat.bg} p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="text-3xl font-bold font-mono tracking-tighter">
                                        {stat.main.toLocaleString()}
                                    </div>

                                    {stat.sub && (
                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                                            {stat.sub.map((s) => (
                                                <div key={s.label} className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase">{s.label}</span>
                                                    <span className="text-xs font-bold">+{s.val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Activity */}
                    <Card className="border-border bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Live Feed
                            </CardTitle>
                            <CardDescription>Most recent system actions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {data?.recentActivity?.length > 0 ? (
                                    data.recentActivity.map((act: any) => (
                                        <div key={act.id} className="flex items-start gap-4">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                                <Mail className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground leading-none mb-1">
                                                    <span className="text-primary">{act.userName}</span> sent an email
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate italic">to {act.leadEmail}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border bg-card">
                                                {new Date(act.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground py-10">No recent activity found</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Analytics Simulation */}
                    <Card className="border-border bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <ArrowUpRight className="h-5 w-5 text-green-500" />
                                Trends
                            </CardTitle>
                            <CardDescription>Email outreach over the last 7 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[240px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={data?.dailyStats?.map((d: any) => ({
                                            ...d,
                                            date: d.date.split('-').slice(1).join('/')
                                        })) || []}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="adminSent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="adminReplied" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 10 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 10 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="sent"
                                            stroke="var(--primary)"
                                            strokeWidth={3}
                                            fill="url(#adminSent)"
                                            isAnimationActive={true}
                                            animationDuration={1500}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="replies"
                                            stroke="#a855f7"
                                            strokeWidth={3}
                                            fill="url(#adminReplied)"
                                            isAnimationActive={true}
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    )
}
