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
  children: ReactNode
}

export function SheetAnnotator({
  paths,
  onChangePaths,
  isEditing,
  children,
}: SheetAnnotatorProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [color, setColor] = useState('#ef4444')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [mode, setMode] = useState<'pen' | 'eraser'>('pen')
  const svgRef = useRef<SVGSVGElement | null>(null)

  // 取得相對 SVG 座標
  const getCoordinates = (e: React.PointerEvent) => {
    if (!svgRef.current) return null
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 1000
    const y = ((e.clientY - rect.top) / rect.height) * 1000
    return { x, y }
  }

  // 僅允許 Apple Pencil (pen) 或 Mouse，排除 Touch 手指
  const isPencilOrMouse = (e: React.PointerEvent) => {
    return e.pointerType === 'pen' || e.pointerType === 'mouse'
  }

  // 橡皮擦：擦除指定 ID 的線條
  const erasePath = (id: string) => {
    onChangePaths(paths.filter((p) => p.id !== id))
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isEditing || !isPencilOrMouse(e)) return

    setIsDrawing(true)
    const coords = getCoordinates(e)
    if (!coords) return

    if (mode === 'pen') {
      setCurrentPath(`M ${coords.x} ${coords.y}`)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !isEditing || !isPencilOrMouse(e)) return

    const coords = getCoordinates(e)
    if (!coords) return

    if (mode === 'pen') {
      setCurrentPath((prev) => `${prev} L ${coords.x} ${coords.y}`)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (mode === 'pen' && currentPath) {
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* 頂部工具列 */}
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

      {/* 樂譜容器 */}
      <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '100%' }}>
        {children}

        {/* SVG 畫布 */}
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
            cursor: isEditing ? (mode === 'pen' ? 'crosshair' : 'cell') : 'default',
            pointerEvents: isEditing ? 'all' : 'none',
            touchAction: 'none'
          }}
        >
          {/* 已畫好的線條 */}
          {paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              stroke={p.color}
              strokeWidth={mode === 'eraser' && isEditing ? Math.max(p.strokeWidth, 20) : p.strokeWidth} // 橡皮擦模式下加大感應熱區
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              onPointerDown={(e) => {
                if (mode === 'eraser' && isEditing) {
                  e.stopPropagation()
                  erasePath(p.id)
                }
              }}
              onPointerEnter={(e) => {
                // 📌 支援「滑動擦除」：只要按著 Pencil 劃過線條就自動清除
                if (mode === 'eraser' && isEditing && isDrawing) {
                  erasePath(p.id)
                }
              }}
              style={{
                cursor: mode === 'eraser' && isEditing ? 'pointer' : 'default',
                transition: 'opacity 0.1s ease',
              }}
            />
          ))}

          {/* 當前繪製中的線條 */}
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