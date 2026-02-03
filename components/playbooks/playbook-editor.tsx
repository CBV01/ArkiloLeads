'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Playbook } from '@/lib/types'
import { Edit2, Save, X, GripVertical, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlaybookEditorProps {
  playbook: Playbook
  onSave?: (playbook: Playbook) => void
  onDelete?: () => void
}

export function PlaybookEditor({ playbook, onSave, onDelete }: PlaybookEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedPlaybook, setEditedPlaybook] = React.useState(playbook)
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const isGlobal = !playbook.userId

  // Sync internal state when playbook prop changes
  React.useEffect(() => {
    setEditedPlaybook(playbook)
  }, [playbook])

  const handleSave = () => {
    onSave?.(editedPlaybook)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedPlaybook(playbook)
    setIsEditing(false)
  }

  const updateProblem = (index: number, value: string) => {
    setEditedPlaybook((prev) => ({
      ...prev,
      problems: prev.problems.map((p, i) => (i === index ? value : p)),
    }))
  }

  const addProblem = () => {
    if (editedPlaybook.problems.length < 5) {
      setEditedPlaybook((prev) => ({
        ...prev,
        problems: [...prev.problems, 'New problem point'],
      }))
    }
  }

  const removeProblem = (index: number) => {
    if (editedPlaybook.problems.length > 1) {
      setEditedPlaybook((prev) => ({
        ...prev,
        problems: prev.problems.filter((_, i) => i !== index),
      }))
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newProblems = [...editedPlaybook.problems]
      const [removed] = newProblems.splice(draggedIndex, 1)
      newProblems.splice(dragOverIndex, 0, removed)
      setEditedPlaybook((prev) => ({ ...prev, problems: newProblems }))
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <Card className="border-border bg-card h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Industry</label>
              <Input
                value={editedPlaybook.industry}
                onChange={(e) => setEditedPlaybook(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="Industry Name"
                className="h-9 bg-background/50 border-primary/20 focus-visible:ring-primary/30"
              />
            </div>
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                  {editedPlaybook.problems.length} points
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} className="h-8 text-xs">
                  <X className="mr-1.5 h-3 w-3" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Save className="mr-1.5 h-3 w-3" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm font-semibold bg-primary/5 text-primary border border-primary/10">
                {playbook.industry}
              </Badge>
              {isGlobal && (
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 font-bold">
                  GLOBAL
                </Badge>
              )}
              <span className="text-xs text-muted-foreground font-medium">
                {playbook.problems.length} problem points
              </span>
            </div>
            <div className="flex gap-2">
              {!isGlobal && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 text-xs hover:bg-primary/5"
                  >
                    <Edit2 className="mr-1.5 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(isEditing ? editedPlaybook : playbook).problems.map(
            (problem, index) => (
              <div
                key={index}
                draggable={isEditing}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 transition-all',
                  isEditing && 'cursor-move hover:bg-secondary/50',
                  dragOverIndex === index && 'border-accent bg-accent/10'
                )}
              >
                {isEditing && (
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                  {index + 1}
                </span>
                {isEditing ? (
                  <Input
                    value={problem}
                    onChange={(e) => updateProblem(index, e.target.value)}
                    className="flex-1 bg-background border-border"
                  />
                ) : (
                  <p className="flex-1 text-sm break-words whitespace-pre-wrap">{problem}</p>
                )}
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeProblem(index)}
                    disabled={editedPlaybook.problems.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          )}
          {isEditing && editedPlaybook.problems.length < 5 && (
            <Button
              variant="outline"
              className="w-full border-dashed bg-transparent"
              onClick={addProblem}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Problem Point
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
