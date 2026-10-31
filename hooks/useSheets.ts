// hooks/useSheets.ts
'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Sheet } from '@/types'

// 從公開網址取出 Storage 路徑，例如 .../object/public/music-sheets/uploads/a.jpg → uploads/a.jpg
const getStoragePath = (url: string) => {
  const marker = '/object/public/music-sheets/'
  const index = url.indexOf(marker)
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length))
}

// 樂譜庫資料：載入全部樂譜、刪除樂譜（含 Storage 圖片）
export function useSheets(supabase: SupabaseClient) {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSheets = async () => {
      try {
        const { data, error } = await supabase
          .from('sheets')
          .select('id, title, artist, tempo, file_url, image_urls, created_at')
          .order('created_at', { ascending: false })

        if (error) console.error('Error fetching sheets:', error)
        else if (data) setSheets(data as Sheet[])
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSheets()
  }, [supabase])

  // 刪除失敗時會丟出錯誤，由呼叫端顯示提示
  const deleteSheet = async (id: number) => {
    const { error } = await supabase.from('sheets').delete().eq('id', id)
    if (error) throw error

    // 一併刪除 Storage 中的樂譜圖片（略過仍被其他樂譜使用的檔案）
    const deletedSheet = sheets.find((sheet) => sheet.id === id)
    if (deletedSheet) {
      const usedByOthers = new Set(
        sheets
          .filter((sheet) => sheet.id !== id)
          .flatMap((sheet) => [sheet.file_url, ...(sheet.image_urls ?? [])])
      )
      const paths = Array.from(new Set([deletedSheet.file_url, ...(deletedSheet.image_urls ?? [])]))
        .filter((url) => url && !usedByOthers.has(url))
        .map(getStoragePath)
        .filter((path): path is string => !!path)

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from('music-sheets').remove(paths)
        if (storageError) console.error('Failed to remove sheet images:', storageError)
      }
    }

    setSheets((prev) => prev.filter((sheet) => sheet.id !== id))
  }

  return { sheets, loading, deleteSheet }
}
