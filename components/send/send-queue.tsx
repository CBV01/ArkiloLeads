'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Lead, EmailTemplate, Playbook } from '@/lib/types'
import { Send, Mail, Loader2, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SendQueueProps {
  leads: Lead[]
  templates: EmailTemplate[]
  playbooks: Playbook[]
  selectedLeadIds?: string[]
  onLeadsRefresh?: () => void
}

const avatarColors = [
  'bg-primary',
  'bg-chart-2',
  'bg-success',
  'bg-opened',
  'bg-clicked',
  'bg-replied',
]

function getAvatarColor(name: string) {
  const charCode = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
  return avatarColors[charCode % avatarColors.length]
}

const placeholderLead: Lead = {
  id: 'placeholder',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  company: 'Example Corp',
  city: 'New York',
  industry: 'Technology',
  country: 'USA',
  status: 'pending',
  createdAt: new Date().toISOString()
}

const placeholderTemplate: EmailTemplate = {
  id: 'placeholder',
  name: 'Sample Template',
  subject: 'Quick question regarding {{Company}}',
  body: `Hey {{first_name}},

We understand you’re busy, so I’ll be quick in letting you know something we noticed about {{Company}}.  

[Problem paragraph either generic or playbook-driven]

We built an AI receptionist that actually answers calls, handles bookings, and follows up automatically.  

We made a short demo for {{Company}} showing how it could pick up call, ease call tension and voicemail issues, helping capture more bookings, with at least an increase 20% in confirmed appointments. 

Do you have 5 minutes to check it out?  
If it’s not useful, we can trash it and laugh about it no pressure.  

{{Your name}}
ArkiloStudio`
}

export function SendQueue({
  leads,
  templates,
  playbooks,
  selectedLeadIds,
  onLeadsRefresh
}: SendQueueProps) {
  const currentLeads = leads.length > 0 ? leads : [placeholderLead]
  const currentTemplates = templates.length > 0 ? templates : [placeholderTemplate]

  const initialTemplateId = currentTemplates.length > 0 ? currentTemplates[0].id : placeholderTemplate.id
  const [selectedIds, setSelectedIds] = React.useState<string[]>(selectedLeadIds || [])
  const [isSending, setIsSending] = React.useState(false)
  const [sendingStatus, setSendingStatus] = React.useState<{ [id: string]: 'pending' | 'sending' | 'sent' | 'failed' }>({})
  const [activeSmtp, setActiveSmtp] = React.useState<any>(null)
  const [progress, setProgress] = React.useState({ sent: 0, failed: 0, total: 0 })
  const [statusFilter, setStatusFilter] = React.useState<'pending' | 'sent'>('pending')
  const [page, setPage] = React.useState(1)
  const pageSize = 30

  const fetchActiveSmtp = async () => {
    try {
      const res = await fetch('/api/settings/smtp')
      if (res.ok) {
        const data = await res.json()
        const active = data.find((s: any) => s.isActive)
        setActiveSmtp(active)
      }
    } catch (e) {
      console.error('Failed to fetch active SMTP')
    }
  }

  React.useEffect(() => {
    fetchActiveSmtp()
  }, [])

  const toggleSelect = (id: string) => {
    if (isSending) return
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (isSending) return
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id))
    }
  }

  const handleSendBatch = async () => {
    if (selectedIds.length === 0) return
    if (!activeSmtp) {
      toast.error('No active SMTP account. Please go to SMTP Library to set one up.')
      return
    }

    setIsSending(true)
    setProgress({ sent: 0, failed: 0, total: selectedIds.length })
    const initialStatus: { [id: string]: 'pending' | 'sending' | 'sent' | 'failed' } = {}
    selectedIds.forEach(id => initialStatus[id] = 'pending')
    setSendingStatus(initialStatus)

    let sentCount = 0
    let failCount = 0

    // Safe concurrency and randomized delay for deliverability
    const concurrency = 2
    for (let i = 0; i < selectedIds.length; i += concurrency) {
      const batch = selectedIds.slice(i, i + concurrency)

      try {
        await Promise.all(batch.map(async (id) => {
          setSendingStatus(prev => ({ ...prev, [id]: 'sending' }))

          const lead = currentLeads.find(l => l.id === id)
          if (!lead || lead.id === 'placeholder') {
            setSendingStatus(prev => ({ ...prev, [id]: 'failed' }))
            failCount++
            setProgress(prev => ({ ...prev, failed: failCount }))
            return
          }

          const playbook = playbooks.find((p: Playbook) => p.industry === lead.industry)
          const templateIdToUse = playbook ? 'tpl_playbook' : 'tpl_generic'
          const template = currentTemplates.find(t => t.id === templateIdToUse) || currentTemplates[0]

          const playbookPlaceholder = '[Problem paragraph either generic or playbook-driven]';
          let finalBody = template.body;

          if (finalBody.includes(playbookPlaceholder)) {
            let playbookText = playbook && playbook.problems.length > 0
              ? `Based on our experience with other ${lead.industry} companies, we know how challenging it can be when:\n` +
              playbook.problems.map(p => `• ${p}`).join('\n')
              : "We've noticed that many companies in your space struggle with consistent lead follow-up and missed booking opportunities.";
            finalBody = finalBody.replace(playbookPlaceholder, playbookText);
          }

          const tokens = {
            'firstname': lead.firstName, 'first name': lead.firstName, 'first_name': lead.firstName,
            'company': lead.company, 'company name': lead.company, 'company_name': lead.company,
            'city': lead.city, 'industry': lead.industry,
            'your name': 'The Team'
          };

          let finalSubject = template.subject;
          Object.entries(tokens).forEach(([token, value]) => {
            const regex = new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, 'gi');
            finalBody = finalBody.replace(regex, value);
            finalSubject = finalSubject.replace(regex, value);
          });

          try {
            const res = await fetch('/api/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                leadId: lead.id,
                templateId: template.id,
                subject: finalSubject,
                body: finalBody
              })
            })

            if (res.ok) {
              setSendingStatus(prev => ({ ...prev, [id]: 'sent' }))
              sentCount++
              setProgress(prev => ({ ...prev, sent: sentCount }))
            } else {
              const errorData = await res.json().catch(() => ({}))
              setSendingStatus(prev => ({ ...prev, [id]: 'failed' }))
              failCount++
              setProgress(prev => ({ ...prev, failed: failCount }))

              if (errorData.limitReached) {
                toast.error('SMTP Limit Reached!', {
                  description: 'This SMTP account has reached its 500 email limit. Rotating is required.',
                  duration: 6000
                })
                throw new Error('SMTP_LIMIT_REACHED')
              }

              if (errorData.error?.includes('SMTP')) {
                toast.error('SMTP Connection Failure', { description: errorData.error })
                throw new Error('SMTP_STOP')
              }
            }
          } catch (e: any) {
            if (e.message === 'SMTP_STOP' || e.message === 'SMTP_LIMIT_REACHED') throw e
            setSendingStatus(prev => ({ ...prev, [id]: 'failed' }))
            failCount++
            setProgress(prev => ({ ...prev, failed: failCount }))
          }
        }))
      } catch (e: any) {
        if (e.message === 'SMTP_STOP' || e.message === 'SMTP_LIMIT_REACHED') break
        console.error('Batch error:', e)
      }

      // Delay between parallel batches - slow and randomized for "human" feel
      if (i + concurrency < selectedIds.length) {
        const waitTime = Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    setIsSending(false)
    fetchActiveSmtp() // Refresh usage count
    onLeadsRefresh?.() // Refresh leads list

    if (failCount > 0) {
      toast.warning(`Batch completed: ${sentCount} sent, ${failCount} failed`)
    } else {
      toast.success(`Successfully sent ${sentCount} emails`)
    }
  }

  const totalProgress = progress.sent + progress.failed
  const progressPercentage = progress.total > 0 ? (totalProgress / progress.total) * 100 : 0

  // Filtering and Pagination
  const filteredLeads = currentLeads.filter(l => {
    if (l.id === 'placeholder') return true;
    return statusFilter === 'sent' ? l.status === 'sent' : l.status !== 'sent';
  });

  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Left Panel - Configuration */}
      <div className="space-y-4">
        {/* Active SMTP Card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <RefreshCw className={cn("h-4 w-4 text-primary", isSending && "animate-spin")} />
              <CardTitle className="text-base font-medium">Rotation Status</CardTitle>
            </div>
            {activeSmtp && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase">
                Slot {activeSmtp.slot}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {activeSmtp ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-medium truncate max-w-[150px]">{activeSmtp.user}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span>Daily Limit Usage</span>
                    <span>{activeSmtp.dailySent} / 500</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-500", activeSmtp.dailySent >= 450 ? "bg-destructive" : "bg-success")}
                      style={{ width: `${(activeSmtp.dailySent / 500) * 100}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  asChild
                  disabled={isSending}
                >
                  <Link href="/smtp">
                    Change / Rotate Account <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-3">No active SMTP configured</p>
                <Button size="sm" className="w-full" asChild>
                  <Link href="/smtp">Go to SMTP Library</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Template Card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Smart Templates</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
              <p className="text-sm font-medium text-primary mb-1">PLD Powered Logic</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatically selects templates based on lead industry match.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ready to Send Card */}
        <Card className={cn(
          "border-2 border-dashed transition-colors duration-300",
          isSending ? "border-primary bg-primary/5" : "border-border bg-card"
        )}>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              {isSending ? (
                <div className="w-full space-y-4">
                  <div className="relative h-20 w-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                    <div
                      className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                    />
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">
                      {Math.round(progressPercentage)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Sending Outreach...</h3>
                    <p className="text-sm text-muted-foreground">
                      {progress.sent} sent • {progress.failed} failed
                    </p>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Batch size: {progress.total} leads</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">Ready to Send</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedIds.length} leads selected
                  </p>
                  <Button
                    className="w-full mt-4"
                    disabled={selectedIds.length === 0 || isSending || (selectedIds.length === 1 && selectedIds[0] === 'placeholder') || !activeSmtp || activeSmtp.dailySent >= 500}
                    onClick={handleSendBatch}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Batch
                  </Button>
                  {activeSmtp?.dailySent >= 500 && (
                    <p className="mt-2 text-[10px] text-destructive font-bold uppercase tracking-tight">Limit reached. Rotate SMTP.</p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Lead Selection */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Select Leads to Email</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll} disabled={isSending}>
                  {selectedIds.length === filteredLeads.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex p-1 bg-muted rounded-lg w-fit">
              <button
                onClick={() => { setStatusFilter('pending'); setPage(1); setSelectedIds([]); }}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                  statusFilter === 'pending' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Pending
              </button>
              <button
                onClick={() => { setStatusFilter('sent'); setPage(1); setSelectedIds([]); }}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                  statusFilter === 'sent' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sent
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 mb-4 min-h-[400px]">
            {paginatedLeads.length > 0 ? paginatedLeads.map((lead) => {
              const fullName = `${lead.firstName} ${lead.lastName}`
              const isSelected = selectedIds.includes(lead.id)
              const status = sendingStatus[lead.id]

              return (
                <div
                  key={lead.id}
                  className={cn(
                    'flex items-center gap-4 rounded-lg p-3 transition-colors border border-transparent',
                    isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50',
                    isSending || lead.id === 'placeholder' ? 'cursor-default opacity-80' : 'cursor-pointer'
                  )}
                  onClick={() => lead.id !== 'placeholder' && toggleSelect(lead.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => lead.id !== 'placeholder' && toggleSelect(lead.id)}
                    disabled={isSending || lead.id === 'placeholder'}
                    aria-label={`Select ${fullName}`}
                  />
                  <Avatar className={cn('h-10 w-10', getAvatarColor(fullName))}>
                    <AvatarFallback className="text-white text-sm font-medium bg-transparent">
                      {lead.firstName[0]}{lead.lastName?.[0] || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{fullName}</p>
                      <Badge variant="outline" className="text-xs">
                        {lead.status === 'sent' ? 'Sent' : lead.industry}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    {status === 'sending' && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {status === 'sent' && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    {status === 'failed' && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
              )
            }) : (
              <div className="py-20 text-center text-muted-foreground">
                No {statusFilter} leads found.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} ({filteredLeads.length} leads)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
