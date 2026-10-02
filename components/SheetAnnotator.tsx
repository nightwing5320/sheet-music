'use client'

import React, { useState, useRef, ReactNode } from 'react'

export interface PathData {
  id: string
  d: string
  color: string
  strokeWidth: number
}

interface SheetAnnotatorProps {
  paths: PathData[]
  onChangePaths: (paths: PathData[]) => void
  isEditing: boolean
  children: ReactNode // 放入樂譜圖片
}

export function SheetAnnotator({
  paths,
  onChangePaths,
  isEditing,
  children,
}: SheetAnnotatorProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [color, setColor] = useState('#ef4444') // 預設紅色
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [mode, setMode] = useState<'pen' | 'eraser'>('pen')
  const svgRef = useRef<SVGSVGElement | null>(null)

  // 取得相對 SVG 座標
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return null
    const rect = svgRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    // 換算成 0~1000 比例坐標系，確保縮放時筆記位置不偏移
    const x = ((clientX - rect.left) / rect.width) * 1000
    const y = ((clientY - rect.top) / rect.height) * 1000
    return { x, y }
  }

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditing) return
    const coords = getCoordinates(e)
    if (!coords) return

    setIsDrawing(true)
    setCurrentPath(`M ${coords.x} ${coords.y}`)
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isEditing) return
    const coords = getCoordinates(e)
    if (!coords) return

    setCurrentPath((prev) => `${prev} L ${coords.x} ${coords.y}`)
  }

  const handlePointerUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (currentPath) {
      if (mode === 'pen') {
        const newPath: PathData = {
          id: Date.now().toString(),
          d: currentPath,
          color,
          strokeWidth,
        }
        onChangePaths([...paths, newPath])
      }
      setCurrentPath('')
    }
  }

  // 點擊刪除筆劃（橡皮擦模式）
  const handlePathClick = (id: string, e: React.MouseEvent) => {
    if (mode === 'eraser' && isEditing) {
      e.stopPropagation()
      onChangePaths(paths.filter((p) => p.id !== id))
    }
  }

  // 復原上一筆 (Undo)
  const handleUndo = () => {
    if (paths.length > 0) {
      onChangePaths(paths.slice(0, -1))
    }
  }

  // 清空當頁筆記
  const handleClearAll = () => {
    if (confirm('確定要清空當前頁面的筆記嗎？')) {
      onChangePaths([])
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* 編輯控制工具列 (僅在編輯模式顯示) */}
      {isEditing && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '8px 16px',
          borderRadius: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10002,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          color: 'white'
        }}>
          {/* 畫筆 / 橡皮擦 切換 */}
          <button
            onClick={() => setMode('pen')}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: mode === 'pen' ? '#3b82f6' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px'
            }}
          >
            ✏️ 畫筆
          </button>

          <button
            onClick={() => setMode('eraser')}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: mode === 'eraser' ? '#ef4444' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px'
            }}
          >
            🧹 橡皮擦
          </button>

          {/* 顏色選擇 */}
          {mode === 'pen' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#000000'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: color === c ? '2px solid white' : '1px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.1s ease'
                  }}
                />
              ))}
            </div>
          )}

          {/* 粗細調整 */}
          {mode === 'pen' && (
            <select
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '12px'
              }}
            >
              <option value={2} style={{ color: 'black' }}>細</option>
              <option value={4} style={{ color: 'black' }}>中</option>
              <option value={8} style={{ color: 'black' }}>粗</option>
            </select>
          )}

          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

          {/* 復原 & 清空 */}
          <button
            onClick={handleUndo}
            disabled={paths.length === 0}
            style={{
              background: 'none',
              border: 'none',
              color: paths.length === 0 ? '#666' : 'white',
              cursor: paths.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px'
            }}
          >
            ↩ 復原
          </button>

          <button
            onClick={handleClearAll}
            disabled={paths.length === 0}
            style={{
              background: 'none',
              border: 'none',
              color: paths.length === 0 ? '#666' : '#f87171',
              cursor: paths.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px'
            }}
          >
            🗑️ 清空
          </button>
        </div>
      )}

      {/* 底部樂譜圖片容器 */}
      <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '100%' }}>
        {children}

        {/* 頂層 SVG Overlay 畫布 */}
        <svg
          ref={svgRef}
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            cursor: isEditing ? (mode === 'pen' ? 'crosshair' : 'pointer') : 'default',
            pointerEvents: isEditing ? 'all' : 'none', // 非編輯模式時讓點擊穿透
            touchAction: isEditing ? 'none' : 'auto' // 編輯時停止預設滾動/滑動
          }}
        >
          {/* 已畫好的 Path */}
          {paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              stroke={p.color}
              strokeWidth={p.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              onClick={(e) => handlePathClick(p.id, e)}
              style={{
                cursor: mode === 'eraser' && isEditing ? 'pointer' : 'default',
                opacity: mode === 'eraser' && isEditing ? 0.8 : 1
              }}
            />
          ))}

          {/* 當前正在畫的 Path */}
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