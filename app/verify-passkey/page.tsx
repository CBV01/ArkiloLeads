'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function VerifyPasskeyPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [passkey, setPasskey] = React.useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!passkey) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/auth/passkey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passkey }),
            })

            if (res.ok) {
                toast.success('Access granted')
                router.push('/')
                router.refresh()
            } else {
                toast.error('Invalid passkey')
            }
        } catch (error) {
            toast.error('Verification failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Enter Passkey</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Please enter the global passkey to continue
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="passkey">Security Passkey</Label>
                            <Input
                                id="passkey"
                                type="password"
                                placeholder="••••••"
                                value={passkey}
                                onChange={(e) => setPasskey(e.target.value)}
                                required
                                className="text-center text-xl tracking-[0.5em] h-12"
                                autoFocus
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-4 flex flex-col space-y-4">
                        <Button
                            className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/10"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Access Dashboard'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
