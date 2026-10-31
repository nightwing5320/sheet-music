// hooks/useSheetFilters.ts
'use client'

import { useState } from 'react'
import { Sheet } from '@/types'

export type TempoTab = 'all' | 'fast' | 'slow' | 'unclassified'

const PAGE_SIZE = 12 // 每頁顯示 12 首樂譜

const isUnclassified = (sheet: Sheet) => !sheet.tempo || (sheet.tempo !== 'fast' && sheet.tempo !== 'slow')

// 樂譜列表的搜尋、調性、速度分類與分頁
export function useSheetFilters(sheets: Sheet[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TempoTab>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // 篩選條件改變時，自動重置頁碼回到第 1 頁
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleKeySelect = (key: string | null) => {
    setSelectedKey(key)
    setCurrentPage(1)
  }

  const handleTabSelect = (tab: TempoTab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  // 動態 Key 標籤列表 (NFKC 正規化全形轉半形)
  const dynamicKeys = Array.from(
    new Set(
      sheets
        .map((s) => {
          if (!s.artist) return null
          return s.artist.normalize('NFKC').trim()
        })
        .filter((k): k is string => typeof k === 'string' && k.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b))

  // 搜尋過濾
  const searchFilteredSheets = sheets.filter((sheet) => {
    const term = searchTerm.toLowerCase()
    const matchesTitle = sheet.title.toLowerCase().includes(term)
    const matchesKey = sheet.artist?.toLowerCase().includes(term) ?? false
    return matchesTitle || matchesKey
  })

  // 調性過濾 (精確區分 A 與 Ab)
  const keyFilteredSheets = searchFilteredSheets.filter((sheet) => {
    if (!selectedKey) return true
    if (!sheet.artist) return false

    const rawKey = sheet.artist.normalize('NFKC').trim().toLowerCase()
    const targetKey = selectedKey.normalize('NFKC').trim().toLowerCase()

    if (rawKey === targetKey) return true

    const regex = new RegExp(`\\b${targetKey}(?![b#])`, 'i')
    return regex.test(rawKey)
  })

  // 數量計算
  const counts = {
    all: keyFilteredSheets.length,
    fast: keyFilteredSheets.filter((s) => s.tempo === 'fast').length,
    slow: keyFilteredSheets.filter((s) => s.tempo === 'slow').length,
    unclassified: keyFilteredSheets.filter(isUnclassified).length,
  }

  // 速度分類過濾後的完整陣列
  const allFilteredSheets = keyFilteredSheets.filter((sheet) => {
    if (activeTab === 'fast') return sheet.tempo === 'fast'
    if (activeTab === 'slow') return sheet.tempo === 'slow'
    if (activeTab === 'unclassified') return isUnclassified(sheet)
    return true
  })

  // 分頁計算 (Pagination)
  const totalPages = Math.ceil(allFilteredSheets.length / PAGE_SIZE) || 1
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedSheets = allFilteredSheets.slice(startIndex, startIndex + PAGE_SIZE)

  // 頁碼超出範圍時回傳 false
  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return false
    setCurrentPage(newPage)
    return true
  }

  return {
    searchTerm,
    selectedKey,
    activeTab,
    currentPage,
    totalPages,
    dynamicKeys,
    counts,
    filteredCount: allFilteredSheets.length,
    paginatedSheets,
    handleSearchChange,
    handleKeySelect,
    handleTabSelect,
    goToPage,
  }
}
