// hooks/useSetlist.ts
'use client'

import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Sheet } from '@/types'

const STORAGE_KEY = 'worship_setlist'

// 個人歌單：本機暫存 + 雲端（profiles.setlist）跨裝置同步
export function useSetlist(supabase: SupabaseClient) {
  const [setlist, setSetlist] = useState<Sheet[]>([])

  // 雲端歌單載入完成前不回寫，避免頁面初次載入時用空歌單覆蓋雲端資料
  const setlistLoadedRef = useRef(false)

  useEffect(() => {
    // 歌單存的是樂譜複本：對照樂譜庫，移除已刪除的樂譜並更新名稱、調性等資料
    const refreshSetlist = async (saved: Sheet[]) => {
      const savedIds = saved.map((sheet) => sheet.id)
      if (savedIds.length === 0) return

      const { data, error } = await supabase
        .from('sheets')
        .select('id, title, artist, tempo, file_url, image_urls, created_at')
        .in('id', savedIds)

      if (error) {
        console.error('Failed to refresh setlist:', error)
        return
      }

      const latest = new Map((data as Sheet[]).map((sheet) => [sheet.id, sheet]))
      // 載入期間才加入的歌曲不在 savedIds 內，維持原樣
      setSetlist((prev) =>
        prev.flatMap((sheet) => {
          if (!savedIds.includes(sheet.id)) return [sheet]
          const current = latest.get(sheet.id)
          return current ? [current] : []
        })
      )
    }

    const fetchCloudSetlist = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('setlist')
          .eq('id', user.id)
          .single()

        if (profile) {
          if (profile.setlist && Array.isArray(profile.setlist)) {
            setSetlist(profile.setlist)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile.setlist))
          }

          setlistLoadedRef.current = true

          if (profile.setlist && Array.isArray(profile.setlist)) await refreshSetlist(profile.setlist)
        }
      } catch (err) {
        console.error('Error fetching cloud setlist:', err)
      }
    }

    fetchCloudSetlist()

    // 先顯示本機暫存的歌單，雲端資料載入後會覆蓋。
    // 歌單數量會顯示在 Header，必須在 hydration 後才讀 localStorage，否則伺服器與瀏覽器渲染結果不一致
    const savedSetlist = localStorage.getItem(STORAGE_KEY)
    if (savedSetlist) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSetlist(JSON.parse(savedSetlist))
      } catch (e) {
        console.error('Failed to load local setlist', e)
      }
    }
  }, [supabase])

  useEffect(() => {
    if (!setlistLoadedRef.current) return

    localStorage.setItem(STORAGE_KEY, JSON.stringify(setlist))

    const syncSetlistToCloud = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
          .from('profiles')
          .update({ setlist })
          .eq('id', user.id)
      } catch (err) {
        console.error('Failed to sync setlist to cloud:', err)
      }
    }

    syncSetlistToCloud()
  }, [setlist, supabase])

  const isInSetlist = (id: number) => setlist.some((item) => item.id === id)

  // 已在歌單中時回傳 false
  const addToSetlist = (sheet: Sheet) => {
    if (isInSetlist(sheet.id)) return false
    setSetlist((prev) => [...prev, sheet])
    return true
  }

  const removeFromSetlist = (id: number) => {
    setSetlist((prev) => prev.filter((sheet) => sheet.id !== id))
  }

  const moveSetlistTrack = (index: number, direction: 'up' | 'down') => {
    const newSetlist = [...setlist]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSetlist.length) return
    const temp = newSetlist[index]
    newSetlist[index] = newSetlist[targetIndex]
    newSetlist[targetIndex] = temp
    setSetlist(newSetlist)
  }

  const clearSetlist = () => {
    if (setlist.length === 0) return
    if (window.confirm('確定要清除個人歌單嗎？')) setSetlist([])
  }

  return { setlist, isInSetlist, addToSetlist, removeFromSetlist, moveSetlistTrack, clearSetlist }
}
