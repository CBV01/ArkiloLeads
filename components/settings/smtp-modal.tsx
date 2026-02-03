'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ShieldCheck, MailQuestion, Send, Loader2, AlertCircle, CheckCircle2, ChevronRight, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SmtpModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    slot?: number
    onSuccess?: () => void
}

export function SmtpModal({ open, onOpenChange, slot = 1, onSuccess }: SmtpModalProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [isTesting, setIsTesting] = React.useState(false)
    const [showDocs, setShowDocs] = React.useState(false)
    const [settings, setSettings] = React.useState({
        host: 'smtp.gmail.com',
        port: 465,
        user: '',
        pass: '',
        fromEmail: '',
        fromName: 'ArkiLeads'
    })

    React.useEffect(() => {
        if (open) {
            fetchSettings()
            setShowDocs(false)
        }
    }, [open, slot])

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/settings/smtp?slot=${slot}`)
            if (res.ok) {
                const data = await res.json()
                if (data) {
                    setSettings(prev => ({ ...prev, ...data, pass: '' })) // Don't fetch password
                } else {
                    // Reset if slot is empty
                    setSettings({
                        host: 'smtp.gmail.com',
                        port: 465,
                        user: '',
                        pass: '',
                        fromEmail: '',
                        fromName: 'ArkiLeads'
                    })
                }
            }
        } catch (e) {
            console.error('Failed to fetch SMTP settings')
        }
    }

    const handleSave = async (isTest = false) => {
        if (!settings.user || !settings.pass) {
            toast.error('Please provide Gmail address and App Password')
            return
        }

        if (isTest) setIsTesting(true)
        else setIsLoading(true)

        try {
            const res = await fetch('/api/settings/smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, slot, isTest })
            })

            const data = await res.json()

            if (res.ok) {
                if (isTest) {
                    toast.success('Test email sent! Check your inbox.')
                } else {
                    toast.success(`SMTP Slot ${slot} saved successfully`)
                    onSuccess?.()
                    onOpenChange(false)
                }
            } else {
                toast.error(data.error || 'Failed to process request')
            }
        } catch (e) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
            setIsTesting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
                {!showDocs ? (
                    <>
                        <div className="p-6 pb-4 bg-gradient-to-br from-primary/10 via-background to-background">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    Email Configuration
                                </DialogTitle>
                                <DialogDescription className="text-sm pt-1">
                                    ArkiLeads uses your own Gmail to send emails safely. Follow our guide to get started.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 h-[450px] max-h-[60vh] border-b border-border custom-scrollbar">
                            <div className="px-6 py-4 space-y-6 pb-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="host" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SMTP Host</Label>
                                        <Input
                                            id="host"
                                            value={settings.host}
                                            onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                                            placeholder="smtp.gmail.com"
                                            className="bg-muted/30 border-border/50 focus:border-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="port" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Port</Label>
                                        <Input
                                            id="port"
                                            type="number"
                                            value={settings.port}
                                            onChange={(e) => setSettings({ ...settings, port: parseInt(e.target.value) })}
                                            placeholder="465"
                                            className="bg-muted/30 border-border/50 focus:border-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="user" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gmail Address</Label>
                                    <div className="relative">
                                        <Input
                                            id="user"
                                            type="email"
                                            value={settings.user}
                                            onChange={(e) => setSettings({ ...settings, user: e.target.value, fromEmail: settings.fromEmail || e.target.value })}
                                            placeholder="your-name@gmail.com"
                                            className="bg-muted/30 border-border/50 pl-10 focus:border-primary/50 transition-all font-medium"
                                        />
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="pass" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">App Password</Label>
                                        <button
                                            onClick={() => setShowDocs(true)}
                                            className="text-[11px] font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors bg-primary/5 px-2 py-1 rounded-full"
                                        >
                                            <MailQuestion className="h-3 w-3" />
                                            Get Help
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="pass"
                                            type="password"
                                            value={settings.pass}
                                            onChange={(e) => setSettings({ ...settings, pass: e.target.value })}
                                            placeholder="•••• •••• •••• ••••"
                                            className="bg-muted/30 border-border/50 pl-10 focus:border-primary/50 transition-all font-mono"
                                        />
                                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fromName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sender Name</Label>
                                        <Input
                                            id="fromName"
                                            value={settings.fromName}
                                            onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                                            placeholder="John Doe"
                                            className="bg-muted/30 border-border/50 focus:border-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fromEmail" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">From Email</Label>
                                        <Input
                                            id="fromEmail"
                                            value={settings.fromEmail}
                                            onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                                            placeholder="sales@company.com"
                                            className="bg-muted/30 border-border/50 focus:border-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20 flex gap-4 backdrop-blur-sm">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        <strong className="text-foreground">Required:</strong> 2-Step Verification must be active on your Google Account. Regular passwords will not work.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-muted/20 border-t border-border mt-auto">
                            <DialogFooter className="gap-3 sm:gap-0">
                                <Button
                                    variant="outline"
                                    onClick={() => handleSave(true)}
                                    disabled={isTesting || isLoading}
                                    className="flex-1 sm:flex-none border-border hover:bg-background transition-all"
                                >
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Test
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => handleSave(false)}
                                    disabled={isLoading || isTesting}
                                    className="flex-1 sm:flex-none shadow-lg shadow-primary/20 transition-all"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Enable ArkiLeads
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-6 bg-gradient-to-br from-primary/20 via-background to-background">
                            <button
                                onClick={() => setShowDocs(false)}
                                className="text-xs font-bold text-primary flex items-center gap-1 mb-4 hover:opacity-80 transition-all"
                            >
                                <ChevronRight className="h-3 w-3 rotate-180" />
                                Back to Form
                            </button>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">How to get App Password</DialogTitle>
                                <DialogDescription>
                                    Follow these steps to safely allow ArkiLeads to send emails.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 h-[450px] max-h-[60vh] custom-scrollbar">
                            <div className="px-8 py-6 space-y-8 pb-8">
                                <div className="flex gap-4 group">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all">1</div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm">Security Hub</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Go to your <a href="https://myaccount.google.com/security" target="_blank" className="text-primary underline flex-inline items-center gap-1">Google Account Security <ExternalLink className="inline h-3 w-3" /></a> page.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 group">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all">2</div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm">Enable 2-Step Verification</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Under "Signing in to Google," make sure <strong>2-Step Verification</strong> is turned ON. You cannot create App Passwords without this.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 group">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all">3</div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm">Search App Passwords</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Type <span className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">App passwords</span> in the top search bar of your Google Account.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 group">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all">4</div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm">Generate Key</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Enter a name (e.g., "ArkiLeads") and click <strong>Create</strong>. Copy the 16-character code shown.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 group">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all">5</div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm">Paste in ArkiLeads</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Paste that 16-character code into the "App Password" field in the form. No spaces needed!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
                            <Button onClick={() => setShowDocs(false)} className="w-full sm:w-auto">
                                Got it, let's configure
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
