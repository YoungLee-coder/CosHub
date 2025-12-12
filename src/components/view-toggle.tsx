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
    <div className="flex items-center border border-neutral-200 rounded-md overflow-hidden">
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 px-2 rounded-none ${mode === 'list' ? 'bg-neutral-100' : ''}`}
        onClick={() => onChange('list')}
        title="列表视图"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 px-2 rounded-none ${mode === 'grid' ? 'bg-neutral-100' : ''}`}
        onClick={() => onChange('grid')}
        title="网格视图"
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>
    </div>
  )
}
