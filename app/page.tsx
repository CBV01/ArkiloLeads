'use client'

import * as React from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { AnalyticsChart } from '@/components/dashboard/analytics-chart'
import { UploadLeadsCard } from '@/components/dashboard/upload-leads-card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import { InfoNote } from '@/components/ui/info-note'
import { toast } from 'sonner'

export default function DashboardPage() {
  const [data, setData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics')
        const json = await res.json()
        setData(json)
      } catch (e) {
        console.error('Failed to fetch analytics:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  const [isSyncing, setIsSyncing] = React.useState(false)

  const handleSyncReplies = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/admin/sync-replies', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        toast.success(json.message)
        // Refresh analytics after sync
        const analyticsRes = await fetch('/api/analytics')
        const analyticsJson = await analyticsRes.json()
        setData(analyticsJson)
      } else {
        toast.error(json.error || 'Failed to sync replies')
      }
    } catch (e) {
      toast.error('Connection error during sync')
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40 grayscale opacity-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Overview of your email outreach performance</p>
            </div>
            <InfoNote
              title="Dashboard Overview"
              description="This is your command center. Track your total leads, sent emails, and overall engagement rates. Use the charts below to visualize your growth over time."
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncReplies}
            disabled={isSyncing}
            className="border-primary/50 text-primary hover:bg-primary/5"
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Replies
          </Button>
        </div>

        <StatsCards stats={data?.stats} />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AnalyticsChart data={data?.chartData} />
          </div>
          <div>
            <UploadLeadsCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
