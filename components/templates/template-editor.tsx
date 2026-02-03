'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { EmailTemplate } from '@/lib/types'
import { Edit2, Save, X, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateEditorProps {
  template: EmailTemplate
  onSave?: (template: EmailTemplate) => void
  onDelete?: () => void
  canEdit?: boolean
  canDelete?: boolean
}

const tokens = [
  '{{First Name}}',
  '{{Company}}',
  '{{City}}',
  '{{Industry}}',
  '{{Country}}',
]

function highlightTokens(text: string) {
  const parts = text.split(/(\{\{[^}]+\}\})/g)
  return parts.map((part, index) => {
    if (part.match(/\{\{[^}]+\}\}/)) {
      return (
        <span
          key={index}
          className="rounded bg-token/20 px-1 py-0.5 text-token font-medium"
        >
          {part}
        </span>
      )
    }
    return part
  })
}

export function TemplateEditor({
  template,
  onSave,
  onDelete,
  canEdit = true,
  canDelete = true
}: TemplateEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedTemplate, setEditedTemplate] = React.useState(template)

  const isGlobal = !template.userId

  // Sync internal state when template prop changes
  React.useEffect(() => {
    setEditedTemplate(template)
  }, [template])

  const handleSave = () => {
    onSave?.(editedTemplate)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedTemplate(template)
    setIsEditing(false)
  }

  const insertToken = (token: string) => {
    setEditedTemplate((prev) => ({
      ...prev,
      body: prev.body + token,
    }))
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3 items-center">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold">
                  {isEditing ? (
                    <Input
                      value={editedTemplate.name}
                      onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="h-8 font-semibold"
                    />
                  ) : (
                    template.name
                  )}
                </CardTitle>
                {isGlobal && !isEditing && (
                  <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                    GLOBAL
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {canEdit ? 'Click tokens to insert into the template' : 'View-only template'}
              </p>
            </div>
          </div>
          {!isEditing ? (
            <div className="flex gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tokens.map((token) => (
            <Badge
              key={token}
              variant="outline"
              className={cn(
                'cursor-pointer transition-colors',
                isEditing
                  ? 'hover:bg-token/20 hover:text-token hover:border-token'
                  : 'opacity-60'
              )}
              onClick={() => isEditing && insertToken(token)}
            >
              {token}
            </Badge>
          ))}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`subject-${template.id}`}>Subject Line</Label>
            {isEditing ? (
              <Input
                id={`subject-${template.id}`}
                value={editedTemplate.subject}
                onChange={(e) =>
                  setEditedTemplate((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                className="bg-secondary/50 border-border"
              />
            ) : (
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                {highlightTokens(template.subject)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`body-${template.id}`}>Email Body</Label>
            {isEditing ? (
              <Textarea
                id={`body-${template.id}`}
                value={editedTemplate.body}
                onChange={(e) =>
                  setEditedTemplate((prev) => ({
                    ...prev,
                    body: e.target.value,
                  }))
                }
                rows={12}
                className="bg-secondary/50 border-border font-mono text-sm"
              />
            ) : (
              <div className="rounded-lg border border-border bg-secondary/30 p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {highlightTokens(template.body)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
