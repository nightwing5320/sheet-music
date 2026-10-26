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
  const [showGestureHint, setShowGestureHint] = useState(false)

  useEffect(() => {
    // 檢查使用者是否曾點擊「不再顯示」
    const hideHint = localStorage.getItem('hide_sheet_viewer_gesture_hint')
    if (!hideHint) {
      setShowGestureHint(true)
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
      const touch = nativeEvent.touches[0] as any
      if (touch.touchType === 'stylus') {
        return
      }
    }

    if (e.touches.length === 2) {
      const dist = getDistance(e.touches)
      touchStartRef.current = {
        dist,
        scale,
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        posX: position.x,
        posY: position.y
      }
    } else if (e.touches.length === 1 && scale > 1) {
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
      const touch = nativeEvent.touches[0] as any
      if (touch.touchType === 'stylus') {
        return
      }
    }

    if (!touchStartRef.current) return

    if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
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
      const deltaX = e.touches[0].clientX - touchStartRef.current.x
      const deltaY = e.touches[0].clientY - touchStartRef.current.y
      
      const rawX = touchStartRef.current.posX + deltaX
      const rawY = touchStartRef.current.posY + deltaY

      setPosition(clampPosition(rawX, rawY, scale))
    }
  }

  const handleContainerTouchEnd = (e: React.TouchEvent) => {
    touchStartRef.current = null
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
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100dvh',
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        touchAction: 'none',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* 頂部懸浮手勢操作說明條 (提示膠囊) */}
      {showGestureHint && !isEditing && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(30, 41, 59, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: '24px',
            fontSize: '12px',
            fontWeight: '500',
            zIndex: 10003,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
            whiteSpace: 'nowrap',
            maxWidth: 'calc(100vw - 32px)',
            boxSizing: 'border-box'
          }}
        >
          <Info size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <span>雙指可縮放 ｜ 單指拖曳移動 ｜ 點按“筆記”可用觸控筆直接劃記</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>
            <button
              onClick={() => handleDismissHint(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: '600',
                padding: '2px 4px'
              }}
            >
              不再顯示
            </button>
            <button
              onClick={() => handleDismissHint(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 頂部右上角：塗鴉與關閉按鈕 */}
      <div style={{ position: 'fixed', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 10001 }}>
        {scale > 1 && (
          <button
            onClick={handleResetZoom}
            onTouchStart={handleResetZoom}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '38px',
              padding: '0 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '38px',
            padding: '0 14px',
            borderRadius: '10px',
            backgroundColor: isEditing ? '#059669' : 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#ffffff',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '13px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
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
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#ffffff', 
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* 頂部左上角歌單標籤 */}
      {!isEditing && currentSetlistIndex !== null && setlist[currentSetlistIndex] && (
        <div style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          color: '#ffffff',
          padding: '8px 14px',
          borderRadius: '20px',
          fontWeight: '600',
          fontSize: '12.5px',
          zIndex: 10001,
          maxWidth: 'calc(100vw - 220px)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          <ListMusic size={15} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            歌單 ({currentSetlistIndex + 1}/{setlist.length})：{setlist[currentSetlistIndex].title}
          </span>
        </div>
      )}

      {/* 樂譜 Transform 容器 */}
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          maxWidth: '100%',
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '70px 12px 70px 12px',
          boxSizing: 'border-box',
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: touchStartRef.current ? 'none' : 'transform 0.15s ease-out'
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
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: '100%', 
              maxHeight: 'calc(100dvh - 140px)', 
              objectFit: 'contain', 
              borderRadius: '8px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none',
              display: 'block',
              margin: '0 auto'
            }} 
          />
        </SheetAnnotator>
      </div>

      {/* 底部導覽膠囊 */}
      {!isEditing && (
        <div 
          style={{ 
            position: 'fixed',
            bottom: '16px',
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#ffffff',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            padding: '6px 12px',
            borderRadius: '30px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            zIndex: 10001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { handleResetZoom(); onPrev() }}
            disabled={isPrevDisabled}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '34px', padding: '0 12px', borderRadius: '18px', backgroundColor: isPrevDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.15)', color: isPrevDisabled ? 'rgba(255, 255, 255, 0.3)' : '#ffffff', border: 'none', cursor: isPrevDisabled ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '12.5px' }}
          >
            <ChevronLeft size={16} />
            <span>上一首</span>
          </button>

          <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', padding: '0 4px' }}>
            {currentImageIndex + 1} / {activeSheetImages.length} 頁
          </span>

          <button 
            onClick={() => { handleResetZoom(); onNext() }}
            disabled={isNextDisabled}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '34px', padding: '0 12px', borderRadius: '18px', backgroundColor: isNextDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.15)', color: isNextDisabled ? 'rgba(255, 255, 255, 0.3)' : '#ffffff', border: 'none', cursor: isNextDisabled ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '12.5px' }}
          >
            <span>下一首</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}