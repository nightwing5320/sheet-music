'use client'

import { useRef, useEffect, useState } from 'react'
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
  const [parsedPaths, setParsedPaths] = useState<any[] | null>(null)

  if (activeSheetImages.length === 0) return null

  const isPrevDisabled = currentImageIndex === 0 && (currentSetlistIndex === null || currentSetlistIndex === 0)
  const isNextDisabled = currentImageIndex === activeSheetImages.length - 1 && (currentSetlistIndex === null || currentSetlistIndex === setlist.length - 1)

  const currentSheet = currentSetlistIndex !== null ? setlist[currentSetlistIndex] : null
  const currentAnnotation = currentSheet?.annotation

  // 📌 1. 安全解析筆記 JSON
  useEffect(() => {
    if (currentAnnotation) {
      try {
        const paths = typeof currentAnnotation === 'string' ? JSON.parse(currentAnnotation) : currentAnnotation
        if (Array.isArray(paths)) {
          setParsedPaths(paths)
        } else {
          setParsedPaths(null)
        }
      } catch (e) {
        console.error('筆跡解析失敗:', e)
        setParsedPaths(null)
      }
    } else {
      setParsedPaths(null)
    }
  }, [currentAnnotation, currentImageIndex, currentSetlistIndex])

  // 📌 2. 當元件掛載或 parsedPaths 更新時，透過 ref 將筆劃載入進畫布
  useEffect(() => {
    if (parsedPaths && canvasRef.current) {
      // 使用 setTimeout 確保 Canvas DOM 已經完全佈局後再載入
      const timer = setTimeout(() => {
        canvasRef.current?.clearCanvas()
        canvasRef.current?.loadPaths(parsedPaths)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [parsedPaths])

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
      {/* 關閉按鈕與提示訊息保持原樣 ... */}

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

        {/* 頂層唯讀筆記畫布 */}
        {parsedPaths && (
          <div 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              pointerEvents: 'none', // 點擊穿透，不干擾翻頁
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* 📌 移除引發報錯的 initialPaths，改回純 ReactSketchCanvas 標籤 */}
            <ReactSketchCanvas
              key={`${currentSetlistIndex}-${currentImageIndex}`}
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