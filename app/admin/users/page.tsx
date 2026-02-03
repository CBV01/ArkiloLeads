'use client'

import React from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Users,
    MoreVertical,
    Trash2,
    PauseCircle,
    PlayCircle,
    Eraser,
    Mail,
    Upload,
    User as UserIcon,
    Loader2,
    MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function AdminUsers() {
    const [users, setUsers] = React.useState([])
    const [isLoading, setIsLoading] = React.useState(true)

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users')
            const data = await res.json()
            setUsers(data)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchUsers()
    }, [])

    const handleStatusUpdate = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active'
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status: newStatus })
            })
            if (res.ok) {
                toast.success(`User ${newStatus === 'active' ? 'resumed' : 'paused'}`)
                fetchUsers()
            }
        } catch (e) {
            toast.error('Update failed')
        }
    }

    const handleAction = async (userId: string, action: string) => {
        const confirmMsg = action === 'delete_user'
            ? 'Are you sure you want to PERMANENTLY delete this user?'
            : 'Are you sure you want to WIPE all leads and history for this user?'

        if (!confirm(confirmMsg)) return

        try {
            const res = await fetch(`/api/admin/users?userId=${userId}&action=${action}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast.success(action === 'delete_user' ? 'User deleted' : 'Data wiped')
                fetchUsers()
            }
        } catch (e) {
            toast.error('Action failed')
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Active Users</h1>
                        <p className="text-muted-foreground mt-1">Manage platform accounts and their data usage</p>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/5 border-primary/20 text-primary">
                        {users.length} Users Found
                    </Badge>
                </div>

                <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50 border-b">
                            <TableRow>
                                <TableHead className="w-[30%]">User Profile</TableHead>
                                <TableHead className="w-[15%]">Status</TableHead>
                                <TableHead className="w-[35%] text-center">User Activity</TableHead>
                                <TableHead className="w-[10%]">Joined</TableHead>
                                <TableHead className="w-[10%] text-right pr-6">Manage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-medium">
                                        No active users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user: any) => (
                                    <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                    <UserIcon className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-foreground truncate">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={user.status === 'active' ? 'default' : 'secondary'}
                                                className={cn(
                                                    "capitalize px-2 py-0.5 text-[10px] font-bold tracking-wider",
                                                    user.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                                )}
                                            >
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="grid grid-cols-3 gap-2 items-center text-center">
                                                <div className="flex flex-col items-center gap-1 group/stat" title="Leads Uploaded">
                                                    <Upload className="h-3.5 w-3.5 text-muted-foreground group-hover/stat:text-primary transition-colors" />
                                                    <span className="font-mono text-[11px] font-bold">{user.leadsCount || 0}</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 group/stat" title="Emails Sent">
                                                    <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover/stat:text-primary transition-colors" />
                                                    <span className="font-mono text-[11px] font-bold">{user.sentCount || 0}</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 group/stat" title="Total Replies">
                                                    <MessageSquare className="h-3.5 w-3.5 text-replied group-hover/stat:text-replied/80 transition-colors" />
                                                    <span className="font-mono text-[11px] font-bold">{user.repliesCount || 0}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground font-mono">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="group-hover:bg-card">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-md">
                                                    <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleStatusUpdate(user.id, user.status)}>
                                                        {user.status === 'active' ? (
                                                            <><PauseCircle className="mr-2 h-4 w-4" /> Pause Account</>
                                                        ) : (
                                                            <><PlayCircle className="mr-2 h-4 w-4" /> Resume Account</>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-orange-500" onClick={() => handleAction(user.id, 'wipe_leads')}>
                                                        <Eraser className="mr-2 h-4 w-4" /> Wipe Leads
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleAction(user.id, 'delete_user')}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </AdminLayout>
    )
}
