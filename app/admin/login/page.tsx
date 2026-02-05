'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Lock, ShieldAlert } from 'lucide-react'

function AdminLoginForm() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [password, setPassword] = React.useState('')
    const router = useRouter()
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    React.useEffect(() => {
        if (error === 'admin_required') {
            toast.error('System access locked.', {
                description: 'Please authenticate with the master admin password.',
                duration: 5000,
            })
            // Clear current session to allow clean admin login
            fetch('/api/auth/logout', { method: 'POST' })
        }
    }, [error])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            })

            if (res.ok) {
                toast.success('Admin access granted')
                router.push('/admin')
                router.refresh()
            } else {
                toast.error('Invalid administrative password')
            }
        } catch (error) {
            toast.error('Authentication failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <ShieldAlert className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight text-white">Admin Access</CardTitle>
                <CardDescription className="text-zinc-400">
                    Enter master password to unlock administrative panel
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-300">Administrative Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pl-10 h-11 bg-zinc-800/50 border-zinc-700 text-white focus:ring-primary/20"
                                autoFocus
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="pt-6">
                    <Button
                        className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Authenticate System
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

export default function AdminLogin() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Dark Mode Specific Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px]" />
            </div>

            <Suspense fallback={
                <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl h-[400px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </Card>
            }>
                <AdminLoginForm />
            </Suspense>
        </div>
    )
}
