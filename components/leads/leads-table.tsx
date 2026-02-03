'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Lead } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Search, Eye, Send, Filter, Download, Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import Link from 'next/link'

interface LeadsTableProps {
  leads: Lead[]
  industries: string[]
  countries: string[]
  onUploadClick?: () => void
  pagination?: {
    total: number
    limit: number
    offset: number
  }
  onPageChange?: (offset: number) => void
  onSearch?: (search: string) => void
}

const statusConfig: Record<
  Lead['status'],
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-muted text-muted-foreground border border-border'
  },
  sent: {
    label: 'Sent',
    className: 'bg-success/10 text-success border border-success/30'
  },
  opened: {
    label: 'Opened',
    className: 'bg-opened/10 text-opened border border-opened/30'
  },
  clicked: {
    label: 'Clicked',
    className: 'bg-clicked/10 text-clicked border border-clicked/30'
  },
  replied: {
    label: 'Replied',
    className: 'bg-replied/10 text-replied border border-replied/30'
  },
  failed: {
    label: 'Failed',
    className: 'bg-destructive/10 text-destructive border border-destructive/30'
  },
}

const avatarColors = [
  'bg-primary',
  'bg-chart-2',
  'bg-success',
  'bg-opened',
  'bg-clicked',
  'bg-replied',
]

function getAvatarColor(name: string) {
  const charCode = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
  return avatarColors[charCode % avatarColors.length]
}

export function LeadsTable({
  leads,
  industries,
  countries,
  onUploadClick,
  pagination,
  onPageChange,
  onSearch
}: LeadsTableProps) {
  const [search, setSearch] = React.useState('')
  const [industryFilter, setIndustryFilter] = React.useState<string[]>([])
  const [countryFilter, setCountryFilter] = React.useState<string[]>([])
  const [selectedLeads, setSelectedLeads] = React.useState<string[]>([])
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      onSearch?.(value)
    }, 400)
  }

  const offset = pagination?.offset || 0
  const limit = pagination?.limit || 50
  const total = pagination?.total || 0
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map((l) => l.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleIndustryFilter = (industry: string) => {
    setIndustryFilter((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    )
  }

  const toggleCountryFilter = (country: string) => {
    setCountryFilter((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    )
  }

  const hasActiveFilters = industryFilter.length > 0 || countryFilter.length > 0

  return (
    <div className="space-y-4">
      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, email, or company..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(hasActiveFilters && 'border-primary text-primary')}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 text-xs">
                    {industryFilter.length + countryFilter.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Industry</h4>
                  <div className="space-y-1.5">
                    {industries.map((industry) => (
                      <label key={industry} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={industryFilter.includes(industry)}
                          onCheckedChange={() => toggleIndustryFilter(industry)}
                        />
                        {industry}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Country</h4>
                  <div className="space-y-1.5 max-h-32 overflow-auto">
                    {countries.map((country) => (
                      <label key={country} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={countryFilter.includes(country)}
                          onCheckedChange={() => toggleCountryFilter(country)}
                        />
                        {country}
                      </label>
                    ))}
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setIndustryFilter([])
                      setCountryFilter([])
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    leads.length > 0 &&
                    selectedLeads.length === leads.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="font-medium hidden md:table-cell">Email</TableHead>
              <TableHead className="font-medium hidden lg:table-cell">Company</TableHead>
              <TableHead className="font-medium hidden lg:table-cell">Industry</TableHead>
              <TableHead className="font-medium hidden xl:table-cell">Location</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const status = statusConfig[lead.status] || statusConfig['pending']
              const fullName = `${lead.firstName} ${lead.lastName}`
              return (
                <TableRow
                  key={lead.id}
                  className={cn(
                    'transition-colors',
                    selectedLeads.includes(lead.id) && 'bg-primary/5'
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => toggleSelect(lead.id)}
                      aria-label={`Select ${fullName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className={cn('h-9 w-9', getAvatarColor(fullName))}>
                        <AvatarFallback className="text-white text-sm font-medium bg-transparent">
                          {lead.firstName[0]}{lead.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {lead.email}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-medium">
                    {lead.company}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline" className="font-normal">
                      {lead.industry}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">
                    {lead.city}, {lead.country}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('font-medium', status.className)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/preview?lead=${lead.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Preview</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/send?leads=${lead.id}`}>
                          <Send className="h-4 w-4" />
                          <span className="sr-only">Send</span>
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer / Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{offset + 1}</span> to <span className="font-medium text-foreground">{Math.min(offset + limit, total)}</span> of <span className="font-medium text-foreground">{total}</span> leads
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(0)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(offset - limit)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 mx-2">
              <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(offset + limit)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.((totalPages - 1) * limit)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
