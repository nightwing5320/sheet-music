'use client'

import React, { useEffect, useLayoutEffect, useState, useRef, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Sheet } from '@/types'
import { useHydrated } from '@/utils/useHydrated'
import { Undo2, Trash2, GripVertical } from 'lucide-react'

export interface PathData {
  id: string
  d: string
  color: string
  strokeWidth: number
  // 'image'：座標相對於樂譜圖片（換裝置、轉向都不會跑掉）。
  // 舊筆記沒有此欄位，座標相對於整個檢視區，維持原本的顯示方式
  space?: 'image'
}

// 圖片在外框中的位置與大小（版面座標，不受縮放影響）
interface ImageBox {
  left: number
  top: number
  width: number
  height: number
}

const round = (value: number) => Math.round(value * 10) / 10

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
  const toolbarRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 })

  // 塗鴉繪圖狀態
  const [color, setColor] = useState('#ef4444')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [imageBox, setImageBox] = useState<ImageBox | null>(null)

  // 書寫中的筆畫直接更新 DOM，不經過 React 重新渲染，寫快也跟得上
  const livePathRef = useRef<SVGPathElement>(null)
  const strokeRef = useRef<{ pointerId: number; d: string } | null>(null)

  // 量出圖片的位置，讓筆記圖層剛好蓋在圖片上（圖片載入、換頁、視窗大小改變時重新計算）
  useEffect(() => {
    const wrapper = wrapperRef.current
    const img = wrapper?.querySelector('img')
    if (!wrapper || !img) return

    const measure = () => {
      if (!img.offsetWidth || !img.offsetHeight) return
      setImageBox({ left: img.offsetLeft, top: img.offsetTop, width: img.offsetWidth, height: img.offsetHeight })
    }

    const observer = new ResizeObserver(measure)
    observer.observe(img)
    observer.observe(wrapper)
    img.addEventListener('load', measure)
    return () => {
      observer.disconnect()
      img.removeEventListener('load', measure)
    }
  }, [])

  // 筆畫存進 paths 後，清掉書寫中的暫時筆畫
  useLayoutEffect(() => {
    if (!strokeRef.current) livePathRef.current?.setAttribute('d', '')
  }, [paths])

  const mounted = useHydrated()

  // 滑鼠 / 觸控 拖曳開始
  const handleStartDrag = (clientX: number, clientY: number) => {
    const rect = toolbarRef.current?.getBoundingClientRect()

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      initialX: rect?.left ?? 0,
      initialY: rect?.top ?? 0,
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

  // 塗鴉繪圖事件（只接受觸控筆與滑鼠，手指留給縮放與翻頁）
  const isPencilOrMouse = (e: React.PointerEvent) => e.pointerType === 'pen' || e.pointerType === 'mouse'

  const toPoint = (rect: DOMRect, clientX: number, clientY: number) =>
    `${round(((clientX - rect.left) / rect.width) * 1000)} ${round(((clientY - rect.top) / rect.height) * 1000)}`

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isEditing || !isPencilOrMouse(e) || !svgRef.current) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)

    const point = toPoint(svgRef.current.getBoundingClientRect(), e.clientX, e.clientY)
    strokeRef.current = { pointerId: e.pointerId, d: `M ${point} L ${point}` }
    livePathRef.current?.setAttribute('d', strokeRef.current.d)
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const stroke = strokeRef.current
    if (!stroke || stroke.pointerId !== e.pointerId || !svgRef.current) return

    // 瀏覽器會把快速移動的多個點合併成一個事件，取出全部的點，線條才不會斷成直線
    const native = e.nativeEvent
    const events = native.getCoalescedEvents?.() ?? []
    const rect = svgRef.current.getBoundingClientRect()
    for (const point of events.length > 0 ? events : [native]) {
      stroke.d += ` L ${toPoint(rect, point.clientX, point.clientY)}`
    }
    livePathRef.current?.setAttribute('d', stroke.d)
  }

  const handlePointerEnd = (e: React.PointerEvent<SVGSVGElement>) => {
    const stroke = strokeRef.current
    if (!stroke || stroke.pointerId !== e.pointerId) return
    strokeRef.current = null

    onChangePaths([
      ...paths,
      { id: Date.now().toString(), d: stroke.d, color, strokeWidth, space: 'image' },
    ])
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
      ref={toolbarRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed top-4 h-[38px] bg-[rgba(15,23,42,0.92)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.2)] px-3.5 rounded-[30px] flex items-center gap-2.5 z-[10005] shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white cursor-grab select-none touch-none box-border"
      style={{
        // 工具列可拖曳，位置為即時計算值；預設與「筆記」按鈕同高
        left: toolbarPos ? `${toolbarPos.x}px` : '50%',
        top: toolbarPos ? `${toolbarPos.y}px` : undefined,
        transform: toolbarPos ? 'none' : 'translateX(-50%)',
      }}
    >
      {/* 拖曳圖示握把 */}
      <div className="flex items-center text-[rgba(255,255,255,0.4)] pr-0.5" title="按住可拖曳位置">
        <GripVertical size={16} />
      </div>

      {/* 內部工具項目 */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="flex items-center gap-2.5"
      >
        {/* 顏色選擇器 */}
        <div className="flex gap-1.5 items-center shrink-0">
          {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#000000', '#ffffff'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full cursor-pointer transition-all duration-200 shrink-0 ${
                color === c ? 'border-2 border-white scale-120' : 'border border-[rgba(255,255,255,0.39)]'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-3.5 bg-[rgba(255,255,255,0.2)] shrink-0" />

        {/* 筆劃粗細選擇器 */}
        <div className="flex gap-0.5 items-center shrink-0">
          {[{ label: '細', value: 2 }, { label: '中', value: 4 }, { label: '粗', value: 8 }].map((sw) => (
            <button
              key={sw.value}
              onClick={() => setStrokeWidth(sw.value)}
              className={`px-1.5 py-0.5 rounded-[6px] text-[12px] font-semibold border-none cursor-pointer shrink-0 ${
                strokeWidth === sw.value ? 'bg-[rgba(255,255,255,0.25)] text-white' : 'bg-transparent text-[rgba(255,255,255,0.6)]'
              }`}
            >
              {sw.label}
            </button>
          ))}
        </div>

        <div className="w-px h-3.5 bg-[rgba(255,255,255,0.2)] shrink-0" />

        {/* 復原按鈕 */}
        <button
          onClick={handleUndo}
          disabled={paths.length === 0}
          title="復原上一步"
          className="inline-flex items-center justify-center w-6 h-7 bg-transparent border-none text-white cursor-pointer shrink-0 disabled:text-[rgba(255,255,255,0.3)] disabled:cursor-not-allowed"
        >
          <Undo2 size={15} />
        </button>

        {/* 清空按鈕 */}
        <button
          onClick={handleClearAll}
          disabled={paths.length === 0}
          title="清空所有筆記"
          className="inline-flex items-center justify-center w-6 h-7 bg-transparent border-none text-[#f87171] cursor-pointer shrink-0 disabled:text-[rgba(255,255,255,0.3)] disabled:cursor-not-allowed"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  ) : null

  return (
    <>
      {mounted && toolbarContent && createPortal(toolbarContent, document.body)}

      <div ref={wrapperRef} className="relative inline-block max-w-full max-h-full w-full h-full">
        {children}

        {/* 舊筆記：座標相對於整個檢視區 */}
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {paths
            .filter((p) => p.space !== 'image')
            .map((p) => (
              <path key={p.id} d={p.d} stroke={p.color} strokeWidth={p.strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
        </svg>

        {/* 筆記圖層：剛好蓋在圖片上（位置為量測值，需用 inline style） */}
        {imageBox && (
          <svg
            ref={svgRef}
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className={`absolute touch-none ${
              isEditing ? 'cursor-crosshair [pointer-events:all]' : 'cursor-default pointer-events-none'
            }`}
            style={{ left: imageBox.left, top: imageBox.top, width: imageBox.width, height: imageBox.height }}
          >
            {paths
              .filter((p) => p.space === 'image')
              .map((p) => (
                <path key={p.id} d={p.d} stroke={p.color} strokeWidth={p.strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            <path ref={livePathRef} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </>
  )
}
