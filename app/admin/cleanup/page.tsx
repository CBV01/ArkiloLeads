'use client'

import React from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Eraser,
    Database,
    AlertTriangle,
    Trash2,
    Users,
    Mail,
    Settings,
    Loader2,
    RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function AdminCleanup() {
    const [isCleaning, setIsCleaning] = React.useState<string | null>(null)

    const handleCleanup = async (target: string, label: string) => {
        if (!confirm(`CRITICAL WARNING: This will permanently DELETE all ${label}. This action CANNOT be undone. Are you sure?`)) {
            return
        }

        setIsCleaning(target)
        try {
            const res = await fetch('/api/admin/cleanup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success(data.message)
            } else {
                toast.error(data.error)
            }
        } catch (e) {
            toast.error('Cleanup connection error')
        } finally {
            setIsCleaning(null)
        }
    }

    const cleanTypes = [
        {
            id: 'all_leads',
            title: 'Wipe All Leads',
            description: 'Deletes every lead, email log, and analytic record from all users.',
            icon: Mail,
            color: 'text-red-500',
            bg: 'bg-red-500/10'
        },
        {
            id: 'all_users',
            title: 'Delete All Users',
            description: 'Removes every user account from the system (except yours).',
            icon: Users,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
        {
            id: 'all_smtp',
            title: 'Clear SMTP Library',
            description: 'Removes all saved SMTP and IMAP credentials and settings.',
            icon: Settings,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            id: 'all_tracking',
            title: 'Reset Tracking Stats',
            description: 'Clears all open, click, and reply timestamps without deleting leads.',
            icon: RefreshCw,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
    ]

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
                        <Eraser className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Database Cleaning</h1>
                        <p className="text-muted-foreground mt-1">Permanently remove data to free up system resources</p>
                    </div>
                </div>

                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 mb-8">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-destructive">Administrative Warning</p>
                        <p className="text-destructive/80">These actions are immediate and permanent. We recommend performing a database backup via Turso before proceeding with major cleanups.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {cleanTypes.map((item) => (
                        <Card key={item.id} className="border-border bg-card/50 backdrop-blur-sm hover:border-destructive/30 transition-all">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", item.bg)}>
                                    <item.icon className={cn("h-5 w-5", item.color)} />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{item.title}</CardTitle>
                                    <CardDescription>{item.id.replace('_', ' ')} cleanup</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground min-h-[40px]">
                                    {item.description}
                                </p>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => handleCleanup(item.id, item.title)}
                                    disabled={isCleaning !== null}
                                >
                                    {isCleaning === item.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Execute Cleanup
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AdminLayout>
    )
}
