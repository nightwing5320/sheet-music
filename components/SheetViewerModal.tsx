'use client'

import { useState, useEffect } from 'react'
import { Sheet } from '@/types'

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
  const [paths, setPaths] = useState<any[]>([])

  if (activeSheetImages.length === 0) return null

  const isPrevDisabled = currentImageIndex === 0 && (currentSetlistIndex === null || currentSetlistIndex === 0)
  const isNextDisabled = currentImageIndex === activeSheetImages.length - 1 && (currentSetlistIndex === null || currentSetlistIndex === setlist.length - 1)

  // 取得當前歌單樂譜
  const currentSheet = currentSetlistIndex !== null ? setlist[currentSetlistIndex] : null
  const currentAnnotation = currentSheet?.annotation

  // 📌 核心修正：安全解析與格式轉換
  useEffect(() => {
    if (currentAnnotation) {
      try {
        const parsed = typeof currentAnnotation === 'string' ? JSON.parse(currentAnnotation) : currentAnnotation
        if (Array.isArray(parsed)) {
          setPaths(parsed)
        } else {
          setPaths([])
        }
      } catch (e) {
        console.error('解析筆劃失敗:', e)
        setPaths([])
      }
    } else {
      setPaths([])
    }
  }, [currentAnnotation, currentImageIndex, currentSetlistIndex])

  // 📌 輔助函式：將 react-sketch-canvas 的 paths 轉為標準 SVG path d 字串
  const generatePathD = (pathPoints: any[]) => {
    if (!Array.isArray(pathPoints) || pathPoints.length === 0) return ''
    return pathPoints.map((point, index) => {
      if (typeof point.x !== 'number' || typeof point.y !== 'number') return ''
      return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    }).join(' ')
  }

  return (
    <div 
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
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
      {/* 關閉按鈕 */}
      <button 
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        title="關閉全螢幕 (Esc)"
        style={{ 
          position: 'fixed', 
          top: '24px', 
          right: '24px', 
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          border: '2px solid #ffffff',
          color: '#ffffff', 
          fontSize: '28px', 
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)'
        }}
      >
        ✕
      </button>

      {/* 歌單提示條 */}
      {currentSetlistIndex !== null && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          backgroundColor: 'rgba(139, 92, 246, 0.85)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontWeight: '700',
          fontSize: '14px',
          zIndex: 10001,
          backdropFilter: 'blur(8px)'
        }}>
          📋 歌單首數 ({currentSetlistIndex + 1}/{setlist.length})：{setlist[currentSetlistIndex]?.title}
          {paths.length > 0 && <span style={{ marginLeft: '8px', color: '#6ee7b7' }}> (已載入筆記 ✏)</span>}
        </div>
      )}

      {/* 樂譜圖片與 SVG 筆記疊加區 */}
      <div 
        style={{ 
          position: 'relative', 
          width: '100vw', 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 底層樂譜圖片 */}
        <img 
          src={activeSheetImages[currentImageIndex]} 
          alt="樂譜內容" 
          style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none' }} 
        />

        {/* 頂層 SVG 向量筆跡疊加 */}
        {paths.length > 0 && (
          <svg 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              width: '100%', 
              height: '100%', 
              pointerEvents: 'none'
            }}
          >
            {paths.map((pathObj, index) => {
              const d = generatePathD(pathObj.paths)
              if (!d) return null
              return (
                <path
                  key={index}
                  d={d}
                  stroke={pathObj.strokeColor || '#ff2a2a'}
                  strokeWidth={pathObj.strokeWidth || 3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )
            })}
          </svg>
        )}
      </div>

      {/* 底部切換導覽 */}
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
    </div>
  )
}