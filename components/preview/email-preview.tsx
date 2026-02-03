'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Lead, EmailTemplate, Playbook } from '@/lib/types'
import { User, Mail, BookOpen, Eye, ChevronLeft, ChevronRight, Send } from 'lucide-react'

interface EmailPreviewProps {
  leads: Lead[]
  templates: EmailTemplate[]
  playbooks: Playbook[]
  selectedLeadId?: string
}

function HighlightedText({ text, lead }: { text: string; lead: Lead }) {
  const getPersonalizedValue = (token: string) => {
    const cleanToken = token.replace(/[{}]/g, '').toLowerCase().trim();
    switch (cleanToken) {
      case 'first name':
      case 'firstname':
      case 'first_name':
        return lead.firstName;
      case 'last name':
      case 'lastname':
      case 'last_name':
        return lead.lastName;
      case 'company':
      case 'companyname':
      case 'company name':
      case 'company_name':
        return lead.company;
      case 'city':
      case 'location':
        return lead.city;
      case 'industry':
      case 'sector':
        return lead.industry;
      case 'country':
      case 'nation':
        return lead.country;
      case 'your name':
      case 'yourname':
      case 'your_name':
        return 'The Team';
      default:
        return token;
    }
  }

  const parts: (string | { token: string; value: string })[] = []
  let lastIndex = 0

  // Find all token positions
  const tokenRegex = /\{\{[^}]+\}\}/g
  let match
  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    const value = getPersonalizedValue(token)
    parts.push({ token, value })
    lastIndex = match.index + token.length
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <span
            key={i}
            className="inline-block rounded bg-token-bg px-1.5 py-0.5 text-token font-medium mx-0.5"
          >
            {part.value}
          </span>
        )
      )}
    </>
  )
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
  body: `Hey {{First Name}},

We understand you’re busy, so I’ll be quick in letting you know something we noticed about {{Company}}.

We saw you’re growing {{Company}} in {{City}}. At many {{Industry}} we’ve worked with, calls and messages often come in faster than anyone can handle or while the team is occupied, no one’s free at the desk.

We built an AI voice receptionist that actually answers calls, handles bookings, and follows up automatically 24/7hr even when you are resting or inactive and,

We made a short demo for {{Company}} showing how it could pick up call, ease call tension and voicemail issues, helping capture more bookings, with at least an increase 20% in confirmed appointments.

Do you have 5 minutes to check it out? If it’s not useful, we can trash it and laugh about it — no pressure.

{{Your name}}`
}

export function EmailPreview({
  leads,
  templates,
  playbooks,
  selectedLeadId,
}: EmailPreviewProps) {
  const [leadIndex, setLeadIndex] = React.useState(() => {
    if (selectedLeadId && leads.length > 0) {
      const idx = leads.findIndex((l) => l.id === selectedLeadId)
      return idx >= 0 ? idx : 0
    }
    return 0
  })

  const [playbookMode, setPlaybookMode] = React.useState<string>('auto')

  // Use real data or placeholders
  const currentLeads = leads.length > 0 ? leads : [placeholderLead]
  const currentTemplates = templates.length > 0 ? templates : [placeholderTemplate]

  const selectedLead = currentLeads[leadIndex] || currentLeads[0]

  // Auto-detect playbook based on industry or use manual selection
  const selectedPlaybook = playbookMode === 'auto'
    ? playbooks.find((p) => p.industry === selectedLead?.industry)
    : playbookMode !== 'none'
      ? playbooks.find((p) => p.id === playbookMode)
      : null

  // PLD Logic: Template 2 if Playbook, Template 1 if No Playbook
  const templateToUse = selectedPlaybook
    ? (currentTemplates.find(t => t.id === 'tpl_playbook') || currentTemplates[0])
    : (currentTemplates.find(t => t.id === 'tpl_generic') || currentTemplates[0])

  const selectedTemplate = templateToUse

  // Dynamically replace the Playbook placeholder in the body
  const playbookPlaceholder = '[Problem paragraph either generic or playbook-driven]';
  let processedBody = selectedTemplate.body;

  if (processedBody.includes(playbookPlaceholder)) {
    let playbookText = '';
    if (selectedPlaybook && selectedPlaybook.problems.length > 0) {
      playbookText = `Based on our experience with other ${selectedLead.industry} companies, we know how challenging it can be when:\n` +
        selectedPlaybook.problems.map(p => `• ${p}`).join('\n');
    } else {
      playbookText = "We've noticed that many companies in your space struggle with consistent lead follow-up and missed booking opportunities.";
    }

    processedBody = processedBody.replace(playbookPlaceholder, playbookText);
  }

  const goToPrevLead = () => {
    setLeadIndex((prev) => (prev > 0 ? prev - 1 : currentLeads.length - 1))
  }

  const goToNextLead = () => {
    setLeadIndex((prev) => (prev < currentLeads.length - 1 ? prev + 1 : 0))
  }

  const subjectTokens = {
    'firstname': selectedLead.firstName,
    'first name': selectedLead.firstName,
    'first_name': selectedLead.firstName,
    'lastname': selectedLead.lastName,
    'last name': selectedLead.lastName,
    'last_name': selectedLead.lastName,
    'company': selectedLead.company,
    'companyname': selectedLead.company,
    'company name': selectedLead.company,
    'company_name': selectedLead.company,
    'city': selectedLead.city,
    'location': selectedLead.city,
    'industry': selectedLead.industry,
    'sector': selectedLead.industry,
    'country': selectedLead.country,
    'your name': 'The Team',
    'yourname': 'The Team',
    'your_name': 'The Team',
  };

  let processedSubject = selectedTemplate.subject;
  Object.entries(subjectTokens).forEach(([token, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, 'gi');
    processedSubject = processedSubject.replace(regex, value || '');
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Left Sidebar */}
      <div className="space-y-4">
        {/* Selected Lead Card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Selected Lead</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevLead}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="font-semibold">{selectedLead.firstName} {selectedLead.lastName}</p>
                <p className="text-sm text-muted-foreground">{selectedLead.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lead {leadIndex + 1} of {currentLeads.length}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextLead}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">{selectedLead.company}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Industry</span>
                <Badge variant="secondary">{selectedLead.industry}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{selectedLead.city}, {selectedLead.country}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Template Card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Active Template</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border">
              <span className="text-sm font-medium">{selectedTemplate.name}</span>
              <Badge variant="outline" className="text-[10px] uppercase">Auto</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 px-1">
              Template switched automatically based on playbook selection.
            </p>
          </CardContent>
        </Card>

        {/* Industry Playbook Card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Industry Playbook</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={playbookMode} onValueChange={setPlaybookMode}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select playbook" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect ({selectedLead.industry})</SelectItem>
                <SelectItem value="none">No Playbook</SelectItem>
                {playbooks.map((playbook) => (
                  <SelectItem key={playbook.id} value={playbook.id}>
                    {playbook.industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPlaybook && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pain Points
                </p>
                <ol className="space-y-1.5">
                  {selectedPlaybook.problems.map((problem, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-muted-foreground">{i + 1}.</span>
                      <span>{problem}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Preview Panel */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <div>
                <CardTitle className="text-base font-medium">Email Preview</CardTitle>
                <p className="text-sm text-muted-foreground">Personalized for {selectedLead.firstName} {selectedLead.lastName}</p>
              </div>
            </div>
            <Badge className="bg-success/10 text-success border border-success/30">
              Live Preview
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Header */}
          <div className="space-y-2 pb-4 border-b border-border">
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground w-16">To:</span>
              <span>{selectedLead.email}</span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground w-16">Subject:</span>
              <span className="font-medium">
                <HighlightedText text={selectedTemplate.subject} lead={selectedLead} />
              </span>
            </div>
          </div>

          {/* Email Body */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap leading-relaxed">
              <HighlightedText text={processedBody} lead={selectedLead} />
            </div>
          </div>

          {/* Playbook Section */}
          {selectedPlaybook && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Optional: Industry-Specific Points
              </p>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm mb-2">
                  Based on my experience with {selectedLead.industry} companies, I understand you might be facing challenges such as:
                </p>
                <ul className="space-y-1">
                  {selectedPlaybook.problems.map((problem, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      <span>{problem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <p className="text-xs text-muted-foreground pt-4 border-t border-border">
            Highlighted tokens are personalized values
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
