'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/Toast'
import { SheetViewerModal } from '@/components/SheetViewerModal'
import { useSheetViewer } from '@/hooks/useSheetViewer'
import { Sheet, TeamSetlist } from '@/types'
import {
  createTeamSetlist,
  defaultSetlistTitle,
  formatServiceDate,
  nextSundayString,
  todayString,
} from '@/utils/teamSetlists'
import {
  backLinkClass,
  pageTitleRowClass,
  pageTitleClass,
  cardClass,
  labelClass,
  inputClass,
  submitButtonClass,
  loadingTextClass,
} from '@/utils/ui'
import { ArrowLeft, Users, Plus, CalendarDays, Music, ChevronRight, Maximize2 } from 'lucide-react'

// 單一歌單卡片：點擊進入編輯，右側可直接放大檢視整份歌單
function SetlistRow({ setlist, onView }: { setlist: TeamSetlist; onView: (setlist: TeamSetlist) => void }) {
  return (
    <div className="flex items-center gap-2 pr-3 rounded-[12px] bg-(--card-bg) border border-(--border-color) transition-all duration-200 hover:border-(--text-secondary)">
      <Link
        href={`/team/${setlist.id}`}
        className="flex-1 min-w-0 pl-4 pr-1 py-3.5 no-underline text-(--text-primary)"
      >
        <div className="min-w-0">
          <div className="text-[16px] font-bold truncate">{setlist.title}</div>
          <div className="flex items-center gap-3 mt-0.5 text-[13px] text-(--text-secondary)">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={14} />
              {formatServiceDate(setlist.service_date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Music size={14} />
              {setlist.sheet_ids.length} 首
            </span>
          </div>
        </div>
      </Link>

      {setlist.sheet_ids.length > 0 && (
        <button
          onClick={() => onView(setlist)}
          className="inline-flex items-center gap-1 h-[34px] px-2.5 shrink-0 rounded-[8px] border border-(--border-color) bg-transparent text-(--text-secondary) text-[13px] font-medium cursor-pointer transition-all duration-200 hover:text-[#2563eb] hover:border-[rgba(37,99,235,0.3)] hover:bg-[rgba(37,99,235,0.05)]"
        >
          <Maximize2 size={14} />
          <span>放大檢視</span>
        </button>
      )}

      <Link href={`/team/${setlist.id}`} tabIndex={-1} aria-hidden className="self-stretch flex items-center pl-1">
        <ChevronRight size={18} className="text-(--text-secondary)" />
      </Link>
    </div>
  )
}

export default function TeamSetlistsPage() {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [setlists, setSetlists] = useState<TeamSetlist[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceDate, setServiceDate] = useState(nextSundayString)
  const [title, setTitle] = useState(() => defaultSetlistTitle(nextSundayString()))
  const [creating, setCreating] = useState(false)
  const [viewingSongs, setViewingSongs] = useState<Sheet[]>([])

  const viewer = useSheetViewer(viewingSongs)

  useEffect(() => {
    const fetchSetlists = async () => {
      try {
        // 聚會日期已過的歌單自動刪除（當天仍保留；未設定日期的不會刪）
        const { error: cleanupError } = await supabase
          .from('team_setlists')
          .delete()
          .lt('service_date', todayString())
        if (cleanupError) console.error('Failed to delete past team setlists:', cleanupError)

        const { data, error } = await supabase
          .from('team_setlists')
          .select('*')
          .order('service_date', { ascending: true, nullsFirst: false })

        if (error) throw error
        setSetlists((data ?? []) as TeamSetlist[])
      } catch (err) {
        toast.error('載入團隊歌單失敗：' + (err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchSetlists()
  }, [supabase, toast])

  // 日期改變時，若名稱仍是預設格式則一併更新
  const handleDateChange = (value: string) => {
    if (title === defaultSetlistTitle(serviceDate) && value) setTitle(defaultSetlistTitle(value))
    setServiceDate(value)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.info('請填寫歌單名稱！')
      return
    }

    try {
      setCreating(true)
      const id = await createTeamSetlist(supabase, { title: title.trim(), serviceDate: serviceDate || null })
      router.push(`/team/${id}`)
    } catch (err) {
      toast.error('建立失敗：' + (err as Error).message)
      setCreating(false)
    }
  }

  // 載入該歌單的樂譜後，從第一首開始放大檢視（已被刪除的樂譜自動略過）
  const handleView = async (setlist: TeamSetlist) => {
    const { data, error } = await supabase
      .from('sheets')
      .select('id, title, artist, tempo, file_url, image_urls, created_at')
      .in('id', setlist.sheet_ids)

    if (error) {
      toast.error('載入樂譜失敗：' + error.message)
      return
    }

    const sheetsById = new Map(((data ?? []) as Sheet[]).map((sheet) => [sheet.id, sheet]))
    const songs = setlist.sheet_ids
      .map((sheetId) => sheetsById.get(sheetId))
      .filter((sheet): sheet is Sheet => !!sheet)

    if (songs.length === 0) {
      toast.info('這份歌單的樂譜都已被刪除')
      return
    }

    setViewingSongs(songs)
    viewer.openSheet(songs[0], 0)
  }

  // 過去的歌單已在載入時刪除，若刪除失敗也不顯示
  const today = todayString()
  const upcoming = setlists.filter((s) => !s.service_date || s.service_date >= today)

  if (loading) {
    return <div className={loadingTextClass}>載入團隊歌單中...</div>
  }

  return (
    <main className="w-full max-w-[640px] mx-auto my-10 p-6 text-(--text-primary)">
      <Link href="/" className={backLinkClass}>
        <ArrowLeft size={16} />
        <span>返回樂譜庫</span>
      </Link>

      <div className={pageTitleRowClass}>
        <Users size={26} className="text-(--text-primary)" />
        <h1 className={pageTitleClass}>團隊歌單</h1>
      </div>

      {/* 新增歌單 */}
      <form onSubmit={handleCreate} className={`${cardClass} mb-8 flex flex-col gap-4`}>
        <div className="flex items-center gap-2">
          <Plus size={20} className="text-(--text-primary)" />
          <h2 className="m-0 text-[18px] font-bold">新增團隊歌單</h2>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3 max-[480px]:grid-cols-1">
          <div>
            <label className={labelClass}>歌單名稱</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="例如：11/1 主日歌單"
              className={`${inputClass} text-[15px]`}
            />
          </div>
          <div>
            <label className={labelClass}>聚會日期</label>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`${inputClass} text-[15px]`}
            />
          </div>
        </div>

        <button type="submit" disabled={creating} className={submitButtonClass}>
          <Plus size={18} />
          <span>{creating ? '建立中...' : '建立並加入歌曲'}</span>
        </button>
      </form>

      {/* 即將到來 */}
      <h2 className="text-[18px] font-bold mt-0 mb-3">即將到來</h2>
      {upcoming.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-(--border-color) rounded-[12px] text-(--text-secondary)">
          目前沒有即將到來的團隊歌單
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {upcoming.map((s) => (
            <SetlistRow key={s.id} setlist={s} onView={handleView} />
          ))}
        </div>
      )}

      {/* 樂譜檢視器（依團隊歌單順序翻頁） */}
      {viewer.activeSheetImages.length > 0 && viewer.selectedSheet && (
        <SheetViewerModal
          selectedSheet={viewer.selectedSheet}
          activeSheetImages={viewer.activeSheetImages}
          currentImageIndex={viewer.currentImageIndex}
          currentSetlistIndex={viewer.currentSetlistIndex}
          setlist={viewingSongs}
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
