import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewMode = 'list' | 'grid'

interface PreferencesState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: 'coshub-preferences',
      version: 1, // 添加版本号，强制重置现有设置
    }
  )
) 