'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Settings, ListMusic, Plus, LogOut, Piano, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react'

// 將基礎樣式物件放在 Component 外面
const baseButtonStyle: React.CSSProperties = {
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
  boxSizing: 'border-box',
}

const secondaryButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  backgroundColor: 'var(--card-bg)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
}

const primaryButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  backgroundColor: 'var(--text-primary)',
  color: 'var(--background)',
  border: 'none',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
}

const dangerButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  height: '42px',
  padding: '0 16px',
  borderRadius: '10px',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  backgroundColor: 'rgba(239, 68, 68, 0.08)',
  color: '#ef4444',
}

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
    <header 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 0',
        width: '100%',
        backgroundColor: 'transparent',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'none',
        gap: '24px',
        flexWrap: 'wrap',
        transition: 'background-color 0.2s, border-color 0.2s',
      }}
    >
      {/* 左側標題區域 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '800', 
          margin: 0, 
          letterSpacing: '-0.5px',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Piano size={30} style={{ color: 'var(--text-primary)' }} />
          <span>樂譜庫</span>
        </h1>

        <p style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: '600', 
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Sparkles size={18} style={{ color: '#f59e0b' }} />
          <span>嗨！{userDisplayName || '使用者'}</span>
        </p>
      </div>

      {/* 右側按鈕區塊 */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        {/* 明暗切換元件 */}
        <div id="tour-theme-toggle">
          <ThemeToggle />
        </div>

        {/* 管理者審核入口 (僅在 is_admin 為 true 時顯示) */}
        {is_admin && (
          <Link 
            href="/admin" 
            style={{
              ...secondaryButtonStyle,
              color: '#2563eb',
              borderColor: 'rgba(37, 99, 235, 0.3)',
              backgroundColor: 'rgba(37, 99, 235, 0.05)'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.5)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)'
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
            }}
          >
            <ShieldCheck size={18} />
            <span>管理員</span>
          </Link>
        )}

        {/* 個人設定 */}
        <Link 
          id="tour-profile-btn"
          href="/profile" 
          style={secondaryButtonStyle}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = 'var(--text-secondary)'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = 'var(--border-color)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
          }}
        >
          <Settings size={18} />
          <span>個人設定</span>
        </Link>

        {/* 當日歌單 */}
        <button 
          id="tour-setlist-btn"
          onClick={onToggleSetlist} 
          style={secondaryButtonStyle}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.borderColor = 'var(--text-secondary)'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.borderColor = 'var(--border-color)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
          }}
        >
          <ListMusic size={18} />
          <span>當日歌單 ({setlistCount})</span>
        </button>

        {/* 上傳樂譜 */}
        <Link 
          id="tour-upload-btn"
          href="/upload" 
          style={primaryButtonStyle}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.opacity = '0.9'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.2)'
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Plus size={18} />
          <span>上傳樂譜</span>
        </Link>

        {/* 提示按鈕 */}
        <button
          id="tour-help-btn"
          onClick={onOpenTour}
          title="功能說明導覽"
          style={{
            ...secondaryButtonStyle,
            width: '42px',
            padding: 0
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.borderColor = 'var(--text-secondary)'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.borderColor = 'var(--border-color)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
          }}
        >
          <HelpCircle size={18} />
        </button>

        {/* 登出按鈕 */}
        <button 
          onClick={onLogout} 
          style={dangerButtonStyle}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.backgroundColor = '#ef4444'
            e.currentTarget.style.color = '#ffffff'
            e.currentTarget.style.borderColor = '#ef4444'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'
            e.currentTarget.style.color = '#ef4444'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <LogOut size={18} />
          <span>登出</span>
        </button>
      </div>
    </header>
  )
}