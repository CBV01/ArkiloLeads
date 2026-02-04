'use client'

import * as React from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { LeadsTable } from '@/components/leads/leads-table'
import { CsvUpload } from '@/components/leads/csv-upload'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Lead } from '@/lib/types'
import { ManualLeadModal } from '@/components/leads/manual-lead-modal'
import { Download, Upload, Loader2, Plus } from 'lucide-react'
import { InfoNote } from '@/components/ui/info-note'

export default function LeadsPage() {
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [manualOpen, setManualOpen] = React.useState(false)
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [pagination, setPagination] = React.useState({ total: 0, limit: 50, offset: 0 })
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchLeads = React.useCallback(async (params: { search?: string, limit?: number, offset?: number } = {}) => {
    setIsLoading(true)
    try {
      const query = new URLSearchParams()
      if (params.search) query.set('search', params.search)
      query.set('limit', (params.limit || 50).toString())
      query.set('offset', (params.offset || 0).toString())

      const res = await fetch(`/api/leads?${query.toString()}`)
      const data = await res.json()
      setLeads(data.leads || [])
      setPagination(data.pagination || { total: 0, limit: 50, offset: 0 })
    } catch (e) {
      console.error('Failed to fetch leads:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Get unique values for filters (In a real scalable app, these would come from a separate lookup API)
  const [industries, setIndustries] = React.useState<string[]>([])
  const [countries, setCountries] = React.useState<string[]>([])

  React.useEffect(() => {
    if (leads.length > 0) {
      setIndustries(prev => Array.from(new Set([...prev, ...leads.map(l => l.industry)])).filter(Boolean).sort())
      setCountries(prev => Array.from(new Set([...prev, ...leads.map(l => l.country)])).filter(Boolean).sort())
    }
  }, [leads])

  const handleDeleteLead = async (id: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        fetchLeads()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete lead')
      }
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      if (res.ok) {
        fetchLeads()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete leads')
      }
    } catch (e) {
      console.error('Bulk delete error:', e)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Lead Management</h1>
              <p className="text-muted-foreground">Manage and organize your email leads</p>
            </div>
            <InfoNote
              title="Managing Your Leads"
              description="Upload your target audience here. We'll automatically categorize them by industry, which allows you to use specific Playbook points for each segment."
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/50 hover:border-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Single Lead</DialogTitle>
                </DialogHeader>
                <ManualLeadModal
                  onSuccess={() => {
                    setManualOpen(false)
                    fetchLeads()
                  }}
                  onClose={() => setManualOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Leads</DialogTitle>
                </DialogHeader>
                <CsvUpload onSuccess={() => {
                  setUploadOpen(false)
                  fetchLeads()
                }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium">Loading leads...</p>
          </div>
        ) : (
          <LeadsTable
            leads={leads}
            industries={industries}
            countries={countries}
            pagination={pagination}
            onPageChange={(offset) => fetchLeads({ offset, limit: pagination.limit })}
            onSearch={(search) => fetchLeads({ search, limit: pagination.limit, offset: 0 })}
            onDelete={handleDeleteLead}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
