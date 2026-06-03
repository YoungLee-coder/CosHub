import { requestJson } from '@/lib/http/client'

export interface SettingsResponse {
  kvAvailable: boolean
  cosSecretId: string
  cosSecretKey: string
  cosRegion: string
  cdnDomain: string
}

export async function getSettings(): Promise<SettingsResponse> {
  return requestJson<SettingsResponse>('/api/settings', {
    fallbackMessage: 'Failed to fetch settings',
  })
}

export async function updateSettings(settings: {
  cosSecretId?: string
  cosSecretKey?: string
  cosRegion?: string
  cdnDomain?: string
}): Promise<void> {
  await requestJson<{ success: boolean }>('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
    fallbackMessage: 'Failed to update settings',
  })
}
