'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { mockLeads } from '@/lib/mock-data'
import type { Lead } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<
  Lead['status'],
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground border border-border' },
  sent: { label: 'Sent', className: 'bg-success/10 text-success border border-success/30' },
  opened: { label: 'Opened', className: 'bg-blue-500/10 text-blue-500 border border-blue-500/30' },
  clicked: { label: 'Clicked', className: 'bg-purple-500/10 text-purple-500 border border-purple-500/30' },
  replied: { label: 'Replied', className: 'bg-replied/10 text-replied border border-replied/30' },
  failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive border border-destructive/30' },
}

const avatarColors = [
  'bg-primary',
  'bg-chart-2',
  'bg-success',
  'bg-replied',
]

function getAvatarColor(name: string) {
  const charCode = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
  return avatarColors[charCode % avatarColors.length]
}

export function RecentActivity() {
  const recentLeads = mockLeads.slice(0, 5)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest email interactions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentLeads.map((lead) => {
          const status = statusConfig[lead.status]
          const fullName = `${lead.firstName} ${lead.lastName}`
          return (
            <div
              key={lead.id}
              className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <Avatar className={cn('h-9 w-9', getAvatarColor(fullName))}>
                <AvatarFallback className="text-white text-sm font-medium bg-transparent">
                  {lead.firstName[0]}
                  {lead.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {fullName}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {lead.company}
                </p>
              </div>
              <Badge className={cn('text-xs shrink-0', status.className)}>
                {status.label}
              </Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
