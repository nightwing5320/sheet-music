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
        
        {/* 📌 2. 放入明暗切換按鈕 (放在個人設定左邊) */}
        <ThemeToggle />

        <Link
          href="/profile"
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            border: '1px solid var(--border-color)',
            padding: '12px 18px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ⚙️ 個人設定
        </Link>

        <button
          onClick={onToggleSetlist}
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📋 當日歌單 ({setlistCount})
        </button>

        <Link 
          href="/upload" 
          style={{ 
            backgroundColor: '#0070f3', 
            color: 'white', 
            padding: '12px 18px', 
            borderRadius: '10px', 
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0, 112, 243, 0.25)',
          }}
        >
          + 上傳樂譜
        </Link>

        <button
          onClick={onLogout}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)'
          }}
        >
          🚪 登出
        </button>
      </div>
    </header>
  )
}