'use client'

import React, { useState, useRef } from 'react'
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
  ZoomIn
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

  // 放大縮小與平移狀態
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  // 紀錄雙指觸控起始距離與位移
  const touchStartRef = useRef<{ dist: number; scale: number; x: number; y: number; posX: number; posY: number } | null>(null)

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

  // 計算雙指之間的距離
  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 處理縮放與拖曳手勢
  const handleContainerTouchStart = (e: React.TouchEvent) => {
    if (isEditing) return // 塗鴉模式下關閉整體放大縮小平移，避免畫筆誤觸

    if (e.touches.length === 2) {
      // 雙指縮放開始
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
      // 單指平移拖曳（僅在已放大的狀態下）
      touchStartRef.current = {
        dist: 0,
        scale,
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y
      }
    } else {
      onTouchStart(e)
    }
  }

  const handleContainerTouchMove = (e: React.TouchEvent) => {
    if (isEditing || !touchStartRef.current) return

    if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      // 雙指 Pinch 縮放處理
      const newDist = getDistance(e.touches)
      const factor = newDist / touchStartRef.current.dist
      const newScale = Math.min(Math.max(touchStartRef.current.scale * factor, 1), 3.5) // 限制倍率 1x ~ 3.5x
      
      setScale(newScale)
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      }
    } else if (e.touches.length === 1 && touchStartRef.current.dist === 0 && scale > 1) {
      // 單指拖曳平移處理
      const deltaX = e.touches[0].clientX - touchStartRef.current.x
      const deltaY = e.touches[0].clientY - touchStartRef.current.y
      
      setPosition({
        x: touchStartRef.current.posX + deltaX,
        y: touchStartRef.current.posY + deltaY
      })
    }
  }

  const handleContainerTouchEnd = (e: React.TouchEvent) => {
    touchStartRef.current = null
    if (!isEditing && scale === 1) {
      onTouchEnd(e)
    }
  }

  // 重置縮放
  const handleResetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
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
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        touchAction: 'none',
        overflow: 'hidden'
      }}
    >
      {/* 頂部右上角：塗鴉筆記與關閉按鈕 */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', display: 'flex', gap: '10px', zIndex: 10001 }}>
        {/* 重置縮放按鈕（僅在被放大時顯示） */}
        {scale > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleResetZoom()
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '38px',
              padding: '0 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <RotateCcw size={15} />
            <span>{Math.round(scale * 100)}%</span>
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(!isEditing)
            if (!isEditing) handleResetZoom() // 進入塗鴉模式自動歸位 1x
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '38px',
            padding: '0 16px',
            borderRadius: '10px',
            backgroundColor: isEditing ? '#059669' : 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#ffffff',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '13px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          {isEditing ? (
            <>
              <Check size={16} strokeWidth={2.5} />
              <span>完成筆記</span>
            </>
          ) : (
            <>
              <Pencil size={15} />
              <span>塗鴉筆記</span>
            </>
          )}
        </button>

        {/* 關閉 Modal 按鈕 */}
        <button 
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          title="關閉"
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
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* 頂部左上角：歌單資訊標籤 */}
      {!isEditing && currentSetlistIndex !== null && setlist[currentSetlistIndex] && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '20px',
          fontWeight: '600',
          fontSize: '13px',
          zIndex: 10001,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <ListMusic size={16} />
          <span>歌單 ({currentSetlistIndex + 1}/{setlist.length})：{setlist[currentSetlistIndex].title}</span>
        </div>
      )}

      {/* 樂譜與塗鴉 Transform 縮放 Container */}
      <div 
        style={{ 
          width: '100vw', 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '16px',
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
              maxWidth: '96vw', 
              maxHeight: '90vh', 
              objectFit: 'contain', 
              borderRadius: '8px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              pointerEvents: 'none', // 防止圖片干擾事件
            }} 
          />
        </SheetAnnotator>
      </div>

      {/* 底部懸浮膠囊翻頁導覽 */}
      {!isEditing && (
        <div 
          style={{ 
            position: 'fixed',
            bottom: '20px',
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '12px', 
            color: '#ffffff',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            padding: '6px 14px',
            borderRadius: '30px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
            zIndex: 10001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => {
              handleResetZoom()
              onPrev()
            }}
            disabled={isPrevDisabled}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '34px',
              padding: '0 14px', 
              borderRadius: '18px', 
              backgroundColor: isPrevDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.15)', 
              color: isPrevDisabled ? 'rgba(255, 255, 255, 0.3)' : '#ffffff', 
              border: 'none', 
              cursor: isPrevDisabled ? 'not-allowed' : 'pointer', 
              fontWeight: '600', 
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronLeft size={16} />
            <span>上一首 / 上首</span>
          </button>

          <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', padding: '0 6px' }}>
            {currentImageIndex + 1} / {activeSheetImages.length} 頁
          </span>

          <button 
            onClick={() => {
              handleResetZoom()
              onNext()
            }}
            disabled={isNextDisabled}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '34px',
              padding: '0 14px', 
              borderRadius: '18px', 
              backgroundColor: isNextDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.15)', 
              color: isNextDisabled ? 'rgba(255, 255, 255, 0.3)' : '#ffffff', 
              border: 'none', 
              cursor: isNextDisabled ? 'not-allowed' : 'pointer', 
              fontWeight: '600', 
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>下一首 / 下首</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}