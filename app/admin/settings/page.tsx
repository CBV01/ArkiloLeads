'use client'

import React from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Key,
    User as UserIcon,
    Save,
    ShieldCheck,
    Eye,
    EyeOff,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminSettings() {
    const [passkey, setPasskey] = React.useState('')
    const [adminPassword, setAdminPassword] = React.useState('')
    const [adminDetails, setAdminDetails] = React.useState({ name: '', email: '', password: '' })
    const [isLoading, setIsLoading] = React.useState(true)

    const [isSavingPasskey, setIsSavingPasskey] = React.useState(false)
    const [isSavingAdminPass, setIsSavingAdminPass] = React.useState(false)
    const [isSavingAdmin, setIsSavingAdmin] = React.useState(false)

    const [showPasskey, setShowPasskey] = React.useState(false)
    const [showAdminPass, setShowAdminPass] = React.useState(false)

    React.useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                setPasskey(data.passkey || '')
                setAdminPassword(data.adminPassword || 'admin123')
                setAdminDetails({
                    name: data.admin?.name || 'Admin',
                    email: data.admin?.email || '',
                    password: ''
                })
            })
            .finally(() => setIsLoading(false))
    }, [])

    const handleUpdatePasskey = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingPasskey(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'passkey', passkey })
            })
            if (res.ok) toast.success('Global passkey updated')
        } finally {
            setIsSavingPasskey(false)
        }
    }

    const handleUpdateAdminPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingAdminPass(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'password', password: adminPassword })
            })
            if (res.ok) toast.success('Admin login password updated')
        } finally {
            setIsSavingAdminPass(false)
        }
    }

    const handleUpdateAdmin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingAdmin(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'admin', ...adminDetails })
            })
            if (res.ok) toast.success('Admin details updated')
        } finally {
            setIsSavingAdmin(false)
        }
    }

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center p-20 grayscale opacity-50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground mt-1">Configure global access and administrative credentials</p>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Global Passkey Section */}
                    <Card className="border-border bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-primary" />
                                Global Passkey
                            </CardTitle>
                            <CardDescription>
                                Required for all users. Update this to rotate access credentials.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdatePasskey} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="passkey">Current Passkey</Label>
                                    <div className="relative">
                                        <Input
                                            id="passkey"
                                            type={showPasskey ? "text" : "password"}
                                            value={passkey}
                                            onChange={(e) => setPasskey(e.target.value)}
                                            className="pr-10 bg-background/50 text-lg font-mono tracking-widest"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasskey(!showPasskey)}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPasskey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <Button className="w-full mt-4" type="submit" disabled={isSavingPasskey}>
                                    {isSavingPasskey ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Save Passkey
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Admin Login Password Section */}
                    <Card className="border-border bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Admin Login Password
                            </CardTitle>
                            <CardDescription>
                                This password is for the "/admin" login screen.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="adminPass">Login Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="adminPass"
                                            type={showAdminPass ? "text" : "password"}
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            className="pr-10 bg-background/50 text-lg font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowAdminPass(!showAdminPass)}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        >
                                            {showAdminPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <Button className="w-full mt-4 border-primary/50 text-primary hover:bg-primary/5" variant="outline" type="submit" disabled={isSavingAdminPass}>
                                    {isSavingAdminPass ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Update Admin Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Admin Profile Section */}
                    <Card className="border-border bg-card/50 backdrop-blur-sm lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-primary" />
                                Admin Credentials
                            </CardTitle>
                            <CardDescription>Update your personal administrative account details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="admin-name">Display Name</Label>
                                    <Input
                                        id="admin-name"
                                        value={adminDetails.name}
                                        onChange={(e) => setAdminDetails({ ...adminDetails, name: e.target.value })}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin-email">Admin Email</Label>
                                    <Input
                                        id="admin-email"
                                        type="email"
                                        value={adminDetails.email}
                                        onChange={(e) => setAdminDetails({ ...adminDetails, email: e.target.value })}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="admin-pass">New Password (to login as user)</Label>
                                    <Input
                                        id="admin-pass"
                                        type="password"
                                        placeholder="Leave blank to keep current"
                                        value={adminDetails.password}
                                        onChange={(e) => setAdminDetails({ ...adminDetails, password: e.target.value })}
                                        className="bg-background/50"
                                    />
                                </div>
                                <Button className="md:col-span-2" type="submit" disabled={isSavingAdmin}>
                                    {isSavingAdmin ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Update Admin Profile
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    )
}
