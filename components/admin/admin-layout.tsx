'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
    Users,
    LayoutDashboard,
    Settings,
    LogOut,
    Menu,
    X,
    Mail,
    Search,
    ChevronRight,
    BookOpen,
    PieChart,
    ShieldAlert,
    Sun,
    Moon,
    ChevronLeft,
    PanelLeftClose,
    PanelLeftOpen,
    Eraser
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AdminLayoutProps {
    children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)

    // Wait until mounted to avoid hydration mismatch for theme toggle
    React.useEffect(() => {
        setMounted(true)
    }, [])

    const navItems = [
        { name: 'Overview', href: '/admin', icon: LayoutDashboard },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Global Templates', href: '/admin/templates', icon: Mail },
        { name: 'Global Playbooks', href: '/admin/playbooks', icon: BookOpen },
        { name: 'Database Cleaning', href: '/admin/cleanup', icon: Eraser },
        { name: 'System Settings', href: '/admin/settings', icon: Settings },
    ]

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            toast.success('Logged out successfully')
            router.push('/login')
            router.refresh()
        } catch (e) {
            toast.error('Logout failed')
        }
    }

    if (!mounted) return null

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            {/* Mobile Nav Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShieldAlert className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Arkilo <span className="text-primary text-xs font-mono uppercase bg-primary/10 px-1 rounded ml-1">Admin</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <aside className={cn(
                    "fixed inset-y-0 left-0 z-40 bg-card/50 backdrop-blur-xl border-r border-border transition-all duration-300 ease-in-out lg:translate-x-0 hidden lg:block",
                    isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0",
                    isCollapsed ? "w-20" : "w-72"
                )}>
                    <div className="flex flex-col h-full relative p-4">
                        {/* Collapse Toggle */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="absolute -right-3 top-20 bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center shadow-lg border border-border z-50 hover:scale-110 transition-transform hidden lg:flex"
                        >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </button>

                        {/* Logo */}
                        <div className={cn(
                            "flex items-center gap-3 mb-6 px-2 text-foreground transition-all duration-300",
                            isCollapsed ? "justify-center" : "justify-start"
                        )}>
                            <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
                                <ShieldAlert className="h-5 w-5 text-primary" />
                            </div>
                            {!isCollapsed && (
                                <div className="animate-in fade-in duration-500">
                                    <h1 className="font-bold text-lg tracking-tight leading-none text-foreground">Arkilo</h1>
                                    <span className="text-[9px] text-primary font-mono uppercase tracking-widest">Admin Control</span>
                                </div>
                            )}
                        </div>

                        {/* Nav */}
                        <nav className="flex-1 space-y-1 overflow-y-auto px-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <div className={cn(
                                            "group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer relative",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                            isCollapsed && "justify-center"
                                        )}>
                                            <item.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                                            {!isCollapsed && (
                                                <span className="text-sm font-medium animate-in fade-in slide-in-from-left-2 duration-300">{item.name}</span>
                                            )}
                                            {isActive && !isCollapsed && <ChevronRight className="ml-auto h-3 w-3" />}

                                            {/* Tooltip for collapsed state */}
                                            {isCollapsed && (
                                                <div className="absolute left-16 bg-foreground text-background text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium z-50 whitespace-nowrap border border-border">
                                                    {item.name}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Footer Nav */}
                        <div className="pt-4 border-t border-border mt-auto space-y-1">
                            {/* Theme Toggle */}
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all group relative",
                                    isCollapsed && "justify-center"
                                )}
                            >
                                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                {!isCollapsed && <span className="text-sm font-medium">Theme Mode</span>}
                                {isCollapsed && (
                                    <div className="absolute left-16 bg-foreground text-background text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium z-50 whitespace-nowrap border border-border">
                                        Toggle Theme
                                    </div>
                                )}
                            </button>

                            <Link href="/">
                                <div className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all group relative",
                                    isCollapsed && "justify-center"
                                )}>
                                    <PieChart className="h-4 w-4" />
                                    {!isCollapsed && <span className="text-sm font-medium">User View</span>}
                                    {isCollapsed && (
                                        <div className="absolute left-16 bg-foreground text-background text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium z-50 whitespace-nowrap border border-border">
                                            User View
                                        </div>
                                    )}
                                </div>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10 transition-all group relative",
                                    isCollapsed && "justify-center"
                                )}
                            >
                                <LogOut className="h-4 w-4" />
                                {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
                                {isCollapsed && (
                                    <div className="absolute left-16 bg-destructive text-destructive-foreground text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium z-50 whitespace-nowrap border border-border">
                                        Sign Out
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden animate-in fade-in"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Mobile Sidebar Content */}
                <aside className={cn(
                    "fixed inset-y-0 left-0 z-40 w-72 bg-card border-r border-border transition-transform duration-300 lg:hidden",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="flex flex-col h-full p-6">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-10 px-2">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <ShieldAlert className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="font-bold text-xl tracking-tight leading-none">Arkilo</h1>
                                <span className="text-[10px] text-primary font-mono uppercase tracking-widest">Admin Control</span>
                            </div>
                        </div>

                        {/* Nav */}
                        <nav className="flex-1 space-y-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link key={item.href} href={item.href} onClick={() => setIsSidebarOpen(false)}>
                                        <div className={cn(
                                            "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}>
                                            <item.icon className="h-4 w-4" />
                                            <span className="text-sm font-medium">{item.name}</span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Footer */}
                        <div className="pt-4 border-t border-border mt-auto space-y-1">
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-muted-foreground"
                            >
                                {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                                <span className="text-sm">Theme Mode</span>
                            </button>
                            <Link href="/" onClick={() => setIsSidebarOpen(false)}>
                                <div className="flex items-center gap-3 px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted">
                                    <PieChart className="h-4 w-4" />
                                    <span className="text-sm font-medium">User View</span>
                                </div>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-destructive hover:bg-destructive/10"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="text-sm font-medium">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={cn(
                    "flex-1 min-w-0 min-h-screen transition-all duration-300 bg-background/30",
                    "lg:ml-0", // Default
                    !isCollapsed && "lg:pl-72", // Wide margin when expanded
                    isCollapsed && "lg:pl-20"  // Narrow margin when collapsed
                )}>
                    <div className="px-4 py-8 lg:px-10 lg:py-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
