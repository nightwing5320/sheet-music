'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle' // 📌 1. 引入 ThemeToggle

// 假設你有使用 lucide-react 或其他 Icon 套件（如果沒有可以用簡潔的文字/SVG）
import { Moon, Settings, ListMusic, Plus, LogOut } from 'lucide-react'

// 📌 1. 將樣式物件放在 Component 外面
const baseButtonStyle = {
  height: '42px',
  padding: '0 16px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textDecoration: 'none',
  boxSizing: 'border-box' as const,
};

const secondaryButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: 'var(--card-bg)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
};

const primaryButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: 'var(--text-primary)',
  color: 'var(--background)',
  border: 'none',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
};

const dangerButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
};
interface HeaderProps {
  userDisplayName: string
  setlistCount: number
  isSetlistOpen: boolean
  onToggleSetlist: () => void
  onLogout: () => void
}

export function Header({ setlistCount, onToggleSetlist, onLogout }: HeaderProps) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
      {/* 左側標題區域... */}

      {/* 📌 2. 右側按鈕區塊 (將 JSX 貼在這裡) */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        
        {/* 明暗切換元件 */}
        <ThemeToggle />

        {/* 個人設定 */}
        <Link href="/profile" style={secondaryButtonStyle}>
          <Settings size={18} />
          <span>個人設定</span>
        </Link>

        {/* 當日歌單 */}
        <button onClick={onToggleSetlist} style={secondaryButtonStyle}>
          <ListMusic size={18} />
          <span>當日歌單 ({setlistCount})</span>
        </button>

        {/* 上傳樂譜 (主要動作) */}
        <Link href="/upload" style={primaryButtonStyle}>
          <Plus size={18} />
          <span>上傳樂譜</span>
        </Link>

        {/* 登出按鈕 */}
        <button onClick={onLogout} style={dangerButtonStyle}>
          <LogOut size={18} />
          <span>登出</span>
        </button>
      </div>
    </header>
  )
}