// components/ThemeToggle.tsx

'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Coffee, Palette, Leaf } from 'lucide-react'

const THEMES = ['light', 'dark', 'theme-coffee', 'theme-pink', 'theme-mint']

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ height: '42px', width: '96px' }} />
  }

  const currentTheme = theme || resolvedTheme || 'light'

  // 循環切換：light -> dark -> theme-coffee -> theme-pink -> light
  const toggleNextTheme = () => {
    const currentIndex = THEMES.indexOf(currentTheme)
    const nextIndex = currentIndex === -1 ? 1 : (currentIndex + 1) % THEMES.length
    setTheme(THEMES[nextIndex])
  }

  return (
    <button
      onClick={toggleNextTheme}
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
      title="切換主題 (淺色 / 深色 / 咖啡米色 / 粉紅 / 薄荷)"
    >
      {currentTheme === 'theme-coffee' ? (
        <>
          <Coffee size={18} style={{ color: '#8c6d53' }} />
          <span>米咖</span>
        </>
      ) : currentTheme === 'theme-pink' ? (
        <>
          <Palette size={18} style={{ color: '#ec4899' }} />
          <span>粉紅</span>
        </>
      ): theme === 'theme-mint' ? (
        <>
          <Leaf size={18} style={{ color: '#10b981' }} />
          <span>薄荷</span>
        </>
      ) : theme === 'dark' ? (
        <>
          <Moon size={18} style={{ color: '#a78bfa' }} />
          <span>深色</span>
        </>
      ) : (
        <>
          <Sun size={18} style={{ color: '#f59e0b' }} />
          <span>淺色</span>
        </>
      )}
    </button>
  )
}