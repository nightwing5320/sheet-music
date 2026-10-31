// hooks/useSheetViewer.ts
'use client'

import React, { useEffect, useState } from 'react'
import { Sheet } from '@/types'
import { useAnnotations } from '@/hooks/useAnnotations'

const getPages = (sheet: Sheet) =>
  (sheet.image_urls && sheet.image_urls.length > 0) ? sheet.image_urls : [sheet.file_url]

// 樂譜檢視器：開關、翻頁（含歌單連續翻頁）、鍵盤與滑動手勢、筆記
export function useSheetViewer(setlist: Sheet[]) {
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null)
  const [activeSheetImages, setActiveSheetImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentSetlistIndex, setCurrentSetlistIndex] = useState<number | null>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  // 筆記（雲端跨裝置同步）
  const { annotations, updateAnnotations } = useAnnotations(selectedSheet?.id ?? null)

  const openSheet = (sheet: Sheet, setlistIdx: number | null = null) => {
    setSelectedSheet(sheet)
    setActiveSheetImages(getPages(sheet))
    setCurrentImageIndex(0)
    setCurrentSetlistIndex(setlistIdx)
  }

  const closeSheet = () => {
    setSelectedSheet(null)
    setActiveSheetImages([])
    setCurrentSetlistIndex(null)
  }

  const goToNextPageOrTrack = () => {
    if (currentImageIndex < activeSheetImages.length - 1) {
      setCurrentImageIndex((prev) => prev + 1)
    } else if (currentSetlistIndex !== null && currentSetlistIndex < setlist.length - 1) {
      const nextTrackIdx = currentSetlistIndex + 1
      openSheet(setlist[nextTrackIdx], nextTrackIdx)
    }
  }

  const goToPrevPageOrTrack = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1)
    } else if (currentSetlistIndex !== null && currentSetlistIndex > 0) {
      // 回到上一首時停在該首的最後一頁
      const prevTrackIdx = currentSetlistIndex - 1
      const prevSheet = setlist[prevTrackIdx]
      const pages = getPages(prevSheet)
      setSelectedSheet(prevSheet)
      setActiveSheetImages(pages)
      setCurrentImageIndex(pages.length - 1)
      setCurrentSetlistIndex(prevTrackIdx)
    }
  }

  // 鍵盤翻頁（每次 render 重新綁定，確保使用最新的翻頁函式）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSheetImages.length === 0) return
      if (e.key === 'Escape') closeSheet()
      else if (e.key === 'ArrowRight') goToNextPageOrTrack()
      else if (e.key === 'ArrowLeft') goToPrevPageOrTrack()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX
    if (deltaX < -50) goToNextPageOrTrack()
    else if (deltaX > 50) goToPrevPageOrTrack()
    setTouchStartX(null)
  }

  return {
    selectedSheet,
    activeSheetImages,
    currentImageIndex,
    currentSetlistIndex,
    annotations,
    updateAnnotations,
    openSheet,
    closeSheet,
    goToNextPageOrTrack,
    goToPrevPageOrTrack,
    handleTouchStart,
    handleTouchEnd,
  }
}
