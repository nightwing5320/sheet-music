// hooks/useAnnotations.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import type { PathData } from '@/components/SheetAnnotator'

type Annotations = Record<string, PathData[]>

// 舊版只存在本機、不分帳號的筆記（第一次登入時上傳到雲端後移除）
const LEGACY_KEY = 'worship_sheet_annotations'
// 本機暫存（依帳號分開），開啟樂譜時先顯示，雲端資料載入後覆蓋
const cacheKey = (userId: string) => `worship_sheet_annotations_${userId}`
// 尚未成功上傳的頁面（離線或失敗時保留，之後重送）
const pendingKey = (userId: string) => `worship_sheet_annotations_pending_${userId}`

// 停筆後稍等再上傳，避免每一筆都送一次
const SAVE_DELAY_MS = 800

const pagePrefix = (sheetId: number) => `sheet-${sheetId}-page-`

// 與 SheetViewerModal 的 key 格式相同：sheet-{id}-page-{index}
const parseKey = (key: string) => {
  const match = /^sheet-(\d+)-page-(\d+)$/.exec(key)
  return match ? { sheetId: Number(match[1]), pageIndex: Number(match[2]) } : null
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch (e) {
    console.error(`Failed to read ${key}`, e)
    return fallback
  }
}

function saveLocal(userId: string, cache: Annotations, pending: Set<string>) {
  localStorage.setItem(cacheKey(userId), JSON.stringify(cache))
  localStorage.setItem(pendingKey(userId), JSON.stringify([...pending]))
}

// 上傳指定頁面的筆記（空白頁面直接刪除），回傳成功儲存的 key
async function uploadPages(supabase: SupabaseClient, userId: string, pages: Annotations) {
  const saved: string[] = []
  const upserts = []

  for (const [key, paths] of Object.entries(pages)) {
    const parsed = parseKey(key)
    if (!parsed) {
      saved.push(key)
      continue
    }

    if (paths.length > 0) {
      upserts.push({
        user_id: userId,
        sheet_id: parsed.sheetId,
        page_index: parsed.pageIndex,
        paths,
        updated_at: new Date().toISOString(),
      })
      continue
    }

    const { error } = await supabase
      .from('sheet_annotations')
      .delete()
      .eq('user_id', userId)
      .eq('sheet_id', parsed.sheetId)
      .eq('page_index', parsed.pageIndex)
    if (error) console.error('Failed to delete annotations:', error)
    else saved.push(key)
  }

  if (upserts.length > 0) {
    const { error } = await supabase
      .from('sheet_annotations')
      .upsert(upserts, { onConflict: 'user_id,sheet_id,page_index' })
    if (error) console.error('Failed to save annotations:', error)
    else saved.push(...upserts.map((row) => `${pagePrefix(row.sheet_id)}${row.page_index}`))
  }

  return saved
}

// 樂譜筆記：每個人各自的筆記，存在雲端（sheet_annotations）跨裝置同步，本機另存一份
export function useAnnotations(sheetId: number | null) {
  const supabase = createClient()
  const [annotations, setAnnotations] = useState<Annotations>({})
  const [userId, setUserId] = useState<string | null>(null)

  const cacheRef = useRef<Annotations>({})
  const pendingRef = useRef<Set<string>>(new Set())
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // 上傳待送的頁面；上傳期間若又有新筆畫，該頁保留在待送清單中
  const flush = useCallback(
    async (uid: string, keys: string[]) => {
      const snapshot: Annotations = {}
      for (const key of keys) snapshot[key] = cacheRef.current[key] ?? []

      const saved = await uploadPages(supabase, uid, snapshot)
      for (const key of saved) {
        const current = cacheRef.current[key]
        if (current === undefined || current === snapshot[key]) pendingRef.current.delete(key)
      }
      saveLocal(uid, cacheRef.current, pendingRef.current)
      return saved.length === keys.length
    },
    [supabase]
  )

  // 取得登入帳號，載入本機暫存，並把舊版的本機筆記與未送出的變更上傳
  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user.id
      if (!uid || cancelled) return

      const cache = readJSON<Annotations>(cacheKey(uid), {})
      const pending = new Set(readJSON<string[]>(pendingKey(uid), []))

      const legacy = readJSON<Annotations | null>(LEGACY_KEY, null)
      if (legacy) {
        for (const [key, paths] of Object.entries(legacy)) {
          if (key in cache || !Array.isArray(paths) || paths.length === 0) continue
          cache[key] = paths
          pending.add(key)
        }
        localStorage.removeItem(LEGACY_KEY)
      }

      cacheRef.current = cache
      pendingRef.current = pending
      saveLocal(uid, cache, pending)
      setAnnotations(cache)
      setUserId(uid)

      if (pending.size > 0) flush(uid, [...pending])
    })

    return () => {
      cancelled = true
    }
  }, [supabase, flush])

  // 開啟樂譜時，先送出該樂譜未上傳的變更，再以雲端資料為準
  useEffect(() => {
    if (!userId || sheetId === null) return
    let cancelled = false
    const prefix = pagePrefix(sheetId)

    const syncSheet = async () => {
      const pendingForSheet = [...pendingRef.current].filter((key) => key.startsWith(prefix))
      if (pendingForSheet.length > 0 && !(await flush(userId, pendingForSheet))) return

      const { data, error } = await supabase
        .from('sheet_annotations')
        .select('page_index, paths')
        .eq('user_id', userId)
        .eq('sheet_id', sheetId)

      if (error) {
        console.error('Failed to load annotations:', error)
        return
      }
      if (cancelled) return

      // 載入期間畫的新筆畫（仍在待送清單中）不覆蓋
      const next = { ...cacheRef.current }
      for (const key of Object.keys(next)) {
        if (key.startsWith(prefix) && !pendingRef.current.has(key)) delete next[key]
      }
      for (const row of (data ?? []) as { page_index: number; paths: PathData[] }[]) {
        const key = `${prefix}${row.page_index}`
        if (!pendingRef.current.has(key)) next[key] = row.paths
      }

      cacheRef.current = next
      saveLocal(userId, next, pendingRef.current)
      setAnnotations(next)
    }

    syncSheet()
    return () => {
      cancelled = true
    }
  }, [sheetId, userId, supabase, flush])

  const updateAnnotations = (annotationKey: string, newPaths: PathData[]) => {
    const next = { ...cacheRef.current, [annotationKey]: newPaths }
    cacheRef.current = next
    setAnnotations(next)
    if (!userId) return

    pendingRef.current.add(annotationKey)
    saveLocal(userId, next, pendingRef.current)

    clearTimeout(timersRef.current.get(annotationKey))
    timersRef.current.set(
      annotationKey,
      setTimeout(() => {
        timersRef.current.delete(annotationKey)
        flush(userId, [annotationKey])
      }, SAVE_DELAY_MS)
    )
  }

  return { annotations, updateAnnotations }
}
