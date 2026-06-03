import { requestJson } from '@/lib/http/client'

export interface SettingsResponse {
  kvAvailable: boolean
  accessPassword: string
  cdnDomain: string
  source: string
}

export async function getSettings(): Promise<SettingsResponse> {
  return requestJson<SettingsResponse>('/api/settings', {
    fallbackMessage: 'Failed to fetch settings',
  })
}

export async function updateSettings(settings: {
  accessPassword?: string
  cdnDomain?: string
}): Promise<void> {
  await requestJson<{ success: boolean }>('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
    fallbackMessage: 'Failed to update settings',
  })
}
