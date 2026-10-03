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
      <div style={{ minWidth: '200px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
          🎼 樂譜庫
        </h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '700' }}>
          {userDisplayName ? `👋 嗨！${userDisplayName}` : 'Sheet Music Library'}
        </p>
      </div>

      {/* 右側：按鈕區塊 */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* 📌 2. 放入明暗切換按鈕 (放在個人設定左邊) */}
        <ThemeToggle />

        <Link
          href="/profile"
          style={{
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '10px 14px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          👤 個人設定
        </Link>

        <button
          onClick={onToggleSetlist}
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
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
            padding: '10px 18px', 
            borderRadius: '8px', 
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
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)'
          }}
        >
          🔒 登出
        </button>
      </div>
    </header>
  )
}