'use client'

import React from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { PlaybookEditor } from '@/components/playbooks/playbook-editor'
import { toast } from 'sonner'
import { Loader2, BookOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function AdminPlaybooks() {
    const [playbooks, setPlaybooks] = React.useState([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [newIndustry, setNewIndustry] = React.useState('')
    const [newProblem, setNewProblem] = React.useState('')
    const [isCreating, setIsCreating] = React.useState(false)

    const fetchPlaybooks = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/playbooks')
            const data = await res.json()
            setPlaybooks(data)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchPlaybooks()
    }, [])

    const handleCreateNew = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newIndustry || !newProblem) {
            toast.error('Please fill in both fields')
            return
        }

        setIsCreating(true)
        try {
            const res = await fetch('/api/admin/playbooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ industry: newIndustry, problems: [newProblem] })
            })

            if (res.ok) {
                toast.success('Global playbook created')
                setIsModalOpen(false)
                setNewIndustry('')
                setNewProblem('')
                fetchPlaybooks()
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to create playbook')
            }
        } catch (e) {
            toast.error('Something went wrong')
        } finally {
            setIsCreating(false)
        }
    }

    const handleUpdate = async (playbook: any) => {
        try {
            const res = await fetch(`/api/admin/playbooks`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(playbook)
            })
            if (res.ok) {
                toast.success('Global playbook updated')
                fetchPlaybooks()
            }
        } catch (e) {
            toast.error('Failed to update')
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Global Playbooks</h1>
                        <p className="text-muted-foreground mt-1 text-lg">Define industry-specific problem sets for all users</p>
                    </div>

                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-lg shadow-primary/20">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Global Playbook
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card/95 backdrop-blur-xl border-border">
                            <DialogHeader>
                                <DialogTitle>Create Global Playbook</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateNew} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="industry">Industry / Business Name</Label>
                                    <Input
                                        id="industry"
                                        placeholder="e.g. Real Estate"
                                        value={newIndustry}
                                        onChange={(e) => setNewIndustry(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="problem">First Problem Point</Label>
                                    <Input
                                        id="problem"
                                        placeholder="e.g. They miss too many after-hour calls"
                                        value={newProblem}
                                        onChange={(e) => setNewProblem(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isCreating}>
                                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Establish Playbook
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center p-20 grayscale opacity-50">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {playbooks.map((playbook: any) => (
                            <PlaybookEditor
                                key={playbook.id}
                                playbook={playbook}
                                onSave={handleUpdate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
