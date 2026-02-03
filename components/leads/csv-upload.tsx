'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, X, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

interface CsvUploadProps {
  onSuccess?: () => void
}

export function CsvUpload({ onSuccess }: CsvUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null)
  const [parsedLeads, setParsedLeads] = React.useState<any[]>([])
  const [isUploading, setIsUploading] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const [isUploaded, setIsUploaded] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const mapLeads = (data: any[]) => {
    return data.map((row: any) => {
      // Create a normalized row with lowercase keys
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

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    setIsUploading(true)
    const toastId = toast.loading(`Parsing ${file.name}...`)

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);

          const leads = mapLeads(json);
          setParsedLeads(leads);
          setIsUploading(false);
          setIsUploaded(true);

          if (leads.length > 0) {
            toast.success(`Found ${leads.length} leads in ${file.name}`, { id: toastId });
          } else {
            toast.error(`No valid leads found in ${file.name}. Ensure you have 'First Name' and 'Email' columns.`, {
              id: toastId,
              duration: 5000
            });
          }
        } catch (error) {
          console.error('Excel parse error:', error);
          toast.error('Failed to parse Excel file', { id: toastId });
          setIsUploading(false);
          clearFile();
        }
      };
      reader.readAsBinaryString(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const leads = mapLeads(results.data);
          setParsedLeads(leads)
          setIsUploading(false)
          setIsUploaded(true)

          if (leads.length > 0) {
            toast.success(`Found ${leads.length} leads in ${file.name}`, { id: toastId })
          } else {
            toast.error(`No valid leads found in ${file.name}. Ensure you have 'First Name' and 'Email' columns.`, {
              id: toastId,
              duration: 5000
            })
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error)
          toast.error('Failed to parse CSV file', { id: toastId })
          setIsUploading(false)
          clearFile()
        }
      })
    }
  }

  const handleImport = async () => {
    if (parsedLeads.length === 0) return

    setIsImporting(true)
    try {
      const response = await fetch('/api/leads/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leads: parsedLeads }),
      })

      if (!response.ok) {
        throw new Error('Failed to upload leads')
      }

      const result = await response.json()
      toast.success(`Successfully imported ${result.count} leads`)
      onSuccess?.()
      clearFile()
    } catch (error) {
      console.error('Error importing leads:', error)
      toast.error('Failed to import leads to database')
    } finally {
      setIsImporting(false)
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setParsedLeads([])
    setIsUploaded(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Upload Leads</CardTitle>
        <p className="text-sm text-muted-foreground">
          Import leads from CSV files (Required: First Name, Email)
        </p>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed transition-all duration-200',
            isDragging
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-muted-foreground/50',
            uploadedFile && !isUploading && 'border-success bg-success/5'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <div className="flex flex-col items-center justify-center px-6 py-10">
            {!uploadedFile ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm font-medium">
                  Drag and drop your CSV file here
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  or click to browse
                </p>
              </>
            ) : (
              <>
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full',
                    isUploading ? 'bg-accent/20' : 'bg-success/20'
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  ) : (
                    <Check className="h-6 w-6 text-success" />
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{uploadedFile.name}</p>
                  {!isUploading && !isImporting && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.preventDefault()
                        clearFile()
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isUploading
                    ? 'Parsing...'
                    : `${(uploadedFile.size / 1024).toFixed(1)} KB • ${parsedLeads.length} leads found`}
                </p>
              </>
            )}
          </div>
        </div>

        {isUploaded && (
          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1"
              disabled={isImporting || parsedLeads.length === 0}
              onClick={handleImport}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${parsedLeads.length} Leads`
              )}
            </Button>
            <Button variant="outline" onClick={clearFile} disabled={isImporting}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
