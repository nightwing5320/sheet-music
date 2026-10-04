'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle' // 📌 1. 引入 ThemeToggle

interface HeaderProps {
  userDisplayName: string
  setlistCount: number
  isSetlistOpen: boolean
  onToggleSetlist: () => void
  onLogout: () => void
}

export function Header({
  userDisplayName,
  setlistCount,
  isSetlistOpen,
  onToggleSetlist,
  onLogout,
}: HeaderProps) {
  return (
    <header 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '28px',
        gap: '24px',
        flexWrap: 'wrap'
      }}
    >
      {/* 左側：標題與歡迎詞 */}
      <div style={{ minWidth: '220px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
          🎼 樂譜庫
        </h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)'}}>
          {userDisplayName ? `👋 嗨！${userDisplayName}` : 'Sheet Music Library'}
        </p>
      </div>

      {/* 右側：按鈕區塊 */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* 放入明暗切換按鈕 (個人設定左邊) */}
        <ThemeToggle />

        {/* 個人設定 */}
        <Link
          href="/profile"
          style={{
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '12px 18px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          ⚙️ 個人設定
        </Link>

        {/* 當日歌單 */}
        <button
          onClick={onToggleSetlist}
          style={{
            backgroundColor: 'var(--tag-bg)',
            color: 'var(--tag-primary)',
            padding: '12px 18px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📋 當日歌單 ({setlistCount})
        </button>

        <Link 
          href="/upload" 
          style={{ 
            backgroundColor: 'var(--text-primary)',
            color: 'var(--background)', 
            padding: '12px 18px', 
            borderRadius: '10px', 
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          + 上傳樂譜
        </Link>

        {/* 登出 */}
        <button
          onClick={onLogout}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            padding: '12px 18px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)'
            e.currentTarget.style.borderColor = 'var(--border-color)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          🚪 登出
        </button>
      </div>
    </header>
  )
}