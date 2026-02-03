'use client'

import * as React from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { PlaybookEditor } from '@/components/playbooks/playbook-editor'
import { Playbook } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { InfoNote } from '@/components/ui/info-note'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = React.useState<Playbook[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [newIndustry, setNewIndustry] = React.useState('')
  const [newProblem, setNewProblem] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)

  const fetchPlaybooks = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/playbooks')
      const data = await res.json()
      setPlaybooks(data)
    } catch (e) {
      console.error('Failed to fetch playbooks:', e)
      toast.error('Failed to load playbooks')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPlaybooks()
  }, [fetchPlaybooks])

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIndustry || !newProblem) {
      toast.error('Please fill in both fields')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/playbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: newIndustry, problems: [newProblem] })
      })

      if (res.ok) {
        toast.success('Playbook created')
        setIsModalOpen(false)
        setNewIndustry('')
        setNewProblem('')
        fetchPlaybooks()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create playbook')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to create playbook')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playbook?')) return
    try {
      const res = await fetch(`/api/playbooks/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Playbook deleted')
        fetchPlaybooks()
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete playbook')
    }
  }

  const handleSave = async (playbook: Playbook) => {
    try {
      const res = await fetch(`/api/playbooks/${playbook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playbook)
      })
      if (res.ok) {
        toast.success('Playbook updated')
        fetchPlaybooks()
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to update playbook')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Playbook Management</h1>
              <p className="text-muted-foreground">
                Manage industry-specific problem points for personalized outreach
              </p>
            </div>
            <InfoNote
              title="About Playbooks"
              description="Playbooks allow you to store specific 'pain points' for different industries. When you send an email, ArkiLeads automatically injects these points into your templates to make your messages feel 10x more personal."
            />
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button shadow-lg="true">
                <Plus className="mr-2 h-4 w-4" />
                New Playbook
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Playbook</DialogTitle>
                <DialogDescription>
                  Add a new industry and its primary outreach problem point.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateNew}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="industry">Industry / Business Name</Label>
                    <Input
                      id="industry"
                      value={newIndustry}
                      onChange={(e) => setNewIndustry(e.target.value)}
                      placeholder="e.g. Real Estate"
                      autoFocus
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="problem">First Problem Point</Label>
                    <Input
                      id="problem"
                      value={newProblem}
                      onChange={(e) => setNewProblem(e.target.value)}
                      placeholder="e.g. Missing 50% of inbound calls"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Playbook'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium">Loading playbooks...</p>
          </div>
        ) : playbooks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground">No playbooks found. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {playbooks.map((playbook) => (
              <div key={playbook.id} className="h-full">
                <PlaybookEditor
                  playbook={playbook}
                  onSave={handleSave}
                  onDelete={() => handleDelete(playbook.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
