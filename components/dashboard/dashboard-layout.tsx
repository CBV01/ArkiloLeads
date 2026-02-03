'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  BarChart3,
  Users,
  FileText,
  BookOpen,
  Eye,
  Send,
  Menu,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  User,
  Settings,
  Bell,
  Check,
  Mail,
  Lock,
  Info,
  Clock,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { SmtpModal } from '@/components/settings/smtp-modal'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: number
  createdAt: string
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Playbooks', href: '/playbooks', icon: BookOpen },
  { name: 'SMTP Library', href: '/smtp', icon: Settings },
  { name: 'Preview', href: '/preview', icon: Eye },
  { name: 'Send', href: '/send', icon: Send },
]

interface SidebarContentProps {
  collapsed?: boolean
  onToggle?: () => void
}

function SidebarContent({ collapsed = false, onToggle }: SidebarContentProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className={cn(
        'flex h-14 items-center border-b border-border shrink-0',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
            <span className="text-primary-foreground font-bold text-lg leading-none">A</span>
          </div>
          {!collapsed && <span className="text-base font-bold tracking-tight">ArkiLeads</span>}
        </div>
        {!collapsed && onToggle && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>
      <nav className={cn('flex-1 py-3', collapsed ? 'px-2' : 'px-3')}>
        <div className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.name}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.name} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }
            return linkContent
          })}
        </div>
      </nav>

      {!collapsed && (
        <div className="p-4 mt-auto border-t border-border">
          <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Scale Smart</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Use Playbooks to automate personalized pain points in your outreach.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)
  const [user, setUser] = React.useState<any>(null)
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const router = useRouter()

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (e) {
      console.error('Failed to fetch session', e)
    }
  }

  const fetchNotifications = async (showToasts = false) => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        const newNotifs = data.notifications as Notification[]

        if (showToasts) {
          // Check for new unread notifications that aren't in current state
          const existingIds = new Set(notifications.map(n => n.id))
          newNotifs.forEach(n => {
            if (n.read === 0 && !existingIds.has(n.id)) {
              if (n.type === 'success') toast.success(n.title, { description: n.message })
              else if (n.type === 'error') toast.error(n.title, { description: n.message })
              else toast(n.title, { description: n.message })
            }
          })
        }

        setNotifications(newNotifs)
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'POST', body: JSON.stringify({}) })
      setNotifications(notifications.map(n => ({ ...n, read: 1 })))
    } catch (e) {
      console.error('Failed to mark all as read', e)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (e) {
      console.error('Logout failed', e)
    }
  }

  const [smtpConfigured, setSmtpConfigured] = React.useState(true)

  const fetchSmtpStatus = async () => {
    try {
      const res = await fetch('/api/settings/smtp')
      if (res.ok) {
        const data = await res.json()
        const isConfigured = Array.isArray(data) && data.some((s: any) => s.user && s.isActive)
        setSmtpConfigured(isConfigured)
      }
    } catch (e) {
      console.error('Failed to fetch SMTP status')
    }
  }

  React.useEffect(() => {
    fetchUser()
    fetchNotifications(false)
    fetchSmtpStatus()
    const interval = setInterval(() => fetchNotifications(true), 15000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter(n => n.read === 0).length

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar - Fixed */}
        <aside className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card shrink-0 transition-all duration-200',
          collapsed ? 'w-16' : 'w-56'
        )}>
          <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-3 top-3 z-40 lg:hidden h-8 w-8"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 shrink-0">
            <div className="flex items-center gap-2">
              {collapsed && (
                <Button variant="ghost" size="icon" className="hidden lg:flex h-8 w-8" onClick={() => setCollapsed(false)}>
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!smtpConfigured && (
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-highlight/10 text-highlight animate-pulse shadow-[0_0_15px_-3px_rgba(255,59,48,0.3)]">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-bold tracking-tight">Email System Offline</span>
                  </div>
                  <Link
                    href="/smtp"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-highlight text-white hover:opacity-90 transition-all shadow-lg shadow-highlight/20 active:scale-95 shrink-0"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="text-[12px] font-bold whitespace-nowrap">Configure Now</span>
                  </Link>
                </div>
              )}

              <ThemeToggle />

              {/* SMTP Settings Gear Icon */}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href="/smtp"
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted relative",
                      !smtpConfigured && "text-highlight"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    {!smtpConfigured && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-highlight opacity-75 animate-ping"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-highlight"></span>
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[11px] font-medium">
                  {smtpConfigured ? "Email Settings" : "SMTP Missing"}
                </TooltipContent>
              </Tooltip>

              {/* Notification Bell */}
              <DropdownMenu open={notifOpen} onOpenChange={(open) => {
                setNotifOpen(open)
                if (!open && unreadCount > 0) markAllAsRead()
              }}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1 top-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-0" align="end">
                  <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                  <ScrollArea className="h-[350px]">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-border">
                        {notifications.map((n) => (
                          <div key={n.id} className={cn(
                            "p-4 transition-colors hover:bg-muted/50",
                            n.read === 0 && "bg-primary/5"
                          )}>
                            <div className="flex gap-3">
                              <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                                n.type === 'success' ? 'bg-success/10 text-success' :
                                  n.type === 'error' ? 'bg-destructive/10 text-destructive' :
                                    'bg-primary/10 text-primary'
                              )}>
                                {n.type === 'success' ? <Check className="h-4 w-4" /> :
                                  n.type === 'error' ? <X className="h-4 w-4" /> :
                                    <Info className="h-4 w-4" />}
                              </div>
                              <div className="flex flex-col gap-1 min-w-0">
                                <p className="text-sm font-medium leading-none truncate">{n.title}</p>
                                <p className="text-xs text-muted-foreground leading-normal line-clamp-2">{n.message}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-muted-foreground/50" />
                                  <span className="text-[10px] text-muted-foreground/50">
                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mb-3 opacity-20" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Manage Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* User Profile Modal */}
          <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>User Profile</DialogTitle>
                <DialogDescription>
                  View your account credentials and security status.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.role?.toUpperCase() || 'USER'} ACCESS</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Email Address</label>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{user?.email}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Security Status</label>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <Lock className="h-4 w-4 text-success" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Password Protected</span>
                        <span className="text-[10px] text-muted-foreground italic">Encrypted and securely stored</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-900/50">
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                    Note: For security reasons, your full password cannot be displayed in cleartext. Contact your admin if you need a password reset.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <main className="flex-1 overflow-auto">
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
