'use client'

import { useState } from 'react'
import { Sheet } from '@/types'
import { SheetAnnotator, PathData } from './SheetAnnotator'

interface SheetViewerModalProps {
  activeSheetImages: string[]
  currentImageIndex: number
  currentSetlistIndex: number | null
  setlist: Sheet[]
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

export function SheetViewerModal({
  activeSheetImages,
  currentImageIndex,
  currentSetlistIndex,
  setlist,
  onClose,
  onPrev,
  onNext,
  onTouchStart,
  onTouchEnd,
}: SheetViewerModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  // 用 Key 來存放每一首樂譜/每一頁的筆記資料 (例如: "sheet-12-page-0")
  const [annotations, setAnnotations] = useState<Record<string, PathData[]>>({})

  if (activeSheetImages.length === 0) return null

  const currentSheetId = currentSetlistIndex !== null ? setlist[currentSetlistIndex]?.id : 'single'
  const annotationKey = `sheet-${currentSheetId}-page-${currentImageIndex}`
  const currentPaths = annotations[annotationKey] || []

  const handlePathsChange = (newPaths: PathData[]) => {
    setAnnotations((prev) => ({
      ...prev,
      [annotationKey]: newPaths,
    }))
  }

  const isPrevDisabled = currentImageIndex === 0 && (currentSetlistIndex === null || currentSetlistIndex === 0)
  const isNextDisabled = currentImageIndex === activeSheetImages.length - 1 && (currentSetlistIndex === null || currentSetlistIndex === setlist.length - 1)

  return (
    <div 
      onClick={onClose}
      onTouchStart={isEditing ? undefined : onTouchStart} // 編輯時暫停滑動翻頁
      onTouchEnd={isEditing ? undefined : onTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        touchAction: 'pan-y'
      }}
    >
      {/* 頂部右上角：編輯切換 + 關閉 */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', display: 'flex', gap: '12px', zIndex: 10001 }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(!isEditing)
          }}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: isEditing ? '#10b981' : 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            backdropFilter: 'blur(8px)'
          }}
        >
          {isEditing ? '✓ 完成筆記' : '✏️ 塗鴉筆記'}
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          style={{ 
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff', 
            fontSize: '20px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* 歌單資訊提示 */}
      {currentSetlistIndex !== null && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          backgroundColor: 'rgba(124, 58, 237, 0.85)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontWeight: '600',
          fontSize: '14px',
          zIndex: 10001,
          backdropFilter: 'blur(8px)'
        }}>
          📋 歌單 ({currentSetlistIndex + 1}/{setlist.length})：{setlist[currentSetlistIndex]?.title}
        </div>
      )}

      {/* 樂譜與筆記區域 */}
      <div 
        style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <SheetAnnotator
          paths={currentPaths}
          onChangePaths={handlePathsChange}
          isEditing={isEditing}
        >
          <img 
            src={activeSheetImages[currentImageIndex]} 
            alt="樂譜內容" 
            style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', userSelect: 'none' }} 
          />
        </SheetAnnotator>
      </div>

      {/* 底部翻頁導覽列 */}
      {!isEditing && (
        <div 
          style={{ 
            position: 'fixed',
            bottom: '20px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            padding: '8px 20px',
            borderRadius: '30px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            zIndex: 10001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onPrev}
            disabled={isPrevDisabled}
            style={{ 
              padding: '6px 14px', 
              borderRadius: '20px', 
              backgroundColor: isPrevDisabled ? 'rgba(255,255,255,0.1)' : '#0070f3', 
              color: isPrevDisabled ? '#888' : 'white', 
              border: 'none', 
              cursor: isPrevDisabled ? 'not-allowed' : 'pointer', 
              fontWeight: '600', 
              fontSize: '13px' 
            }}
          >
            ← 上一頁 / 上首
          </button>

          <span style={{ fontSize: '14px', fontWeight: '600' }}>
            第 {currentImageIndex + 1} / {activeSheetImages.length} 頁
          </span>

          <button 
            onClick={onNext}
            disabled={isNextDisabled}
            style={{ 
              padding: '6px 14px', 
              borderRadius: '20px', 
              backgroundColor: isNextDisabled ? 'rgba(255,255,255,0.1)' : '#0070f3', 
              color: isNextDisabled ? '#888' : 'white', 
              border: 'none', 
              cursor: isNextDisabled ? 'not-allowed' : 'pointer', 
              fontWeight: '600', 
              fontSize: '13px' 
            }}
          >
            下一頁 / 下首 →
          </button>
        </div>
      )}
    </div>
  )
}