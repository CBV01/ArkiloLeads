'use client'

import * as React from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { EmailPreview } from '@/components/preview/email-preview'
import { Button } from '@/components/ui/button'
import { Lead, EmailTemplate, Playbook } from '@/lib/types'
import { Send, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { InfoNote } from '@/components/ui/info-note'
import { Suspense } from 'react'

function PreviewPageContent() {
  const searchParams = useSearchParams()
  const selectedLeadId = searchParams.get('lead') || undefined

  const [data, setData] = React.useState<{
    leads: Lead[]
    templates: EmailTemplate[]
    playbooks: Playbook[]
  } | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [leadsRes, templatesRes, playbooksRes] = await Promise.all([
          fetch('/api/leads'),
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
          templates,
          playbooks
        })
      } catch (e) {
        console.error('Failed to fetch data for preview:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Email Preview</h1>
            <p className="text-muted-foreground">Preview personalized emails before sending</p>
          </div>
          <InfoNote
            title="Perfect Personalization"
            description="See exactly what your leads will see. We show you how specific tokens and playbook paragraphs look in the final email."
          />
        </div>
        <Button asChild disabled={isLoading}>
          <Link href={selectedLeadId ? `/send?leads=${selectedLeadId}` : '/send'}>
            <Send className="mr-2 h-4 w-4" />
            Send This Email
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 grayscale opacity-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium">Preparing previews...</p>
        </div>
      ) : data && data.leads.length > 0 && data.templates.length > 0 ? (
        <EmailPreview
          leads={data.leads}
          templates={data.templates}
          playbooks={data.playbooks}
          selectedLeadId={selectedLeadId}
        />
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">Please upload leads and create templates first.</p>
        </div>
      )}
    </div>
  )
}

export default function PreviewPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-40 grayscale opacity-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium">Loading...</p>
        </div>
      }>
        <PreviewPageContent />
      </Suspense>
    </DashboardLayout>
  )
}
