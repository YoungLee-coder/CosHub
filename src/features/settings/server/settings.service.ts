export interface SettingsResponse {
  kvAvailable: boolean
  settings: {
    accessPassword: string
    cdnDomain: string
  }
  sources: {
    accessPassword: 'kv' | 'env' | 'none'
    cdnDomain: 'kv' | 'env' | 'none'
  }
}

export function getSettingsService(): SettingsResponse {
  const accessPassword = process.env.ACCESS_PASSWORD || ''
  const cdnDomain = process.env.COS_CDN_DOMAIN || ''

  return {
    kvAvailable: false,
    settings: {
      accessPassword: accessPassword ? '******' : '',
      cdnDomain,
    },
    sources: {
      accessPassword: accessPassword ? 'env' : 'none',
      cdnDomain: cdnDomain ? 'env' : 'none',
    },
  }
}
