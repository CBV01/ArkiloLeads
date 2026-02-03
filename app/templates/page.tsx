'use client'

import * as React from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { TemplateEditor } from '@/components/templates/template-editor'
import { EmailTemplate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { InfoNote } from '@/components/ui/info-note'

export default function TemplatesPage() {
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchTemplates = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      setTemplates(data)
    } catch (e) {
      console.error('Failed to fetch templates:', e)
      toast.error('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])





  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Template Management</h1>
              <p className="text-muted-foreground">
                These are the core outreach templates. You can edit their content but the set is fixed.
              </p>
            </div>
            <InfoNote
              title="Smart Templates"
              description="Your templates use {{company}} and other tokens for personalization. Most importantly, the specialized [Problem paragraph] token is where ArkiLeads magically inserts your Playbook points."
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground">No templates found. Please run the database setup script.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {templates.map((template) => (
              <TemplateEditor
                key={template.id}
                template={template}
                canEdit={false}
                canDelete={false}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
