'use client'

import React, { useState, useRef, ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Sheet } from '@/types'
import { Undo2, Trash2 } from 'lucide-react'

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
  paths,
  onChangePaths,
  isEditing,
  children,
}: SheetAnnotatorProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [color, setColor] = useState('#ef4444')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const svgRef = useRef<SVGSVGElement | null>(null)
  
  // 📌 確保 Client 端掛載後才渲染 Portal
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const getCoordinates = (e: React.PointerEvent) => {
    if (!svgRef.current) return null
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 1000
    const y = ((e.clientY - rect.top) / rect.height) * 1000
    return { x, y }
  }

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
    if (paths.length > 0) onChangePaths(paths.slice(0, -1))
  }

  const handleClearAll = () => {
    if (confirm('確定要清空當前頁面的筆記嗎？')) onChangePaths([])
  }

  // 📌 工具列 DOM 元件
  const toolbarContent = isEditing ? (
    <div 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        padding: '6px 12px',
        borderRadius: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 10005, // 確保浮在 Modal 所有控制列最上方
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        color: 'white',
        maxWidth: 'calc(100vw - 24px)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box'
      }}
    >
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
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          />
        ))}
      </div>

      <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.2)', flexShrink: 0 }} />

      {/* 筆劃粗細選擇器 */}
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0 }}>
        {[{ label: '細', value: 2 }, { label: '中', value: 4 }, { label: '粗', value: 8 }].map((sw) => (
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
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '25px', height: '28px', background: 'none', border: 'none', color: paths.length === 0 ? 'rgba(255, 255, 255, 0.3)' : '#ffffff', cursor: paths.length === 0 ? 'not-allowed' : 'pointer', flexShrink: 0 }}
      >
        <Undo2 size={16} />
      </button>

      {/* 清空按鈕 */}
      <button
        onClick={handleClearAll}
        disabled={paths.length === 0}
        title="清空所有筆記"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '25px', height: '28px', background: 'none', border: 'none', color: paths.length === 0 ? 'rgba(255, 255, 255, 0.3)' : '#f87171', cursor: paths.length === 0 ? 'not-allowed' : 'pointer', flexShrink: 0 }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  ) : null

  return (
    <>
      {/* 📌 使用 Portal 將塗鴉工具列脫離任何 transform 容器，直接掛在 document.body */}
      {mounted && toolbarContent && createPortal(toolbarContent, document.body)}

      {/* 樂譜與 SVG 塗鴉畫布容器 */}
      <div 
        style={{ 
          position: 'relative', 
          display: 'inline-block', 
          maxWidth: '100%', 
          maxHeight: '100%',
          width: '100%',
          height: '100%'
        }}
      >
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
    </>
  )
}