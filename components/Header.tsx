'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AccountMenu } from '@/components/AccountMenu'
import { ListMusic, Plus, Piano, Rocket, HelpCircle, Users } from 'lucide-react'

// 將基礎樣式放在 Component 外面
const baseButtonClass =
  'h-[42px] rounded-[10px] text-[14px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 no-underline box-border hover:-translate-y-px'

const secondaryColorClass = `bg-(--card-bg) text-(--text-primary) border border-(--border-color) shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-(--text-secondary) hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]`

const secondaryButtonClass = `${baseButtonClass} px-4 ${secondaryColorClass}`

const primaryButtonClass = `${baseButtonClass} px-4 bg-(--text-primary) text-(--background) border-none shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:opacity-90 hover:shadow-[0_4px_14px_rgba(0,0,0,0.2)]`

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

      {/* 按鈕區塊：左側為主要功能，右側為說明、主題與帳號選單 */}
      <div className="flex grow gap-2 items-center flex-wrap">
        {/* 上傳樂譜 */}
        <Link id="tour-upload-btn" href="/upload" className={primaryButtonClass}>
          <Plus size={18} />
          <span>上傳樂譜</span>
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

        {/* 右側：導覽、主題、帳號選單 */}
        <div className="flex gap-2 items-center ml-auto">
          <button
            id="tour-help-btn"
            onClick={onOpenTour}
            title="功能說明導覽"
            className={`${baseButtonClass} ${secondaryColorClass} w-[42px]`}
          >
            <HelpCircle size={18} />
          </button>

          <div id="tour-theme-toggle">
            <ThemeToggle />
          </div>

          <AccountMenu buttonClassName={secondaryButtonClass} isAdmin={is_admin} onLogout={onLogout} />
        </div>
      </div>
    </header>
  )
}
