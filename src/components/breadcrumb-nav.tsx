'use client'

import { ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BreadcrumbNavProps {
  bucket: string
  prefix: string
  onNavigate: (path: string) => void
}

export function BreadcrumbNav({ bucket, prefix, onNavigate }: BreadcrumbNavProps) {
  const parts = prefix.split('/').filter(Boolean)

  return (
    <nav className="flex items-center gap-1 overflow-x-auto text-sm">
      <Button variant="ghost" size="sm" onClick={() => onNavigate('')} className="h-8 gap-1 px-2">
        <Home className="size-4" />
        <span>{bucket}</span>
      </Button>

      {parts.map((part, index) => {
        const path = parts.slice(0, index + 1).join('/') + '/'
        const isLast = index === parts.length - 1

        return (
          <div key={path} className="flex shrink-0 items-center gap-1">
            <ChevronRight className="size-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(path)}
              className={`h-8 px-2 ${isLast ? 'font-medium' : ''}`}
            >
              {part}
            </Button>
          </div>
        )
      })}
    </nav>
  )
}
