'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/Toast'
import { SheetViewerModal } from '@/components/SheetViewerModal'
import { useSheetViewer } from '@/hooks/useSheetViewer'
import { Sheet, TeamSetlist } from '@/types'
import { formatServiceDate } from '@/utils/teamSetlists'
import { backLinkClass, cardClass, inputClass, labelClass, submitButtonClass, loadingTextClass } from '@/utils/ui'
import {
  ArrowLeft,
  ListMusic,
  Search,
  Plus,
  Trash2,
  ChevronUp,
  Maximize2,
  ChevronDown,
  CalendarDays,
  Save,
} from 'lucide-react'

// 歌曲列右側的小方形按鈕（與個人歌單相同）
const trackButtonClass =
  'inline-flex items-center justify-center w-8 h-8 rounded-[6px] bg-transparent border border-(--border-color) text-(--text-secondary) cursor-pointer transition-all duration-200'
const moveButtonClass = `${trackButtonClass} disabled:text-[#cbd5e1] disabled:cursor-not-allowed`

const MAX_SEARCH_RESULTS = 8


export default function TeamSetlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [setlist, setSetlist] = useState<TeamSetlist | null>(null)
  const [library, setLibrary] = useState<Sheet[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [setlistResult, sheetsResult] = await Promise.all([
          supabase.from('team_setlists').select('*').eq('id', id).single(),
          supabase
            .from('sheets')
            .select('id, title, artist, tempo, file_url, image_urls, created_at')
            .order('title', { ascending: true }),
        ])

        if (setlistResult.error) throw setlistResult.error
        if (sheetsResult.error) throw sheetsResult.error

        const loaded = setlistResult.data as TeamSetlist
        setSetlist(loaded)
        setTitle(loaded.title)
        setLibrary((sheetsResult.data ?? []) as Sheet[])
      } catch (err) {
        toast.error('無法載入團隊歌單：' + (err as Error).message)
        router.push('/team')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, supabase, router, toast])

  // 依歌單順序對應到樂譜（已被刪除的樂譜自動略過）
  const sheetsById = new Map(library.map((sheet) => [sheet.id, sheet]))
  const songs = (setlist?.sheet_ids ?? [])
    .map((sheetId) => sheetsById.get(sheetId))
    .filter((sheet): sheet is Sheet => !!sheet)

  const viewer = useSheetViewer(songs)

  // 儲存變更（樂觀更新，失敗時還原）
  const saveChanges = async (changes: Partial<Pick<TeamSetlist, 'title' | 'service_date' | 'sheet_ids'>>) => {
    if (!setlist) return
    const previous = setlist
    setSetlist({ ...setlist, ...changes })

    const { error } = await supabase
      .from('team_setlists')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', setlist.id)

    if (error) {
      setSetlist(previous)
      toast.error('儲存失敗：' + error.message)
    }
  }

  const saveSongs = (sheetIds: number[]) => saveChanges({ sheet_ids: sheetIds })
  const songIds = songs.map((sheet) => sheet.id)

  const handleTitleBlur = () => {
    const trimmed = title.trim()
    if (!setlist || trimmed === setlist.title) return
    if (!trimmed) {
      setTitle(setlist.title)
      return
    }
    saveChanges({ title: trimmed })
  }

  const addSong = (sheet: Sheet) => {
    saveSongs([...songIds, sheet.id])
    setSearch('')
  }

  const removeSong = (sheetId: number) => saveSongs(songIds.filter((songId) => songId !== sheetId))

  const moveSong = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= songIds.length) return
    const reordered = [...songIds]
    ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
    saveSongs(reordered)
  }

  // 變更都會即時儲存；這裡補存尚未失焦的名稱後回到列表
  const handleSave = async () => {
    const trimmed = title.trim()
    if (setlist && trimmed && trimmed !== setlist.title) await saveChanges({ title: trimmed })
    toast.success('已儲存團隊歌單')
    router.push('/team')
  }

  const handleDeleteSetlist = async () => {
    if (!setlist || !window.confirm(`確定要刪除團隊歌單「${setlist.title}」嗎？所有人都將看不到這份歌單。`)) return
    const { error } = await supabase.from('team_setlists').delete().eq('id', setlist.id)
    if (error) {
      toast.error('刪除失敗：' + error.message)
      return
    }
    toast.success('已刪除團隊歌單')
    router.push('/team')
  }

  // 搜尋樂譜庫（排除已在歌單中的歌曲）
  const term = search.trim().toLowerCase()
  const searchResults = term
    ? library
        .filter((sheet) => !songIds.includes(sheet.id))
        .filter((sheet) => sheet.title.toLowerCase().includes(term) || (sheet.artist?.toLowerCase().includes(term) ?? false))
        .slice(0, MAX_SEARCH_RESULTS)
    : []

  if (loading || !setlist) {
    return <div className={loadingTextClass}>載入團隊歌單中...</div>
  }

  return (
    <main className="w-full max-w-[640px] mx-auto my-10 p-6 text-(--text-primary)">
      <Link href="/team" className={backLinkClass}>
        <ArrowLeft size={16} />
        <span>所有團隊歌單</span>
      </Link>

      {/* 歌單名稱與日期 */}
      <div className={`${cardClass} mb-6 flex flex-col gap-4`}>
        <div>
          <label className={labelClass}>歌單名稱</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className={`${inputClass} text-[18px] font-bold`}
          />
        </div>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={14} />
                聚會日期：{formatServiceDate(setlist.service_date)}
              </span>
            </label>
            <input
              type="date"
              value={setlist.service_date ?? ''}
              onChange={(e) => saveChanges({ service_date: e.target.value || null })}
              className="px-3 py-2.5 rounded-[8px] border border-(--border-color) bg-(--card-bg) text-(--text-primary) box-border text-[15px]"
            />
          </div>
          <button
            onClick={handleDeleteSetlist}
            className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[8px] text-[13px] font-medium text-(--text-secondary) bg-transparent border border-(--border-color) cursor-pointer transition-all duration-200 hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.05)]"
          >
            <Trash2 size={14} />
            <span>刪除歌單</span>
          </button>
        </div>
      </div>

      {/* 歌曲列表 */}
      <div className={`${cardClass} mb-6`}>
        <div className="flex justify-between items-center mb-4 gap-3">
          <div className="flex items-center gap-2">
            <ListMusic size={22} className="text-(--text-primary)" />
            <h2 className="m-0 text-[20px] font-bold">歌曲 ({songs.length})</h2>
          </div>
          <button onClick={handleSave} className={`${submitButtonClass} px-4`}>
            <Save size={16} />
            <span>儲存</span>
          </button>
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-(--border-color) rounded-[12px] text-(--text-secondary)">
            還沒有歌曲，用下方搜尋加入吧！
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {songs.map((sheet, index) => (
              <div
                key={sheet.id}
                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-[12px] bg-(--card-bg) border border-(--border-color)"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[15px] font-bold text-(--text-secondary) min-w-5 shrink-0">{index + 1}.</span>
                  <div className="min-w-0">
                    <div className="text-[16px] font-semibold leading-snug line-clamp-2 break-words">{sheet.title}</div>
                    {sheet.artist && (
                      <span className="inline-block mt-0.5 text-[12px] px-1.5 py-0.5 rounded-[6px] bg-[var(--tag-bg,#f1f5f9)] text-(--text-secondary) font-medium">
                        {sheet.artist}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => moveSong(index, 'up')} disabled={index === 0} title="向上移動" className={moveButtonClass}>
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => moveSong(index, 'down')}
                    disabled={index === songs.length - 1}
                    title="向下移動"
                    className={moveButtonClass}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    onClick={() => removeSong(sheet.id)}
                    title="從歌單移除"
                    className={`${trackButtonClass} hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.05)]`}
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={() => viewer.openSheet(sheet, index)}
                    title="檢視樂譜"
                    className={`${trackButtonClass} hover:text-[#2563eb] hover:border-[rgba(37,99,235,0.3)] hover:bg-[rgba(37,99,235,0.05)]`}
                  >
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 加入歌曲 */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <Plus size={20} className="text-(--text-primary)" />
          <h2 className="m-0 text-[18px] font-bold">加入歌曲</h2>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary) pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋樂譜名稱或調性..."
            className="w-full py-2.5 pr-3 pl-9 rounded-[8px] border border-(--border-color) bg-(--card-bg) text-(--text-primary) box-border text-[15px]"
          />
        </div>

        {term && (
          <div className="flex flex-col gap-2 mt-3">
            {searchResults.length === 0 ? (
              <div className="text-center py-4 text-[14px] text-(--text-secondary)">找不到符合的樂譜（或已在歌單中）</div>
            ) : (
              searchResults.map((sheet) => (
                <div
                  key={sheet.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-(--border-color)"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold leading-snug line-clamp-2 break-words">{sheet.title}</div>
                    {sheet.artist && (
                      <div className="text-[12px] text-(--text-secondary) mt-0.5">調性：{sheet.artist}</div>
                    )}
                  </div>
                  <button
                    onClick={() => viewer.openSheet(sheet, null)}
                    className="inline-flex items-center gap-1 h-[34px] px-2.5 shrink-0 rounded-[8px] border border-(--border-color) bg-transparent text-(--text-secondary) text-[13px] font-medium cursor-pointer transition-all duration-200 hover:text-[#2563eb] hover:border-[rgba(37,99,235,0.3)] hover:bg-[rgba(37,99,235,0.05)]"
                  >
                    <Maximize2 size={14} />
                    <span>放大檢視</span>
                  </button>
                  <button
                    onClick={() => addSong(sheet)}
                    className="inline-flex items-center gap-1 h-[34px] px-3 shrink-0 rounded-[8px] border border-[rgba(37,99,235,0.3)] bg-[rgba(37,99,235,0.05)] text-[#2563eb] text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:bg-[rgba(37,99,235,0.12)]"
                  >
                    <Plus size={15} />
                    <span>加入</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 樂譜檢視器（依團隊歌單順序翻頁） */}
      {viewer.activeSheetImages.length > 0 && viewer.selectedSheet && (
        <SheetViewerModal
          selectedSheet={viewer.selectedSheet}
          activeSheetImages={viewer.activeSheetImages}
          currentImageIndex={viewer.currentImageIndex}
          currentSetlistIndex={viewer.currentSetlistIndex}
          setlist={songs}
          annotations={viewer.annotations}
          onUpdateAnnotations={viewer.updateAnnotations}
          onClose={viewer.closeSheet}
          onPrev={viewer.goToPrevPageOrTrack}
          onNext={viewer.goToNextPageOrTrack}
          onTouchStart={viewer.handleTouchStart}
          onTouchEnd={viewer.handleTouchEnd}
        />
      )}
    </main>
  )
}
