'use client'

import * as React from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SmtpModal } from '@/components/settings/smtp-modal'
import { Mail, Settings, CheckCircle2, AlertCircle, Plus, Loader2, RefreshCw, Send, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { InfoNote } from '@/components/ui/info-note'

export default function SmtpLibraryPage() {
    const [slots, setSlots] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [modalOpen, setModalOpen] = React.useState(false)
    const [selectedSlot, setSelectedSlot] = React.useState(1)

    const fetchSlots = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/settings/smtp')
            if (res.ok) {
                const data = await res.json()
                setSlots(data)
            }
        } catch (e) {
            toast.error('Failed to load SMTP library')
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchSlots()
    }, [])

    const handleMakeActive = async (slot: number) => {
        try {
            const res = await fetch('/api/settings/smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot, makeActive: true })
            })
            if (res.ok) {
                toast.success(`SMTP Slot ${slot} is now active`)
                fetchSlots()
            } else {
                toast.error('Failed to update active SMTP')
            }
        } catch (e) {
            toast.error('An error occurred')
        }
    }

    const openEditModal = (slot: number) => {
        setSelectedSlot(slot)
        setModalOpen(true)
    }

    // Generate 10 slots
    const allSlots = Array.from({ length: 10 }, (_, i) => {
        const slotNum = i + 1
        const config = slots.find(s => s.slot === slotNum)
        return { slot: slotNum, config }
    })

    const activeSlot = slots.find(s => s.isActive)

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">SMTP Library</h1>
                            <p className="text-muted-foreground">Manage and rotate up to 10 email accounts</p>
                        </div>
                        <InfoNote
                            title="SMTP Rotation"
                            description="Add multiple Gmail accounts to bypass daily limits. You can send 500 emails per day on each account. When one hits the limit, simply switch to the next one."
                        />
                    </div>
                    {activeSlot && (
                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase text-primary tracking-wider">Active Account</span>
                                <span className="text-sm font-semibold">{activeSlot.user}</span>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 grayscale opacity-50">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-sm font-medium">Loading your library...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {allSlots.map(({ slot, config }) => (
                            <Card key={slot} className={cn(
                                "relative overflow-hidden transition-all duration-300 group",
                                config?.isActive ? "border-primary shadow-lg ring-1 ring-primary/20" : "hover:border-muted-foreground/30"
                            )}>
                                {config?.isActive && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-tight">
                                            Active
                                        </div>
                                    </div>
                                )}
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                                            config ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">SMTP Slot {slot}</CardTitle>
                                            <CardDescription className="text-xs truncate max-w-[180px]">
                                                {config ? config.user : 'Unconfigured'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    {config ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-muted/30 p-2 rounded-lg border border-border/50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Daily Usage</span>
                                                    <span className="text-sm font-semibold">{config.dailySent}/500</span>
                                                </div>
                                                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full transition-all",
                                                            config.dailySent >= 500 ? "bg-destructive" : "bg-primary"
                                                        )}
                                                        style={{ width: `${Math.min((config.dailySent / 500) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            {config.dailySent >= 500 && (
                                                <div className="flex items-center gap-1.5 text-[11px] text-destructive bg-destructive/5 p-1.5 rounded-md border border-destructive/10 animate-pulse">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Limit reached for today
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-[60px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/5 opacity-60">
                                            <Plus className="h-4 w-4 text-muted-foreground mb-1" />
                                            <span className="text-[11px] font-medium text-muted-foreground">Click to configure</span>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-2 gap-2">
                                    {config ? (
                                        <>
                                            <Button
                                                variant={config.isActive ? "secondary" : "default"}
                                                size="sm"
                                                className="flex-1 text-xs font-bold"
                                                onClick={() => config.isActive ? openEditModal(slot) : handleMakeActive(slot)}
                                                disabled={config.isActive ? false : config.dailySent >= 500}
                                            >
                                                {config.isActive ? (
                                                    <>
                                                        <Settings className="h-3.5 w-3.5 mr-1.5" />
                                                        Configure
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                                        Make Active
                                                    </>
                                                )}
                                            </Button>
                                            {!config.isActive && (
                                                <Button variant="ghost" size="sm" onClick={() => openEditModal(slot)} className="px-2">
                                                    <Settings className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs font-bold border-dashed hover:border-primary hover:bg-primary/5 transition-all"
                                            onClick={() => openEditModal(slot)}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                                            Configure Slot {slot}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <SmtpModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                slot={selectedSlot}
                onSuccess={fetchSlots}
            />
        </DashboardLayout>
    )
}
