'use client'

import { useRef, useState } from 'react'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'

interface SheetAnnotatorProps {
  imageUrl: string
  onSave: (savedDataJson: string) => void
  onClose: () => void
}

export function SheetAnnotator({ imageUrl, onSave, onClose }: SheetAnnotatorProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null)

  // 筆刷與顏色設定
  const [strokeColor, setStrokeColor] = useState('#ff2a2a') // 預設紅色
  const [strokeWidth, setStrokeWidth] = useState(3) // 預設粗細
  const [isHighlighter, setIsHighlighter] = useState(false) // 是否為螢光筆

  // 1. 復原上一筆 (Undo)
  const handleUndo = () => {
    canvasRef.current?.undo()
  }

  // 2. 清空所有筆跡 (Clear)
  const handleClear = () => {
    canvasRef.current?.clearCanvas()
  }

  // 3. 儲存筆跡 (Export JSON)
  const handleSave = async () => {
    if (canvasRef.current) {
      // 取得所有繪圖路徑資料 (Export Paths)
      const paths = await canvasRef.current.exportPaths()
      const saveDataJson = JSON.stringify(paths)
      onSave(saveDataJson)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px'
    }}>
      {/* 🔝 上方工具列 (Google Photos 塗鴉風格) */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '16px',
        backgroundColor: '#1f2937',
        padding: '10px 20px',
        borderRadius: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* 顏色選擇 */}
        <button onClick={() => { setStrokeColor('#ff2a2a'); setIsHighlighter(false) }} style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#ff2a2a', border: !isHighlighter && strokeColor === '#ff2a2a' ? '2px solid white' : 'none', cursor: 'pointer' }} />
        <button onClick={() => { setStrokeColor('#2563eb'); setIsHighlighter(false) }} style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#2563eb', border: !isHighlighter && strokeColor === '#2563eb' ? '2px solid white' : 'none', cursor: 'pointer' }} />
        <button onClick={() => { setStrokeColor('rgba(250, 204, 21, 0.4)'); setIsHighlighter(true) }} style={{ padding: '4px 8px', borderRadius: '12px', backgroundColor: '#facc15', color: '#000', fontSize: '12px', fontWeight: 'bold', border: isHighlighter ? '2px solid white' : 'none', cursor: 'pointer' }}>
          🖍️ 螢光筆
        </button>

        <div style={{ width: 1, height: 20, backgroundColor: '#4b5563', margin: '0 4px' }} />

        {/* 筆刷粗細 */}
        <button onClick={() => setStrokeWidth(2)} style={{ color: 'white', background: strokeWidth === 2 ? '#374151' : 'transparent', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>細</button>
        <button onClick={() => setStrokeWidth(6)} style={{ color: 'white', background: strokeWidth === 6 ? '#374151' : 'transparent', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>粗</button>

        <div style={{ width: 1, height: 20, backgroundColor: '#4b5563', margin: '0 4px' }} />

        {/* 復原與清空 */}
        <button onClick={handleUndo} style={{ color: 'white', background: 'transparent', border: 'none', cursor: 'pointer' }}>↩️ 復原</button>
        <button onClick={handleClear} style={{ color: 'white', background: 'transparent', border: 'none', cursor: 'pointer' }}>🗑️ 清空</button>

        <div style={{ width: 1, height: 20, backgroundColor: '#4b5563', margin: '0 4px' }} />

        {/* 儲存與關閉 */}
        <button onClick={handleSave} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>💾 儲存</button>
        <button onClick={onClose} style={{ color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}>❌ 關閉</button>
      </div>

      {/* 🖼️ 中央樂譜畫布區塊 */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '800px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ReactSketchCanvas
          ref={canvasRef}
          backgroundImage={imageUrl} // 背景圖片 (代替 imgSrc)
          strokeWidth={isHighlighter ? 12 : strokeWidth} // 代替 brushRadius
          strokeColor={isHighlighter ? 'rgba(250, 204, 21, 0.4)' : strokeColor} // 代替 brushColor
          canvasColor="transparent"
          style={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}