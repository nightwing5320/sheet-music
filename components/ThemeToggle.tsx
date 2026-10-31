// components/ThemeToggle.tsx

'use client'

import { useTheme } from 'next-themes'
import { Palette } from 'lucide-react'
import { useHydrated } from '@/utils/useHydrated'

// 支援的主題清單
const THEME_OPTIONS = [
  { id: 'light', label: '淺色' },
  { id: 'dark', label: '深色' },
  { id: 'theme-coffee', label: '米咖' },
  { id: 'theme-espresso', label: '深咖' },
  { id: 'theme-pink', label: '粉紅' },
  { id: 'theme-mint', label: '薄荷' },
]

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useHydrated()

  if (!mounted) {
    return <div className="h-[42px] w-[130px]" />
  }

  const currentTheme = theme || resolvedTheme || 'light'

  return (
    <div className="relative inline-flex items-center h-[42px] rounded-[10px] bg-(--card-bg) border border-(--border-color) pl-3 pr-2 gap-1.5 box-border transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-(--text-secondary) hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      {/* 調色盤圖示 */}
      <Palette size={16} className="text-[var(--primary-color,var(--text-primary))] shrink-0" />

      {/* 下拉選單 Select */}
      <select
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value)}
        className="border-none bg-transparent text-(--text-primary) text-[14px] font-semibold cursor-pointer outline-none pr-1 [font-family:inherit] appearance-none"
        title="選擇網站主題"
      >
        {THEME_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id} className="bg-(--card-bg) text-(--text-primary) p-2">
            {opt.label}
          </option>
        ))}
      </select>

      {/* 小箭頭指引 */}
      <span className="text-[10px] text-(--text-secondary) pointer-events-none -ml-0.5">
        ▼
      </span>
    </div>
  )
}
