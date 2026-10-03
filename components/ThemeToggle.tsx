'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div style={{ width: '36px', height: '36px' }} />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      style={{
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        padding: '10px 14px',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      title="切換明暗模式"
    >
      {theme === 'dark' ? '☼ 淺色' : '☽ 深色'}
    </button>
  )
}