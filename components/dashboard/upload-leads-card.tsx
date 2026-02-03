'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Upload, FileSpreadsheet, CheckCircle2, X, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function UploadLeadsCard() {
  const [isDragging, setIsDragging] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [isUploaded, setIsUploaded] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const [parsedLeads, setParsedLeads] = React.useState<any[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const mapLeads = (data: any[]) => {
    return data.map((row: any) => {
      const normalizedRow: any = {};
      Object.keys(row).forEach(key => {
        normalizedRow[key.toLowerCase().trim().replace(/[\s_]+/g, '')] = row[key];
      });

      return {
        firstName: normalizedRow['firstname'] || normalizedRow['first'] || normalizedRow['fname'] || '',
        lastName: normalizedRow['lastname'] || normalizedRow['last'] || normalizedRow['lname'] || '',
        email: normalizedRow['email'] || normalizedRow['e-mail'] || normalizedRow['mail'] || '',
        company: normalizedRow['company'] || normalizedRow['companyname'] || normalizedRow['business'] || normalizedRow['org'] || '',
        city: normalizedRow['city'] || normalizedRow['location'] || normalizedRow['town'] || '',
        industry: normalizedRow['industry'] || normalizedRow['sector'] || normalizedRow['category'] || 'Unknown',
        country: normalizedRow['country'] || normalizedRow['nation'] || '',
      };
    }).filter(lead => lead.email && lead.firstName);
  }

  const handleFile = (file: File) => {
    setFile(file)
    const toastId = toast.loading(`Parsing ${file.name}...`)
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const binary = e.target?.result;
          const workbook = XLSX.read(binary, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet);
          const leads = mapLeads(json);
          setParsedLeads(leads);
          setIsUploaded(true);

          if (leads.length > 0) {
            toast.success(`Found ${leads.length} leads`, { id: toastId });
          } else {
            toast.error("No valid leads found. Check your column headers.", { id: toastId });
          }
        } catch (err) {
          toast.error("Failed to parse Excel", { id: toastId });
        }
      };
      reader.readAsBinaryString(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const leads = mapLeads(results.data);
          setParsedLeads(leads);
          setIsUploaded(true);
          if (leads.length > 0) {
            toast.success(`Found ${leads.length} leads`, { id: toastId });
          } else {
            toast.error("No valid leads found. Check your column headers.", { id: toastId });
          }
        },
        error: () => toast.error("Failed to parse CSV", { id: toastId })
      });
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFile(droppedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) handleFile(selectedFile)
  }

  const handleImport = async () => {
    if (parsedLeads.length === 0) return
    setIsImporting(true)
    const toastId = toast.loading(`Importing ${parsedLeads.length} leads to database...`)

    try {
      const res = await fetch('/api/leads/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: parsedLeads }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Successfully imported ${data.count} leads!`, { id: toastId })
        router.push('/leads')
      } else {
        toast.error("Failed to import leads", { id: toastId })
      }
    } catch (err) {
      toast.error("Network error during import", { id: toastId })
    } finally {
      setIsImporting(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setIsUploaded(false)
    setParsedLeads([])
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Upload Leads</CardTitle>
        <p className="text-xs text-muted-foreground">Import leads from CSV or Excel</p>
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          id="leads-upload"
        />

        {!isUploaded ? (
          <label
            htmlFor="leads-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full mb-3',
              isDragging ? 'bg-primary/10' : 'bg-muted'
            )}>
              <Upload className={cn('h-5 w-5', isDragging ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <p className="text-sm font-medium text-center">
              {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">CSV or Excel files</p>
          </label>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 shrink-0">
                <FileSpreadsheet className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file?.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">{parsedLeads.length} leads ready</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={clearFile} disabled={isImporting}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              className="w-full mt-3"
              size="sm"
              onClick={handleImport}
              disabled={isImporting || parsedLeads.length === 0}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Leads'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
