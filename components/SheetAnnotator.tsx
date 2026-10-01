'use client'

import { useRef, useEffect, useState } from 'react'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'

interface SheetAnnotatorProps {
  imageUrl: string
  initialData?: string // 📌 新增：接收舊筆畫資料
  onSave: (savedDataJson: string) => void
  onClose: () => void
}

export function SheetAnnotator({ imageUrl, initialData, onSave, onClose }: SheetAnnotatorProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const [strokeColor, setStrokeColor] = useState('#ff2a2a')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [isHighlighter, setIsHighlighter] = useState(false)

  // 📌 畫布準備好後，自動載入先前的筆記
  useEffect(() => {
    if (initialData && canvasRef.current) {
      try {
        const paths = JSON.parse(initialData)
        canvasRef.current.loadPaths(paths)
      } catch (e) {
        console.error('載入筆跡失敗:', e)
      }
    }
  }, [initialData])

  const handleSave = async () => {
    if (canvasRef.current) {
      const paths = await canvasRef.current.exportPaths()
      const saveDataJson = JSON.stringify(paths)
      onSave(saveDataJson)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', backgroundColor: '#1f2937', padding: '10px 20px', borderRadius: '30px' }}>
        <button onClick={() => { setStrokeColor('#ff2a2a'); setIsHighlighter(false) }} style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#ff2a2a', border: 'none', cursor: 'pointer' }} />
        <button onClick={() => { setStrokeColor('#2563eb'); setIsHighlighter(false) }} style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#2563eb', border: 'none', cursor: 'pointer' }} />
        <button onClick={() => { setStrokeColor('rgba(250, 204, 21, 0.4)'); setIsHighlighter(true) }} style={{ padding: '4px 8px', borderRadius: '12px', backgroundColor: '#facc15', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🖍️ 螢光筆</button>
        <button onClick={() => canvasRef.current?.undo()} style={{ color: 'white', background: 'transparent', border: 'none', cursor: 'pointer' }}>↩️ 復原</button>
        <button onClick={() => canvasRef.current?.clearCanvas()} style={{ color: 'white', background: 'transparent', border: 'none', cursor: 'pointer' }}>🗑️️ 清空</button>
        <button onClick={handleSave} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>💾 儲存</button>
        <button onClick={onClose} style={{ color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}>❌ 關閉</button>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '800px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ReactSketchCanvas
          ref={canvasRef}
          backgroundImage={imageUrl}
          strokeWidth={isHighlighter ? 12 : strokeWidth}
          strokeColor={isHighlighter ? 'rgba(250, 204, 21, 0.4)' : strokeColor}
          canvasColor="transparent"
          style={{ border: 'none', borderRadius: '8px', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}