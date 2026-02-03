'use client'

import * as React from 'react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Info, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoNoteProps {
    title: string
    description: string
    className?: string
}

export function InfoNote({ title, description, className }: InfoNoteProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-6 w-6 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 text-primary hover:from-primary hover:to-accent hover:text-white shadow-lg shadow-primary/20 transition-all duration-500 border border-primary/20 animate-pulse-slow",
                        className
                    )}
                >
                    <HelpCircle className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 border-border bg-card/95 backdrop-blur-md shadow-xl" side="top" align="center">
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        {title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    )
}
