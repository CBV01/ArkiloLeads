export interface Lead {
  id: string
  userId?: string
  firstName: string
  lastName: string
  email: string
  company: string
  city: string
  industry: string
  country: string
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'replied' | 'failed'
  createdAt: string
}

export interface EmailTemplate {
  id: string
  userId?: string
  name: string
  subject: string
  body: string
}

export interface Playbook {
  id: string
  userId?: string
  industry: string
  problems: string[]
}

export interface AnalyticsData {
  date: string
  sent: number
  opens: number
  clicks: number
  replies: number
}

export interface SendingStatus {
  leadId: string
  status: 'pending' | 'sending' | 'sent' | 'failed'
  progress: number
}
