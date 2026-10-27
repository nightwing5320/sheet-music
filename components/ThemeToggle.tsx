// components/ThemeToggle.tsx

'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'

// 支援的主題清單
const THEME_OPTIONS = [
  { id: 'light', label: '淺色' },
  { id: 'dark', label: '深色' },
  { id: 'theme-coffee', label: '米咖' },
  { id: 'theme-pink', label: '粉紅' },
  { id: 'theme-mint', label: '薄荷' },
]

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ height: '42px', width: '130px' }} />
  }

  const currentTheme = theme || resolvedTheme || 'light'

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        height: '42px',
        borderRadius: '10px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        padding: '0 8px 0 12px',
        gap: '6px',
        boxSizing: 'border-box',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* 調色盤圖示 */}
      <Palette size={16} style={{ color: 'var(--primary-color, var(--text-primary))', flexShrink: 0 }} />

      {/* 下拉選單 Select */}
      <select
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value)}
        style={{
          border: 'none',
          backgroundColor: 'transparent !important',
          color: 'var(--text-primary) !important',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          outline: 'none',
          paddingRight: '4px',
          fontFamily: 'inherit',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none',
        }}
        title="選擇網站主題"
      >
        {THEME_OPTIONS.map((opt) => (
          <option
            key={opt.id}
            value={opt.id}
            style={{
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              padding: '8px',
            }}
          >
            {opt.label}
          </option>
        ))}
      </select>

      {/* 小箭頭指引 */}
      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', pointerEvents: 'none', marginLeft: '-2px' }}>
        ▼
      </span>
    </div>
  )
}