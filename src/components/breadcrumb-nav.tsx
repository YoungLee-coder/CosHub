'use client'

import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbNavProps {
  bucket: string
  prefix: string
  onNavigate: (path: string) => void
}

export function BreadcrumbNav({ bucket, prefix, onNavigate }: BreadcrumbNavProps) {
  const parts = prefix.split('/').filter(Boolean)

  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
      <button
        onClick={() => onNavigate('')}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors shrink-0"
      >
        <Home className="w-4 h-4" />
        <span>{bucket}</span>
      </button>

      {parts.map((part, index) => {
        const path = parts.slice(0, index + 1).join('/') + '/'
        const isLast = index === parts.length - 1

        return (
          <div key={path} className="flex items-center gap-1 shrink-0">
            <ChevronRight className="w-4 h-4 text-neutral-400" />
            <button
              onClick={() => onNavigate(path)}
              className={`px-2 py-1 rounded transition-colors ${
                isLast
                  ? 'text-neutral-900 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {part}
            </button>
          </div>
        )
      })}
    </nav>
  )
}
