'use client'

import { LayoutGrid, List } from 'lucide-react'

export type ViewMode = 'list' | 'grid'

interface ViewToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center">
      <button
        onClick={() => onChange('list')}
        className={`size-8 flex items-center justify-center rounded-md transition-colors ${mode === 'list' ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-400 hover:text-neutral-600'}`}
        title="列表视图"
      >
        <List className="size-4" />
      </button>
      <button
        onClick={() => onChange('grid')}
        className={`size-8 flex items-center justify-center rounded-md transition-colors ${mode === 'grid' ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-400 hover:text-neutral-600'}`}
        title="网格视图"
      >
        <LayoutGrid className="size-4" />
      </button>
    </div>
  )
}
