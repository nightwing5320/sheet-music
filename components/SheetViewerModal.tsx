'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Sheet } from '@/types'
import { SheetAnnotator, PathData } from './SheetAnnotator'
import { 
  X, 
  Pencil, 
  Check, 
  ListMusic, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  Info
} from 'lucide-react'

interface SheetViewerModalProps {
  selectedSheet?: Sheet | null
  activeSheetImages: string[]
  currentImageIndex: number
  currentSetlistIndex: number | null
  setlist: Sheet[]
  annotations: Record<string, PathData[]>
  onUpdateAnnotations: (annotationKey: string, newPaths: PathData[]) => void
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

// 底部上一首 / 下一首按鈕（停用時透明淡化）
const NAV_BUTTON_CLASS =
  'inline-flex items-center gap-1 h-[34px] px-3 rounded-[18px] bg-[rgba(255,255,255,0.15)] text-white border-none cursor-pointer font-semibold text-[12.5px] disabled:bg-transparent disabled:text-[rgba(255,255,255,0.3)] disabled:cursor-not-allowed'

export function SheetViewerModal({
  selectedSheet,
  activeSheetImages,
  currentImageIndex,
  currentSetlistIndex,
  setlist,
  annotations,
  onUpdateAnnotations,
  onClose,
  onPrev,
  onNext,
  onTouchStart,
  onTouchEnd,
}: SheetViewerModalProps) {
  const [isEditing, setIsEditing] = useState(false)

  // 提示條顯示狀態與 localStorage 記憶
  // 檢視器只在使用者點擊後於瀏覽器端渲染，可直接讀取 localStorage
  const [showGestureHint, setShowGestureHint] = useState(
    () => typeof window !== 'undefined' && !localStorage.getItem('hide_sheet_viewer_gesture_hint')
  )

  useEffect(() => {
    // 📌 1. 鎖定全域身頁面滾動與 Overscroll 橡皮筋拉動
    const originalOverflow = document.body.style.overflow
    const originalTouchAction = document.body.style.touchAction
    const originalOverscroll = document.body.style.overscrollBehavior

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.body.style.overscrollBehavior = 'none'
    document.body.classList.add('modal-open')
    document.documentElement.style.overscrollBehavior = 'none'

    // 📌 2. 在 window 級別被動鎖定原生 gesture 縮放 (專治 iPad Safari 放大跑版)
    const preventSafariGesture = (e: Event) => {
      e.preventDefault()
    }
    window.addEventListener('gesturestart', preventSafariGesture, { passive: false })
    window.addEventListener('gesturechange', preventSafariGesture, { passive: false })
    return () => {
      document.body.classList.remove('modal-open')
      document.body.style.overflow = originalOverflow
      document.body.style.touchAction = originalTouchAction
      document.body.style.overscrollBehavior = originalOverscroll
      document.documentElement.style.overscrollBehavior = 'auto'

      window.removeEventListener('gesturestart', preventSafariGesture)
      window.removeEventListener('gesturechange', preventSafariGesture)
    }
  }, [])

  const handleDismissHint = (dontShowAgain: boolean) => {
    setShowGestureHint(false)
    if (dontShowAgain) {
      localStorage.setItem('hide_sheet_viewer_gesture_hint', 'true')
    }
  }

  // 縮放 (Scale) 與 平移 (Position) 狀態
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const touchStartRef = useRef<{ dist: number; scale: number; x: number; y: number; posX: number; posY: number } | null>(null)
  const [isGesturing, setIsGesturing] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  if (!activeSheetImages || activeSheetImages.length === 0) return null

  const currentSheetId = selectedSheet?.id 
    ?? (currentSetlistIndex !== null && setlist[currentSetlistIndex] ? setlist[currentSetlistIndex].id : 'temp')

  const annotationKey = `sheet-${currentSheetId}-page-${currentImageIndex}`
  const currentPaths = annotations[annotationKey] || []

  const handlePathsChange = (newPaths: PathData[]) => {
    onUpdateAnnotations(annotationKey, newPaths)
  }

  const isPrevDisabled = currentImageIndex === 0 && (currentSetlistIndex === null || currentSetlistIndex === 0)
  const isNextDisabled = currentImageIndex === activeSheetImages.length - 1 && (currentSetlistIndex === null || currentSetlistIndex === setlist.length - 1)

  // 重置縮放
  const handleResetZoom = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // 計算兩點間距離 (雙指縮放)
  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 邊界限制夾緊機制
  const clampPosition = (newX: number, newY: number, currentScale: number) => {
    if (!containerRef.current || currentScale <= 1) {
      return { x: 0, y: 0 }
    }
    const rect = containerRef.current.getBoundingClientRect()
    const maxX = (rect.width * (currentScale - 1)) / 2
    const maxY = (rect.height * (currentScale - 1)) / 2

    return {
      x: Math.min(Math.max(newX, -maxX), maxX),
      y: Math.min(Math.max(newY, -maxY), maxY)
    }
  }

  // 處理縮放與拖曳手勢
  const handleContainerTouchStart = (e: React.TouchEvent) => {
    const nativeEvent = e.nativeEvent as TouchEvent
    if (nativeEvent.touches.length > 0) {
      const touch = nativeEvent.touches[0] as Touch & { touchType?: string }
      if (touch.touchType === 'stylus') {
        return
      }
    }

    if (e.touches.length === 2) {
      // 📌 阻止原生雙指手勢透傳到 window
      if (e.cancelable) e.preventDefault()

      const dist = getDistance(e.touches)
      setIsGesturing(true)
      touchStartRef.current = {
        dist,
        scale,
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        posX: position.x,
        posY: position.y
      }
    } else if (e.touches.length === 1 && scale > 1) {
      if (e.cancelable) e.preventDefault()

      setIsGesturing(true)
      touchStartRef.current = {
        dist: 0,
        scale,
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y
      }
    } else if (!isEditing) {
      onTouchStart(e)
    }
  }

  const handleContainerTouchMove = (e: React.TouchEvent) => {
    const nativeEvent = e.nativeEvent as TouchEvent
    if (nativeEvent.touches.length > 0) {
      const touch = nativeEvent.touches[0] as Touch & { touchType?: string }
      if (touch.touchType === 'stylus') {
        return
      }
    }

    if (!touchStartRef.current) return

    if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      if (e.cancelable) e.preventDefault()

      const newDist = getDistance(e.touches)
      const factor = newDist / touchStartRef.current.dist
      const newScale = Math.min(Math.max(touchStartRef.current.scale * factor, 1), 3.5)
      
      setScale(newScale)
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      } else {
        setPosition((prev) => clampPosition(prev.x, prev.y, newScale))
      }
    } else if (e.touches.length === 1 && touchStartRef.current.dist === 0 && scale > 1) {
      if (e.cancelable) e.preventDefault()

      const deltaX = e.touches[0].clientX - touchStartRef.current.x
      const deltaY = e.touches[0].clientY - touchStartRef.current.y
      
      const rawX = touchStartRef.current.posX + deltaX
      const rawY = touchStartRef.current.posY + deltaY

      setPosition(clampPosition(rawX, rawY, scale))
    }
  }

  const handleContainerTouchEnd = (e: React.TouchEvent) => {
    touchStartRef.current = null
    setIsGesturing(false)
    if (!isEditing && scale === 1) {
      onTouchEnd(e)
    }
  }

  return (
    <div
      onClick={onClose}
      onTouchStart={handleContainerTouchStart}
      onTouchMove={handleContainerTouchMove}
      onTouchEnd={handleContainerTouchEnd}
      className="fixed inset-0 w-full h-full bg-[rgba(15,23,42,0.88)] backdrop-blur-[12px] flex flex-col items-center justify-center z-[9999] touch-none overscroll-none overflow-hidden box-border"
    >
      {/* 頂部懸浮手勢操作說明條 (提示膠囊) */}
      {showGestureHint && !isEditing && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-[rgba(30,41,59,0.92)] border border-[rgba(255,255,255,0.2)] text-white px-3.5 py-2 rounded-[20px] text-[12px] font-medium z-[10003] backdrop-blur-[12px] shadow-[0_8px_20px_rgba(0,0,0,0.35)] w-max whitespace-normal text-center leading-[1.4] max-w-[calc(100vw-32px)] box-border"
        >
          <Info size={14} className="text-[#3b82f6] shrink-0" />
          <span>雙指縮放 ｜ 單指移動 ｜ 點按“筆記”可用觸控筆在譜上劃記</span>

          <div className="flex items-center gap-2 ml-1.5 border-l border-[rgba(255,255,255,0.2)] pl-2">
            <button
              onClick={() => handleDismissHint(true)}
              className="bg-transparent border-none text-[#38bdf8] cursor-pointer text-[11.5px] font-semibold px-1 py-0.5"
            >
              不再顯示
            </button>
            <button
              onClick={() => handleDismissHint(false)}
              className="bg-transparent border-none text-[rgba(255,255,255,0.6)] cursor-pointer flex items-center p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 頂部右上角：塗鴉與關閉按鈕 */}
      <div className="fixed top-4 right-4 flex gap-2 z-[10001]">
        {scale > 1 && (
          <button
            onClick={handleResetZoom}
            onTouchStart={handleResetZoom}
            className="inline-flex items-center gap-1.5 h-[38px] px-3 rounded-[10px] bg-[rgba(239,68,68,0.9)] border border-[rgba(255,255,255,0.2)] text-white font-bold cursor-pointer text-[13px] backdrop-blur-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          >
            <RotateCcw size={15} />
            <span>{Math.round(scale * 100)}% (重置)</span>
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(!isEditing)
            if (!isEditing) handleResetZoom()
          }}
          className={`inline-flex items-center gap-1.5 h-[38px] px-3.5 rounded-[10px] border border-[rgba(255,255,255,0.18)] text-white font-semibold cursor-pointer text-[13px] backdrop-blur-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.3)] ${
            isEditing ? 'bg-[#059669]' : 'bg-[rgba(15,23,42,0.85)]'
          }`}
        >
          {isEditing ? (
            <>
              <Check size={16} strokeWidth={2.5} />
              <span>完成</span>
            </>
          ) : (
            <>
              <Pencil size={15} />
              <span>筆記</span>
            </>
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[rgba(15,23,42,0.85)] border border-[rgba(255,255,255,0.18)] text-white cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* 頂部左上角歌單標籤 */}
      {!isEditing && currentSetlistIndex !== null && setlist[currentSetlistIndex] && (
        <div className="fixed top-4 left-4 inline-flex items-center gap-2 bg-[rgba(15,23,42,0.85)] border border-[rgba(255,255,255,0.18)] text-white px-3.5 py-2 rounded-[20px] font-semibold text-[12.5px] z-[10001] max-w-[calc(100vw-220px)] overflow-hidden text-ellipsis whitespace-nowrap">
          <ListMusic size={15} className="shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            歌單 ({currentSetlistIndex + 1}/{setlist.length})：{setlist[currentSetlistIndex].title}
          </span>
        </div>
      )}

      {/* 樂譜 Transform 容器（縮放 / 平移為即時計算值，需保留 inline style） */}
      <div
        ref={containerRef}
        className="w-full max-w-full h-full flex items-center justify-center px-3 py-[70px] box-border origin-center"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isGesturing ? 'none' : 'transform 0.15s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <SheetAnnotator
          sheet={selectedSheet || undefined}
          paths={currentPaths}
          onChangePaths={handlePathsChange}
          isEditing={isEditing}
        >
          <img
            src={activeSheetImages[currentImageIndex]}
            alt="樂譜內容"
            className="w-auto h-auto max-w-full max-h-[calc(100dvh-140px)] object-contain rounded-[8px] shadow-[0_20px_40px_rgba(0,0,0,0.6)] select-none pointer-events-none block mx-auto"
          />
        </SheetAnnotator>
      </div>

      {/* 底部導覽膠囊 */}
      {!isEditing && (
        <div
          className="fixed bottom-4 inline-flex items-center gap-2 text-white bg-[rgba(15,23,42,0.85)] px-3 py-1.5 rounded-[30px] border border-[rgba(255,255,255,0.18)] z-[10001]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { handleResetZoom(); onPrev() }}
            disabled={isPrevDisabled}
            className={NAV_BUTTON_CLASS}
          >
            <ChevronLeft size={16} />
            <span>上一首</span>
          </button>

          <span className="text-[12.5px] font-semibold text-[rgba(255,255,255,0.7)] px-1">
            {currentImageIndex + 1} / {activeSheetImages.length} 頁
          </span>

          <button
            onClick={() => { handleResetZoom(); onNext() }}
            disabled={isNextDisabled}
            className={NAV_BUTTON_CLASS}
          >
            <span>下一首</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
