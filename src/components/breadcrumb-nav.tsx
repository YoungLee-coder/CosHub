'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface BreadcrumbNavProps {
  bucket: string
  prefix: string
  onNavigate: (path: string) => void
}

export function BreadcrumbNav({ bucket, prefix, onNavigate }: BreadcrumbNavProps) {
  const parts = prefix.split('/').filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <button onClick={() => onNavigate('')}>{bucket}</button>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {parts.map((part, index) => {
          const path = parts.slice(0, index + 1).join('/') + '/'
          const isLast = index === parts.length - 1

          return (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem key={path}>
                {isLast ? (
                  <BreadcrumbPage>{part}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <button onClick={() => onNavigate(path)}>{part}</button>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
