// utils/teamSetlists.ts
import type { SupabaseClient } from '@supabase/supabase-js'

// 以本地時間格式化為 YYYY-MM-DD（避免 toISOString 轉成 UTC 而差一天）
const toDateString = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export const todayString = () => toDateString(new Date())

// 下一個主日（今天若是星期日則為今天）
export const nextSundayString = () => {
  const date = new Date()
  date.setDate(date.getDate() + ((7 - date.getDay()) % 7))
  return toDateString(date)
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

// 2026-11-01 → 11/1（日）
export const formatServiceDate = (value: string | null) => {
  if (!value) return '未設定日期'
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${month}/${day}（${WEEKDAYS[date.getDay()]}）`
}

// 預設歌單名稱，例如「11/1 主日歌單」
export const defaultSetlistTitle = (serviceDate: string) => {
  const [, month, day] = serviceDate.split('-').map(Number)
  return `${month}/${day} 主日歌單`
}

// 建立團隊歌單，回傳新歌單 id（失敗時丟出錯誤）
export async function createTeamSetlist(
  supabase: SupabaseClient,
  { title, serviceDate, sheetIds = [] }: { title: string; serviceDate: string | null; sheetIds?: number[] }
) {
  const { data, error } = await supabase
    .from('team_setlists')
    .insert({ title, service_date: serviceDate, sheet_ids: sheetIds })
    .select('id')
    .single()

  if (error) throw error
  return data.id as number
}
