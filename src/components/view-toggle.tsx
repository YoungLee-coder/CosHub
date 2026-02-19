'use client'

import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ViewMode = 'list' | 'grid'

interface ViewToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-md border">
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 rounded-none border-r px-2 ${mode === 'list' ? 'bg-muted' : ''}`}
        onClick={() => onChange('list')}
        title="列表视图"
      >
        <List className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 rounded-none px-2 ${mode === 'grid' ? 'bg-muted' : ''}`}
        onClick={() => onChange('grid')}
        title="网格视图"
      >
        <LayoutGrid className="size-4" />
      </Button>
    </div>
  )
}
