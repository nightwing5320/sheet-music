'use client'

import { useRef, useEffect } from 'react'
import { Sheet } from '@/types'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'

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
  const canvasRef = useRef<ReactSketchCanvasRef>(null)

  if (activeSheetImages.length === 0) return null

  const isPrevDisabled = currentImageIndex === 0 && (currentSetlistIndex === null || currentSetlistIndex === 0)
  const isNextDisabled = currentImageIndex === activeSheetImages.length - 1 && (currentSetlistIndex === null || currentSetlistIndex === setlist.length - 1)

  // 📌 取得當前歌單項目的樂譜資料與筆劃紀錄
  const currentSheet = currentSetlistIndex !== null ? setlist[currentSetlistIndex] : null
  const currentAnnotation = currentSheet?.annotation

  // 📌 當切換頁面或歌曲時，載入對應的筆劃紀錄
  useEffect(() => {
    if (currentAnnotation && canvasRef.current) {
      try {
        const paths = JSON.parse(currentAnnotation)
        canvasRef.current.clearCanvas()
        canvasRef.current.loadPaths(paths)
      } catch (e) {
        console.error('載入全螢幕筆記失敗:', e)
      }
    } else if (canvasRef.current) {
      canvasRef.current.clearCanvas()
    }
  }, [currentAnnotation, currentImageIndex, currentSetlistIndex])

  return (
    <div 
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 0,
        boxSizing: 'border-box',
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

      {/* 歌單資訊提示 */}
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
          {currentAnnotation && <span style={{ marginLeft: '8px', color: '#6ee7b7' }}> (已載入筆記 ✏️️)</span>}
        </div>
      )}

      {/* 樂譜圖片與塗鴉畫布重疊區 */}
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

        {/* 頂層唯讀筆記畫布 (有筆記時才渲染) */}
        {currentAnnotation && (
          <div 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              pointerEvents: 'none', // 📌 關鍵：讓點擊與滑動直接穿透到外層，不影響翻頁
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ReactSketchCanvas
              ref={canvasRef}
              canvasColor="transparent"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
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