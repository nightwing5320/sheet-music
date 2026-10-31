'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Settings, ListMusic, Plus, LogOut, Piano, Rocket, ShieldCheck, HelpCircle, Users } from 'lucide-react'

// 將基礎樣式放在 Component 外面
const baseButtonClass =
  'h-[42px] rounded-[10px] text-[14px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 no-underline box-border hover:-translate-y-px'

const secondaryColorClass = `bg-(--card-bg) text-(--text-primary) border border-(--border-color) shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-(--text-secondary) hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]`

const secondaryButtonClass = `${baseButtonClass} px-4 ${secondaryColorClass}`

const primaryButtonClass = `${baseButtonClass} px-4 bg-(--text-primary) text-(--background) border-none shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:opacity-90 hover:shadow-[0_4px_14px_rgba(0,0,0,0.2)]`

const adminButtonClass = `${baseButtonClass} px-4 text-[#2563eb] border border-[rgba(37,99,235,0.3)] bg-[rgba(37,99,235,0.05)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[rgba(37,99,235,0.15)] hover:border-[rgba(37,99,235,0.5)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.15)]`

const dangerButtonClass = `${baseButtonClass} px-4 border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] text-[#ef4444] hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444] hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)]`

interface HeaderProps {
  userDisplayName: string
  is_admin?: boolean
  setlistCount: number
  isSetlistOpen: boolean
  onToggleSetlist: () => void
  onLogout: () => void
  onOpenTour?: () => void
}

export function Header({ 
  userDisplayName,
  is_admin = false,
  setlistCount, 
  onToggleSetlist, 
  onLogout,
  onOpenTour
}: HeaderProps) {
  return (
    <header className="flex justify-between items-center py-5 w-full bg-transparent border-b border-(--border-color) shadow-none gap-6 flex-wrap">
      {/* 左側標題區域 */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-extrabold m-0 tracking-[-0.5px] text-(--text-primary) flex items-center gap-2.5">
          <Piano size={30} className="text-(--text-primary)" />
          <span>樂譜庫</span>
        </h1>

        <p className="m-0 text-[18px] font-semibold text-(--text-secondary) flex items-center gap-1.5">
          <Rocket size={18} className="text-[#f59e0b]" />
          <span>嗨！{userDisplayName || '使用者'}</span>
        </p>
      </div>

      {/* 右側按鈕區塊 */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* 導覽按鈕 */}
        <button
          id="tour-help-btn"
          onClick={onOpenTour}
          title="功能說明導覽"
          className={`${baseButtonClass} ${secondaryColorClass} w-[42px]`}
        >
          <HelpCircle size={18} />
        </button>

        {/* 明暗切換元件 */}
        <div id="tour-theme-toggle">
          <ThemeToggle />
        </div>

        {/* 管理者審核入口 (僅在 is_admin 為 true 時顯示) */}
        {is_admin && (
          <Link href="/admin" className={adminButtonClass}>
            <ShieldCheck size={18} />
            <span>管理員</span>
          </Link>
        )}

        {/* 個人設定 */}
        <Link id="tour-profile-btn" href="/profile" className={secondaryButtonClass}>
          <Settings size={18} />
          <span>個人設定</span>
        </Link>

        {/* 個人歌單 */}
        <button id="tour-setlist-btn" onClick={onToggleSetlist} className={secondaryButtonClass}>
          <ListMusic size={18} />
          <span>個人歌單 ({setlistCount})</span>
        </button>

        {/* 團隊共用歌單 */}
        <Link id="tour-team-btn" href="/team" className={secondaryButtonClass}>
          <Users size={18} />
          <span>團隊歌單</span>
        </Link>

        {/* 上傳樂譜 */}
        <Link id="tour-upload-btn" href="/upload" className={primaryButtonClass}>
          <Plus size={18} />
          <span>上傳樂譜</span>
        </Link>

        {/* 登出按鈕 */}
        <button onClick={onLogout} className={dangerButtonClass}>
          <LogOut size={18} />
          <span>登出</span>
        </button>
      </div>
    </header>
  )
}
