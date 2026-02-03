import type { Lead, EmailTemplate, Playbook, AnalyticsData } from './types'

export const mockLeads: Lead[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@techcorp.com',
    company: 'TechCorp Solutions',
    city: 'San Francisco',
    industry: 'Technology',
    country: 'USA',
    status: 'replied',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Rodriguez',
    email: 'm.rodriguez@healthplus.io',
    company: 'HealthPlus',
    city: 'New York',
    industry: 'Healthcare',
    country: 'USA',
    status: 'opened',
    createdAt: '2024-01-16',
  },
  {
    id: '3',
    firstName: 'Emma',
    lastName: 'Williams',
    email: 'emma.w@financegroup.co',
    company: 'Finance Group Ltd',
    city: 'London',
    industry: 'Finance',
    country: 'UK',
    status: 'clicked',
    createdAt: '2024-01-17',
  },
  {
    id: '4',
    firstName: 'James',
    lastName: 'Kim',
    email: 'j.kim@retailmax.com',
    company: 'RetailMax',
    city: 'Toronto',
    industry: 'Retail',
    country: 'Canada',
    status: 'sent',
    createdAt: '2024-01-18',
  },
  {
    id: '5',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria@edulearn.org',
    company: 'EduLearn Academy',
    city: 'Barcelona',
    industry: 'Education',
    country: 'Spain',
    status: 'pending',
    createdAt: '2024-01-19',
  },
  {
    id: '6',
    firstName: 'David',
    lastName: 'Brown',
    email: 'd.brown@manufact.co',
    company: 'ManufactCo',
    city: 'Berlin',
    industry: 'Manufacturing',
    country: 'Germany',
    status: 'failed',
    createdAt: '2024-01-20',
  },
  {
    id: '7',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'l.anderson@techstart.io',
    company: 'TechStart Inc',
    city: 'Austin',
    industry: 'Technology',
    country: 'USA',
    status: 'replied',
    createdAt: '2024-01-21',
  },
  {
    id: '8',
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.t@medisolutions.com',
    company: 'MediSolutions',
    city: 'Chicago',
    industry: 'Healthcare',
    country: 'USA',
    status: 'opened',
    createdAt: '2024-01-22',
  },
]

export const mockTemplates: EmailTemplate[] = [
  {
    id: 'template-1',
    name: 'Template 1: Introduction',
    subject: 'Quick Question for {{Company}}',
    body: `Hi {{First Name}},

I noticed that {{Company}} is making waves in the {{Industry}} industry in {{City}}.

I wanted to reach out because we've been helping similar companies overcome some key challenges they're facing.

Would you be open to a quick 15-minute call this week to explore how we might be able to help {{Company}}?

Best regards,
[Your Name]`,
  },
  {
    id: 'template-2',
    name: 'Template 2: Value Proposition',
    subject: 'Helping {{Company}} with {{Industry}} Challenges',
    body: `Dear {{First Name}},

I've been following {{Company}}'s growth in {{City}}, {{Country}} and I'm impressed with what you've accomplished in the {{Industry}} space.

We specialize in helping {{Industry}} companies tackle their biggest challenges:

[PLAYBOOK_INSERT]

I'd love to share how we've helped other {{Industry}} leaders achieve remarkable results.

Are you available for a brief conversation this week?

Warm regards,
[Your Name]`,
  },
]

export const mockPlaybooks: Playbook[] = [
  {
    id: 'playbook-tech',
    industry: 'Technology',
    problems: [
      'Scaling infrastructure without increasing operational costs',
      'Retaining top engineering talent in a competitive market',
      'Maintaining security compliance across distributed systems',
      'Reducing time-to-market for new features',
      'Managing technical debt while shipping new products',
    ],
  },
  {
    id: 'playbook-healthcare',
    industry: 'Healthcare',
    problems: [
      'Ensuring HIPAA compliance across all patient touchpoints',
      'Reducing administrative burden on clinical staff',
      'Improving patient engagement and retention',
      'Integrating legacy systems with modern platforms',
      'Managing rising operational costs while improving care quality',
    ],
  },
  {
    id: 'playbook-finance',
    industry: 'Finance',
    problems: [
      'Meeting evolving regulatory requirements efficiently',
      'Detecting and preventing fraud in real-time',
      'Delivering personalized services at scale',
      'Modernizing legacy banking infrastructure',
      'Balancing security with seamless customer experience',
    ],
  },
  {
    id: 'playbook-retail',
    industry: 'Retail',
    problems: [
      'Creating seamless omnichannel customer experiences',
      'Optimizing inventory management across locations',
      'Competing with e-commerce giants on convenience',
      'Building customer loyalty in a price-sensitive market',
      'Leveraging data for personalized marketing',
    ],
  },
  {
    id: 'playbook-education',
    industry: 'Education',
    problems: [
      'Engaging students in hybrid and remote learning environments',
      'Personalizing learning paths for diverse student needs',
      'Measuring and improving learning outcomes effectively',
      'Managing limited budgets while adopting new technologies',
      'Ensuring accessibility and equity in education delivery',
    ],
  },
  {
    id: 'playbook-manufacturing',
    industry: 'Manufacturing',
    problems: [
      'Reducing downtime through predictive maintenance',
      'Managing supply chain disruptions and visibility',
      'Implementing automation while maintaining workforce morale',
      'Meeting sustainability and environmental regulations',
      'Ensuring quality control in high-volume production',
    ],
  },
]

export const mockAnalytics: AnalyticsData[] = [
  { date: '2024-01-01', sent: 120, opens: 67, clicks: 28, replies: 12 },
  { date: '2024-01-02', sent: 145, opens: 82, clicks: 35, replies: 15 },
  { date: '2024-01-03', sent: 98, opens: 54, clicks: 22, replies: 9 },
  { date: '2024-01-04', sent: 167, opens: 95, clicks: 41, replies: 18 },
  { date: '2024-01-05', sent: 134, opens: 76, clicks: 32, replies: 14 },
  { date: '2024-01-06', sent: 89, opens: 48, clicks: 19, replies: 8 },
  { date: '2024-01-07', sent: 156, opens: 89, clicks: 38, replies: 17 },
  { date: '2024-01-08', sent: 178, opens: 102, clicks: 45, replies: 21 },
  { date: '2024-01-09', sent: 143, opens: 81, clicks: 34, replies: 15 },
  { date: '2024-01-10', sent: 192, opens: 112, clicks: 48, replies: 23 },
  { date: '2024-01-11', sent: 165, opens: 94, clicks: 40, replies: 18 },
  { date: '2024-01-12', sent: 128, opens: 72, clicks: 30, replies: 13 },
  { date: '2024-01-13', sent: 201, opens: 118, clicks: 52, replies: 25 },
  { date: '2024-01-14', sent: 187, opens: 108, clicks: 46, replies: 22 },
]

export const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Education',
  'Manufacturing',
]

export const countries = ['USA', 'UK', 'Canada', 'Germany', 'Spain', 'France']
