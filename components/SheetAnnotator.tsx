'use client'

import React, { useState, useRef, ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Sheet } from '@/types'
import { Undo2, Trash2, GripVertical } from 'lucide-react'

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
  // 可拖曳工具列的位置狀態
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 })

  // 塗鴉繪圖狀態
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [color, setColor] = useState('#ef4444')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // 滑鼠 / 觸控 拖曳開始
  const handleStartDrag = (clientX: number, clientY: number) => {
    const currentX = toolbarPos ? toolbarPos.x : (window.innerWidth / 2 - 160)
    const currentY = toolbarPos ? toolbarPos.y : 70

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      initialX: currentX,
      initialY: currentY,
    }
    isDraggingRef.current = true
  }

  // 移動計算
  const handleMoveDrag = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return

    const deltaX = clientX - dragStartRef.current.x
    const deltaY = clientY - dragStartRef.current.y

    const newX = Math.min(Math.max(10, dragStartRef.current.initialX + deltaX), window.innerWidth - 220)
    const newY = Math.min(Math.max(10, dragStartRef.current.initialY + deltaY), window.innerHeight - 60)

    setToolbarPos({ x: newX, y: newY })
  }

  // 拖曳結束
  const handleEndDrag = () => {
    isDraggingRef.current = false
  }

  // 電腦版：綁定全局 window 滑鼠事件
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleStartDrag(e.clientX, e.clientY)

    const onMouseMove = (moveEvent: MouseEvent) => {
      handleMoveDrag(moveEvent.clientX, moveEvent.clientY)
    }

    const onMouseUp = () => {
      handleEndDrag()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // 手機版：觸控事件
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.touches[0]
    handleStartDrag(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return
    e.stopPropagation()
    const touch = e.touches[0]
    handleMoveDrag(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    handleEndDrag()
  }

  // 塗鴉繪圖事件
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

  // 整合 Portal 工具列
  const toolbarContent = isEditing ? (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        left: toolbarPos ? `${toolbarPos.x}px` : '50%',
        top: toolbarPos ? `${toolbarPos.y}px` : '70px',
        transform: toolbarPos ? 'none' : 'translateX(-50%)',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '6px 14px',
        borderRadius: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 10005,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        color: 'white',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* 拖曳圖示握把 */}
      <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.4)', paddingRight: '2px' }} title="按住可拖曳位置">
        <GripVertical size={16} />
      </div>

      {/* 內部工具項目 */}
      <div 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
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
                flexShrink: 0,
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
                flexShrink: 0,
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
            width: '24px',
            height: '28px',
            background: 'none',
            border: 'none',
            color: paths.length === 0 ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
            cursor: paths.length === 0 ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          <Undo2 size={15} />
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
            width: '24px',
            height: '28px',
            background: 'none',
            border: 'none',
            color: paths.length === 0 ? 'rgba(255, 255, 255, 0.3)' : '#f87171',
            cursor: paths.length === 0 ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  ) : null

  return (
    <>
      {mounted && toolbarContent && createPortal(toolbarContent, document.body)}

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
