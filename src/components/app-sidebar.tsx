'use client'

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { logout } from '@/features/auth/client/auth.api'
import { getBuckets } from '@/features/cos/client/cos.api'
import { LogOut, Loader2, Settings } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { SettingsDialog } from './settings-dialog'
import { useState } from 'react'

interface AppSidebarProps {
  selectedBucket: string | null
  onSelectBucket: (bucket: string) => void
}

export function AppSidebar({ selectedBucket, onSelectBucket }: AppSidebarProps) {
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { data: buckets, isLoading } = useQuery({
    queryKey: ['buckets'],
    queryFn: getBuckets,
  })

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <div className="flex items-center">
                  <span className="font-semibold text-[15px]">CosHub</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>存储桶</SidebarGroupLabel>
            <SidebarGroupContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : buckets?.length === 0 ? (
                <p className="px-2 py-4 text-sm text-muted-foreground">暂无存储桶</p>
              ) : (
                <SidebarMenu>
                  {buckets?.map((bucket) => (
                    <SidebarMenuItem key={bucket.Name}>
                      <SidebarMenuButton
                        isActive={selectedBucket === bucket.Name}
                        onClick={() => onSelectBucket(bucket.Name!)}
                      >
                        <span>{bucket.Name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setSettingsOpen(true)}>
                <Settings className="size-4" />
                <span>设置</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut className="size-4" />
                <span>退出登录</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
