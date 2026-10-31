'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/Toast'
import { TeamSetlist } from '@/types'
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
import { ArrowLeft, Users, Plus, CalendarDays, Music, ChevronRight } from 'lucide-react'

// 單一歌單卡片
function SetlistRow({ setlist, isPast }: { setlist: TeamSetlist; isPast?: boolean }) {
  return (
    <Link
      href={`/team/${setlist.id}`}
      className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-[12px] bg-(--card-bg) border border-(--border-color) no-underline text-(--text-primary) transition-all duration-200 hover:border-(--text-secondary) hover:-translate-y-px ${
        isPast ? 'opacity-70' : ''
      }`}
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
      <ChevronRight size={18} className="text-(--text-secondary) shrink-0" />
    </Link>
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

  useEffect(() => {
    const fetchSetlists = async () => {
      try {
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

  // 即將到來（含今天與未設定日期）依日期由近到遠；過去的由新到舊
  const today = todayString()
  const upcoming = setlists.filter((s) => !s.service_date || s.service_date >= today)
  const past = setlists.filter((s) => s.service_date && s.service_date < today).reverse()

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
        <div className="text-center py-8 mb-8 border border-dashed border-(--border-color) rounded-[12px] text-(--text-secondary)">
          目前沒有即將到來的團隊歌單
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-8">
          {upcoming.map((s) => (
            <SetlistRow key={s.id} setlist={s} />
          ))}
        </div>
      )}

      {/* 過去的歌單 */}
      {past.length > 0 && (
        <>
          <h2 className="text-[18px] font-bold mt-0 mb-3 text-(--text-secondary)">過去的歌單</h2>
          <div className="flex flex-col gap-2.5">
            {past.map((s) => (
              <SetlistRow key={s.id} setlist={s} isPast />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
