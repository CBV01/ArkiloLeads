'use client'

import * as React from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { SendQueue } from '@/components/send/send-queue'
import { Lead, EmailTemplate, Playbook } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { InfoNote } from '@/components/ui/info-note'
import { Suspense } from 'react'

function SendPageContent() {
  const searchParams = useSearchParams()
  const selectedLeadIds = searchParams.get('leads')?.split(',').filter(Boolean)

  const [data, setData] = React.useState<{
    leads: Lead[]
    templates: EmailTemplate[]
    playbooks: Playbook[]
  } | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [leadsRes, templatesRes, playbooksRes] = await Promise.all([
        fetch('/api/leads?limit=1000'),
        fetch('/api/templates'),
        fetch('/api/playbooks'),
      ])

      const [leadsData, templates, playbooks] = await Promise.all([
        leadsRes.json(),
        templatesRes.json(),
        playbooksRes.json(),
      ])

      setData({
        leads: Array.isArray(leadsData) ? leadsData : (leadsData.leads || []),
        templates: Array.isArray(templates) ? templates : (templates.templates || []),
        playbooks: Array.isArray(playbooks) ? playbooks : (playbooks.playbooks || [])
      })
    } catch (e) {
      console.error('Failed to fetch data for send:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Send Emails</h1>
        <p className="text-muted-foreground">Send personalized emails to your leads</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 grayscale opacity-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium">Preparing queue...</p>
        </div>
      ) : data && data.leads.length > 0 && data.templates.length > 0 ? (
        <SendQueue
          leads={data.leads}
          templates={data.templates}
          playbooks={data.playbooks}
          selectedLeadIds={selectedLeadIds}
          onLeadsRefresh={() => fetchData()}
        />
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">Please upload leads and create templates first.</p>
        </div>
      )}
    </div>
  )
}

export default function SendPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-40 grayscale opacity-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium">Loading...</p>
        </div>
      }>
        <SendPageContent />
      </Suspense>
    </DashboardLayout>
  )
}
