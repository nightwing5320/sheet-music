'use client'

import { useState } from 'react'
import { Sheet } from '@/types'

interface SetlistSectionProps {
  setlist: Sheet[]
  onOpenModal: (sheet: Sheet, setlistIdx?: number | null) => void
  onMoveTrack: (index: number, direction: 'up' | 'down') => void
  onRemoveTrack: (id: number) => void
  onClearSetlist: () => void
  onUpdateSheetTitle?: (id: number, newTitle: string) => void
}

export function SetlistSection({
  setlist,
  onOpenModal,
  onMoveTrack,
  onRemoveTrack,
  onClearSetlist,
  onUpdateSheetTitle,
}: SetlistSectionProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const handleStartEdit = (sheet: Sheet) => {
    setEditingId(sheet.id)
    setEditTitle(sheet.title)
  }

  const handleSaveEdit = (id: number) => {
    if (onUpdateSheetTitle && editTitle.trim()) {
      onUpdateSheetTitle(id, editTitle.trim())
    }
    setEditingId(null)
  }

  return (
    <div style={{ 
      /* 📌 紫色底色與邊框 */
      backgroundColor: '#2e1065', 
      border: '1px solid #6d28d9',
      borderRadius: '16px', 
      padding: '20px', 
      marginBottom: '24px', 
      boxShadow: '0 10px 25px -5px rgba(109, 40, 217, 0.3)',
      color: '#ffffff'
    }}>
      {/* 標題與一鍵清空 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#f3e8ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📋 今日敬拜歌單 ({setlist.length})
        </h2>
        {setlist.length > 0 && (
          <button
            onClick={onClearSetlist}
            style={{ 
              padding: '6px 14px', 
              borderRadius: '8px', 
              border: 'none', 
              backgroundColor: '#ef4444', 
              color: 'white', 
              cursor: 'pointer', 
              fontSize: '13px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
            }}
          >
            一鍵清空
          </button>
        )}
      </div>

      {setlist.length === 0 ? (
        <p style={{ color: '#c084fc', fontSize: '14px', margin: 0 }}>歌單目前是空的，請從下方樂譜庫新增。</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {setlist.map((sheet, index) => (
            <div 
              key={`${sheet.id}-${index}`} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '12px 16px', 
                backgroundColor: 'rgba(15, 23, 42, 0.4)', 
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              
              {/* 歌曲資訊 / 編輯輸入框 */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#a7f3d0' }}>{index + 1}.</span>
                
                {editingId === sheet.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      border: '1px solid #a855f7', 
                      backgroundColor: '#1e1b4b',
                      color: 'white',
                      fontSize: '14px', 
                      width: '100%', 
                      maxWidth: '220px' 
                    }}
                    autoFocus
                  />
                ) : (
                  <span style={{ fontWeight: '500', fontSize: '16px', color: '#f8fafc' }}>{sheet.title}</span>
                )}
              </div>

              {/* 右側按鈕區 */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {onUpdateSheetTitle && (
                  editingId === sheet.id ? (
                    <button
                      onClick={() => handleSaveEdit(sheet.id)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                    >
                      儲存
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(sheet)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                    >
                      ✏️ 編輯
                    </button>
                  )
                )}

                {/* 排序按鈕 */}
                <button
                  onClick={() => onMoveTrack(index, 'up')}
                  disabled={index === 0}
                  style={{ 
                    padding: '6px 10px', 
                    borderRadius: '6px', 
                    border: 'none', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    cursor: index === 0 ? 'not-allowed' : 'pointer', 
                    opacity: index === 0 ? 0.3 : 1 
                  }}
                >
                  ▲
                </button>
                <button
                  onClick={() => onMoveTrack(index, 'down')}
                  disabled={index === setlist.length - 1}
                  style={{ 
                    padding: '6px 10px', 
                    borderRadius: '6px', 
                    border: 'none', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    cursor: index === setlist.length - 1 ? 'not-allowed' : 'pointer', 
                    opacity: index === setlist.length - 1 ? 0.4 : 1 
                  }}
                >
                  ▼
                </button>

                {/* 刪除按鈕 */}
                <button
                  onClick={() => onRemoveTrack(sheet.id)}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    backgroundColor: '#ef4444', 
                    color: 'white', 
                    cursor: 'pointer', 
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  🗑️ 刪除
                </button>

                {/* 📌 放大按鈕 (改為質感深灰色底) */}
                <button
                  onClick={() => onOpenModal(sheet, index)}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    backgroundColor: '#334155', // 深灰色背景
                    color: '#f8fafc', 
                    cursor: 'pointer', 
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                >
                  🔍 放大
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}