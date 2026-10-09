'use client'

import React, { useState } from 'react'
import { Sheet } from '@/types'
import { SheetAnnotator, PathData } from './SheetAnnotator'
import { 
  X, 
  Pencil, 
  Check, 
  ListMusic, 
  ChevronLeft, 
  ChevronRight 
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

  if (!activeSheetImages || activeSheetImages.length === 0) return null

  // 優先使用 selectedSheet 的 id，如果沒有，則使用 setlist 中的當前索引 id，最後退回到 'temp'
  const currentSheetId = selectedSheet?.id 
    ?? (currentSetlistIndex !== null && setlist[currentSetlistIndex] ? setlist[currentSetlistIndex].id : 'temp')

  const annotationKey = `sheet-${currentSheetId}-page-${currentImageIndex}`
  const currentPaths = annotations[annotationKey] || []

  const handlePathsChange = (newPaths: PathData[]) => {
    onUpdateAnnotations(annotationKey, newPaths)
  }

  const isPrevDisabled = currentImageIndex === 0 && (currentSetlistIndex === null || currentSetlistIndex === 0)
  const isNextDisabled = currentImageIndex === activeSheetImages.length - 1 && (currentSetlistIndex === null || currentSetlistIndex === setlist.length - 1)

  return (
    <div 
      onClick={onClose}
      onTouchStart={isEditing ? undefined : onTouchStart}
      onTouchEnd={isEditing ? undefined : onTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.88)', // 深石墨半透明背景
        backdropFilter: 'blur(12px)',               // 高級毛玻璃模糊
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        touchAction: isEditing ? 'none' : 'pan-y'
      }}
    >
      {/* 頂部右上角：塗鴉筆記與關閉按鈕 */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', display: 'flex', gap: '10px', zIndex: 10001 }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(!isEditing)
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
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.85)'
            e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.13)'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* 頂部左上角：歌單資訊標籤 */}
      {currentSetlistIndex !== null && setlist[currentSetlistIndex] && (
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

      {/* 樂譜顯示與 SVG Overlay 塗鴉區塊 */}
      <div 
        style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
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
              userSelect: 'none',
              borderRadius: '8px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)' // 高質感樂譜邊框陰影
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
          {/* 上一頁 / 上首 */}
          <button 
            onClick={onPrev}
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
            onMouseEnter={(e) => {
              if (!isPrevDisabled) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'
            }}
            onMouseLeave={(e) => {
              if (!isPrevDisabled) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <ChevronLeft size={16} />
            <span>上一首 / 上首</span>
          </button>

          <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', padding: '0 6px' }}>
            {currentImageIndex + 1} / {activeSheetImages.length} 頁
          </span>

          {/* 下一頁 / 下首 */}
          <button 
            onClick={onNext}
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
            onMouseEnter={(e) => {
              if (!isNextDisabled) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'
            }}
            onMouseLeave={(e) => {
              if (!isNextDisabled) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
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