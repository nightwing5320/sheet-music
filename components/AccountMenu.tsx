'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, LogOut, Settings, ShieldCheck, UserCircle } from 'lucide-react'

// 選單項目共用樣式
const menuItemClass =
  'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[8px] text-[14px] font-semibold no-underline text-left bg-transparent border-none cursor-pointer transition-all duration-200'

interface AccountMenuProps {
  buttonClassName: string
  isAdmin: boolean
  onLogout: () => void
}

// 頁首右側的帳號選單：個人設定、管理員後台、登出
export function AccountMenu({ buttonClassName, isAdmin, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 點擊選單外部或按 Esc 時關閉
  useEffect(() => {
    if (!open) return

    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        id="tour-account-btn"
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={buttonClassName}
      >
        <UserCircle size={18} />
        <span>帳號</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 z-50 min-w-[180px] p-1.5 rounded-[12px] bg-(--card-bg) border border-(--border-color) shadow-[0_10px_30px_rgba(0,0,0,0.12)] flex flex-col gap-0.5"
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={`${menuItemClass} text-(--text-primary) hover:bg-[rgba(100,116,139,0.1)]`}
          >
            <Settings size={17} />
            <span>個人設定</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`${menuItemClass} text-[#2563eb] hover:bg-[rgba(37,99,235,0.08)]`}
            >
              <ShieldCheck size={17} />
              <span>管理員後台</span>
            </Link>
          )}

          <div className="h-px my-1 bg-(--border-color)" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className={`${menuItemClass} text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)]`}
          >
            <LogOut size={17} />
            <span>登出</span>
          </button>
        </div>
      )}
    </div>
  )
}
