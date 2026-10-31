// types.ts
export interface Sheet {
  id: number
  title: string
  artist: string | null
  tempo?: 'fast' | 'slow' | string | null
  file_url: string
  image_urls?: string[] | null
  created_at: string // 統一設定為 string
  annotation?: string // 新增欄位：存放塗鴉資料的 JSON 字串
}
// 團隊共用歌單（team_setlists 資料表）
export interface TeamSetlist {
  id: number
  title: string
  service_date: string | null // YYYY-MM-DD
  sheet_ids: number[]
  created_at: string
  updated_at: string
}
