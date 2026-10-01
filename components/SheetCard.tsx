'use client'

import { useState } from 'react'
import { Sheet } from '@/types'
import { SheetAnnotator } from './SheetAnnotator' // 📌 1. 匯入塗鴉元件

interface SheetCardProps {
  sheet: Sheet
  isInSetlist: boolean
  onOpenModal: (sheet: Sheet, index?: number | null) => void
  onAddToSetlist: (sheet: Sheet) => void
  onDelete: (id: number, title: string) => void
}

export function SheetCard({
  sheet,
  isInSetlist,
  onOpenModal,
  onAddToSetlist,
  onDelete,
}: SheetCardProps) {
  // 📌 2. 新增 State 控制是否開啟塗鴉畫布
  const [isAnnotating, setIsAnnotating] = useState(false)

  // 取得封面或第一張樂譜圖片
  const imageUrl = sheet.image_urls?.[0] || sheet.file_url

  // 儲存塗鴉處理
  const handleSaveAnnotation = async (savedDataJson: string) => {
    try {
      console.log(`樂譜 ID ${sheet.id} 的塗鴉資料：`, savedDataJson)
      // 這裡未來可以呼叫 Supabase 將 savedDataJson 存回 sheets 資料表
      alert('筆記儲存成功！')
      setIsAnnotating(false)
    } catch (err) {
      alert('儲存失敗！')
    }
  }

  return (
    <>
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: 'var(--card-bg)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        {/* 卡片頂部資訊與縮圖區 */}
        <div onClick={() => onOpenModal(sheet)} style={{ cursor: 'pointer' }}>
          <div style={{ position: 'relative', width: '100%', height: '180px', marginBottom: '12px', overflow: 'hidden', borderRadius: '8px' }}>
            <img
              src={imageUrl}
              alt={sheet.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold' }}>
            {sheet.title}
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            Key: {sheet.artist || '未指定'}
          </p>
        </div>

        {/* 📌 卡片底部操作按鈕區 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
          {/* 原本的播放/查看按鈕 */}
          <button
            onClick={() => onOpenModal(sheet)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#0070f3',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            👁️ 查看
          </button>

          {/* 📌 3. 新增塗鴉筆記按鈕 */}
          <button
            onClick={() => setIsAnnotating(true)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="劃線筆記"
          >
            ✏️ 筆記
          </button>

          {/* 原本的新增至歌單按鈕 */}
          <button
            onClick={() => onAddToSetlist(sheet)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isInSetlist ? '#10b981' : '#8b5cf6',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isInSetlist ? '✓ 已加入' : '+ 歌單'}
          </button>

          {/* 原本的刪除按鈕 */}
          <button
            onClick={() => onDelete(sheet.id, sheet.title)}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#ef4444',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* 📌 4. 當 isAnnotating 為 true 時，顯示全螢幕塗鴉 Modal */}
      {isAnnotating && (
        <SheetAnnotator
          imageUrl={imageUrl}
          onSave={handleSaveAnnotation}
          onClose={() => setIsAnnotating(false)}
        />
      )}
    </>
  )
}