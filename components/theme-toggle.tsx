'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-8 items-center gap-1 rounded-full border border-border bg-muted p-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full">
          <Sun className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full">
          <Moon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    )
  }

  const isLight = resolvedTheme === 'light'

  return (
    <div className="flex h-8 items-center gap-1 rounded-full border border-border bg-muted p-1">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full transition-all',
          isLight ? 'bg-background shadow-sm' : 'hover:bg-background/50'
        )}
        aria-label="Light mode"
      >
        <Sun className={cn('h-3.5 w-3.5', isLight ? 'text-foreground' : 'text-muted-foreground')} />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full transition-all',
          !isLight ? 'bg-background shadow-sm' : 'hover:bg-background/50'
        )}
        aria-label="Dark mode"
      >
        <Moon className={cn('h-3.5 w-3.5', !isLight ? 'text-foreground' : 'text-muted-foreground')} />
      </button>
    </div>
  )
}
