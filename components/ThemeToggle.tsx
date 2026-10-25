'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div 
        style={{ 
          height: '42px', 
          width: '88px', 
          borderRadius: '10px', 
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxSizing: 'border-box'
        }} 
      />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      style={{
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
        boxSizing: 'border-box',
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
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
      title="切換明暗模式"
    >
      {isDark ? (
        <>
          <Sun size={18} style={{ color: '#f59e0b' }} />
          <span>淺色</span>
        </>
      ) : (
        <>
          <Moon size={18} style={{ color: '#6366f1' }} />
          <span>深色</span>
        </>
      )}
    </button>
  )
}