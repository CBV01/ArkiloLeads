'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

// Weekly data for the chart matching the reference design
const weeklyData = [
  { day: 'Mon', sent: 45, opened: 22, clicked: 8, replied: 3 },
  { day: 'Tue', sent: 52, opened: 25, clicked: 10, replied: 5 },
  { day: 'Wed', sent: 38, opened: 18, clicked: 6, replied: 2 },
  { day: 'Thu', sent: 60, opened: 28, clicked: 12, replied: 6 },
  { day: 'Fri', sent: 42, opened: 15, clicked: 5, replied: 2 },
  { day: 'Sat', sent: 15, opened: 8, clicked: 3, replied: 1 },
  { day: 'Sun', sent: 12, opened: 5, clicked: 2, replied: 1 },
]

const chartConfig = {
  sent: {
    label: 'Sent',
    color: 'hsl(250 70% 55%)',
  },
  opens: {
    label: 'Opened',
    color: 'hsl(180 70% 50%)',
  },
  clicks: {
    label: 'Clicked',
    color: 'hsl(145 60% 45%)',
  },
  replies: {
    label: 'Replied',
    color: 'hsl(280 70% 60%)',
  },
} satisfies ChartConfig

export function AnalyticsChart({ data }: { data?: any[] }) {
  const displayData = data && data.length > 0 ? data.map(d => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
  })) : [
    { day: 'Mon', sent: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Tue', sent: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Wed', sent: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Thu', sent: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Fri', sent: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Sat', sent: 0, opens: 0, clicks: 0, replies: 0 },
    { day: 'Sun', sent: 0, opens: 0, clicks: 0, replies: 0 },
  ]

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base font-semibold">Weekly Email Performance</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart
            data={displayData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(250 70% 55%)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(250 70% 55%)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillOpened" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(180 70% 50%)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(180 70% 50%)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillClicked" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(145 60% 45%)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(145 60% 45%)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillReplied" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(280 70% 60%)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(280 70% 60%)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              type="monotone"
              dataKey="replies"
              stroke="hsl(280 70% 60%)"
              fill="url(#fillReplied)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="hsl(145 60% 45%)"
              fill="url(#fillClicked)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="opens"
              stroke="hsl(180 70% 50%)"
              fill="url(#fillOpened)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="sent"
              stroke="hsl(250 70% 55%)"
              fill="url(#fillSent)"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
