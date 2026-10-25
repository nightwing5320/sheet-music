'use client'

import React, { useState, useRef, ReactNode } from 'react'
import { Sheet } from '@/types'
import { Undo2, Trash2, RotateCcw } from 'lucide-react'

export interface PathData {
  id: string
  d: string
  color: string
  strokeWidth: number
}

interface SheetAnnotatorProps {
  sheet?: Sheet
  paths: PathData[]
  onChangePaths: (paths: PathData[]) => void
  isEditing: boolean
  children: ReactNode
}

export function SheetAnnotator({
  sheet,
  paths,
  onChangePaths,
  isEditing,
  children,
}: SheetAnnotatorProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [color, setColor] = useState('#ef4444') // 預設紅色
  const [strokeWidth, setStrokeWidth] = useState(4)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 縮放 (Scale) 與 平移 (Position) 狀態
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const touchStartRef = useRef<{ dist: number; scale: number; x: number; y: number; posX: number; posY: number } | null>(null)

  // 重置倍率與位置歸位
  const handleResetZoom = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // 取得相對 SVG 座標 (換算成 0~1000 歸一化坐標系，確保縮放時筆記位置不偏移)
  const getCoordinates = (e: React.PointerEvent) => {
    if (!svgRef.current) return null
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 1000
    const y = ((e.clientY - rect.top) / rect.height) * 1000
    return { x, y }
  }

  // 僅允許 Apple Pencil (pen) 或 Mouse，排除 Touch 手指觸控
  const isPencilOrMouse = (e: React.PointerEvent) => {
    return e.pointerType === 'pen' || e.pointerType === 'mouse'
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isEditing || !isPencilOrMouse(e)) return
    e.preventDefault()

    setIsDrawing(true)
    const coords = getCoordinates(e)
    if (!coords) return
    setCurrentPath(`M ${coords.x} ${coords.y}`)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !isEditing || !isPencilOrMouse(e)) return

    const coords = getCoordinates(e)
    if (!coords) return
    setCurrentPath((prev) => `${prev} L ${coords.x} ${coords.y}`)
  }

  const handlePointerUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (currentPath) {
      const newPath: PathData = {
        id: Date.now().toString(),
        d: currentPath,
        color,
        strokeWidth,
      }
      onChangePaths([...paths, newPath])
      setCurrentPath('')
    }
  }

  const handleUndo = () => {
    if (paths.length > 0) {
      onChangePaths(paths.slice(0, -1))
    }
  }

  const handleClearAll = () => {
    if (confirm('確定要清空當前頁面的筆記嗎？')) {
      onChangePaths([])
    }
  }

  // 計算兩點間距離 (雙指縮放)
  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 計算拖曳平移邊界限制 (防止樂譜被拖移到視窗外面找不到)
  const clampPosition = (newX: number, newY: number, currentScale: number) => {
    if (!containerRef.current || currentScale <= 1) {
      return { x: 0, y: 0 }
    }

    const rect = containerRef.current.getBoundingClientRect()
    // 允許向外滑動的最大極限（以當前圖片放大後的尺寸計算）
    const maxX = (rect.width * (currentScale - 1)) / 2
    const maxY = (rect.height * (currentScale - 1)) / 2

    const clampedX = Math.min(Math.max(newX, -maxX), maxX)
    const clampedY = Math.min(Math.max(newY, -maxY), maxY)

    return { x: clampedX, y: clampedY }
  }

  // 雙指縮放與單指平移 Touch 手勢邏輯
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 雙指 Pinch 縮放開始
      const dist = getDistance(e.touches)
      touchStartRef.current = {
        dist,
        scale,
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        posX: position.x,
        posY: position.y
      }
    } else if (e.touches.length === 1 && scale > 1 && !isDrawing) {
      // 已放大狀態下的單指拖曳平移
      touchStartRef.current = {
        dist: 0,
        scale,
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      // 雙指 Pinch 縮放計算 (限制倍率 1x ~ 3.5x)
      const newDist = getDistance(e.touches)
      const factor = newDist / touchStartRef.current.dist
      const newScale = Math.min(Math.max(touchStartRef.current.scale * factor, 1), 3.5)
      
      setScale(newScale)
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      } else {
        // 縮放時同時套用邊界保護
        setPosition((prev) => clampPosition(prev.x, prev.y, newScale))
      }
    } else if (e.touches.length === 1 && touchStartRef.current.dist === 0 && scale > 1) {
      // 單指平移拖曳計算（套用極限邊界檢查）
      const deltaX = e.touches[0].clientX - touchStartRef.current.x
      const deltaY = e.touches[0].clientY - touchStartRef.current.y
      
      const rawX = touchStartRef.current.posX + deltaX
      const rawY = touchStartRef.current.posY + deltaY

      setPosition(clampPosition(rawX, rawY, scale))
    }
  }

  const handleTouchEnd = () => {
    touchStartRef.current = null
  }

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >

      {/* 塗鴉模式專屬懸浮工具列 (Annotation Floating Toolbar - 響應式微型化) */}
      {isEditing && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          padding: '6px 12px',
          borderRadius: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 10002,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          color: 'white',
          maxWidth: 'calc(100vw - 24px)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxSizing: 'border-box'
        }}>
          {/* 重置縮放按鈕 (當放大時自動顯示當前倍率) */}
          {scale > 1 && (
            <button
              onClick={handleResetZoom}
              onMouseDown={handleResetZoom}
              onTouchStart={handleResetZoom}
              title="重置倍率"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700',
                flexShrink: 0
              }}
            >
              <RotateCcw size={13} />
              <span>{Math.round(scale * 100)}% (重置)</span>
            </button>
          )}

          {/* 顏色選擇器 */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
            {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#000000', '#ffffff'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: color === c ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.39)',
                  cursor: 'pointer',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: color === c ? '0 0 10px rgba(255, 255, 255, 0.5)' : 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  flexShrink: 0
                }}
              />
            ))}
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.2)', flexShrink: 0 }} />

          {/* 筆劃粗細選擇器 */}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0 }}>
            {[
              { label: '細', value: 2 },
              { label: '中', value: 4 },
              { label: '粗', value: 8 }
            ].map((sw) => (
              <button
                key={sw.value}
                onClick={() => setStrokeWidth(sw.value)}
                style={{
                  padding: '2px 6px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: strokeWidth === sw.value ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                  color: strokeWidth === sw.value ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                {sw.label}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.2)', flexShrink: 0 }} />

          {/* 復原按鈕 */}
          <button
            onClick={handleUndo}
            disabled={paths.length === 0}
            title="復原上一步"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              background: 'none',
              border: 'none',
              color: paths.length === 0 ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
              cursor: paths.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <Undo2 size={16} />
          </button>

          {/* 清空按鈕 */}
          <button
            onClick={handleClearAll}
            disabled={paths.length === 0}
            title="清空所有筆記"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              background: 'none',
              border: 'none',
              color: paths.length === 0 ? 'rgba(255, 255, 255, 0.3)' : '#f87171',
              cursor: paths.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* 樂譜與 SVG 塗鴉圖層 (套用位移 translate 與縮放 scale) */}
      <div style={{ 
        position: 'relative', 
        display: 'inline-block', 
        maxWidth: '100%', 
        maxHeight: '100%',
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        transformOrigin: 'center center',
        transition: touchStartRef.current ? 'none' : 'transform 0.15s ease-out'
      }}>
        {children}

        <svg
          ref={svgRef}
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            cursor: isEditing ? 'crosshair' : 'default',
            pointerEvents: isEditing ? 'all' : 'none',
            touchAction: 'none'
          }}
        >
          {paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              stroke={p.color}
              strokeWidth={p.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {currentPath && (
            <path
              d={currentPath}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </div>
  )
}