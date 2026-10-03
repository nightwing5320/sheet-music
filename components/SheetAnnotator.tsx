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
    
    // 換算成 0~1000 比例坐標系，確保縮放時筆記位置不偏移
    const x = ((e.clientX - rect.left) / rect.width) * 1000
    const y = ((e.clientY - rect.top) / rect.height) * 1000
    return { x, y }
  }

  // 📌 核心關鍵：只允許 Apple Pencil (pen) 或 滑鼠 (mouse) 繪圖，拒絕手指 (touch)
  const isPencilOrMouse = (e: React.PointerEvent) => {
    // pointerType 包含: 'pen' (Apple Pencil/觸控筆), 'mouse' (電腦滑鼠/軌跡板), 'touch' (手指)
    return e.pointerType === 'pen' || e.pointerType === 'mouse'
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isEditing) return
    if (!isPencilOrMouse(e)) return // 👈 手指觸碰時直接忽略，不觸發繪圖

    const coords = getCoordinates(e)
    if (!coords) return

    setIsDrawing(true)
    setCurrentPath(`M ${coords.x} ${coords.y}`)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !isEditing) return
    if (!isPencilOrMouse(e)) return // 👈 手指移動時直接忽略

    const coords = getCoordinates(e)
    if (!coords) return

    setCurrentPath((prev) => `${prev} L ${coords.x} ${coords.y}`)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
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

  const handlePathClick = (id: string, e: React.MouseEvent) => {
    if (mode === 'eraser' && isEditing) {
      e.stopPropagation()
      onChangePaths(paths.filter((p) => p.id !== id))
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
      
      {/* 編輯控制工具列 */}
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

      {/* 樂譜內容與 SVG 畫布 */}
      <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '100%' }}>
        {children}

        {/* 📌 使用最新的 Pointer Events 替代傳統 Touch Events */}
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
            cursor: isEditing ? (mode === 'pen' ? 'crosshair' : 'pointer') : 'default',
            pointerEvents: isEditing ? 'all' : 'none',
            touchAction: 'none' // 阻止 iPad 預設的手勢滾動/縮放干擾繪圖
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
              onClick={(e) => handlePathClick(p.id, e)}
              style={{
                cursor: mode === 'eraser' && isEditing ? 'pointer' : 'default',
                opacity: mode === 'eraser' && isEditing ? 0.8 : 1
              }}
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