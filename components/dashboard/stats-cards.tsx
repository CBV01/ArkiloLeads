'use client'

import React from "react"

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Send,
  MessageSquare,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ElementType
  color: string
}

function StatsCard({ title, value, change, trend, icon: Icon, color }: StatsCardProps) {
  return (
    <Card className="border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          <div className="flex items-center gap-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                trend === 'up' ? 'text-success' : 'text-destructive'
              )}
            >
              {change}
            </span>
            <span className="text-xs text-muted-foreground">vs last week</span>
          </div>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            color
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

export function StatsCards({ stats }: { stats?: any }) {
  const items: StatsCardProps[] = [
    {
      title: 'Emails Sent',
      value: stats?.totalSent?.toString() || '0',
      change: '+0%',
      trend: 'up',
      icon: Send,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Replies',
      value: stats?.totalReplied?.toString() || '0',
      change: '+0%',
      trend: 'up',
      icon: MessageSquare,
      color: 'bg-replied/10 text-replied',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((stat) => (
        <StatsCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}
