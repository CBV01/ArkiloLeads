'use client'

import React from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { TemplateEditor } from '@/components/templates/template-editor'
import { toast } from 'sonner'
import { Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminTemplates() {
    const [templates, setTemplates] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    const fetchTemplates = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/templates')
            const data = await res.json()
            setTemplates(data)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchTemplates()
    }, [])

    const handleSave = async (template: any) => {
        try {
            const isNew = !templates.find((t: any) => t.id === template.id)
            const res = await fetch(`/api/admin/templates`, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(template)
            })
            if (res.ok) {
                toast.success(isNew ? 'Global template created' : 'Global template updated')
                fetchTemplates()
            }
        } catch (e) {
            toast.error('Operation failed')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this global template?')) return
        try {
            const res = await fetch(`/api/admin/templates?id=${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast.success('Global template deleted')
                fetchTemplates()
            }
        } catch (e) {
            toast.error('Failed to delete')
        }
    }

    const createNewTemplate = () => {
        const newTemp: any = {
            id: 'temp-' + Date.now(),
            name: 'New Template',
            subject: 'Subject Line',
            body: 'Email content goes here...',
            userId: null
        }
        setTemplates([newTemp, ...templates])
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Global Templates</h1>
                        <p className="text-muted-foreground mt-1">These templates are available to all users by default</p>
                    </div>
                    <Button onClick={createNewTemplate}>
                        Create New Template
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center p-20 grayscale opacity-50">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {templates.map((template: any) => (
                            <TemplateEditor
                                key={template.id}
                                template={template}
                                onSave={handleSave}
                                onDelete={() => handleDelete(template.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
