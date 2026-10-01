// types.ts
export interface Sheet {
  id: number
  title: string
  artist: string | null
  tempo?: 'fast' | 'slow' | string | null
  file_url: string
  image_urls?: string[] | null
  created_at: string // 統一設定為 string
}