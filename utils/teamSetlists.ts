// utils/teamSetlists.ts
import type React from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

// 以本地時間格式化為 YYYY-MM-DD（避免 toISOString 轉成 UTC 而差一天）
const toDateString = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export const todayString = () => toDateString(new Date())

// 已選定的過去日期（手動輸入年份到一半時的 0202-11-01 這類值不算）
export const isPastDate = (value: string) => value >= '2000' && value < todayString()

// 點日期欄任何地方都打開行事曆（部分瀏覽器預設只有小圖示能點）
export const openDatePicker = (e: React.MouseEvent<HTMLInputElement>) => {
  try {
    e.currentTarget.showPicker()
  } catch {
    // 不支援時維持瀏覽器預設行為
  }
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

// 2026-11-01 → 11/1（日）
export const formatServiceDate = (value: string | null) => {
  if (!value) return '未設定日期'
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${month}/${day}（${WEEKDAYS[date.getDay()]}）`
}

// 預設歌單名稱，例如「11/1 聚會歌單」
export const defaultSetlistTitle = (serviceDate: string) => {
  const [, month, day] = serviceDate.split('-').map(Number)
  return `${month}/${day} 聚會歌單`
}

// 目前登入者的顯示名稱（與首頁問候語相同的順序）
async function getCreatorName(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
  return profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || null
}

// 建立團隊歌單，回傳新歌單 id（失敗時丟出錯誤）
export async function createTeamSetlist(
  supabase: SupabaseClient,
  { title, serviceDate, sheetIds = [] }: { title: string; serviceDate: string | null; sheetIds?: number[] }
) {
  const { data, error } = await supabase
    .from('team_setlists')
    .insert({
      title,
      service_date: serviceDate,
      sheet_ids: sheetIds,
      created_by_name: await getCreatorName(supabase),
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as number
}
