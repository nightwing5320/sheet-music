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
    <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>📋 今日敬拜歌單 ({setlist.length})</h2>
        {setlist.length > 0 && (
          <button
            onClick={onClearSetlist}
            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '13px' }}
          >
            一鍵清空
          </button>
        )}
      </div>

      {setlist.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>歌單目前是空的，請從樂譜庫新增。</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {setlist.map((sheet, index) => (
            <div key={`${sheet.id}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              
              {/* 歌曲資訊 / 編輯輸入框 */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
                <span style={{ fontWeight: 'bold' }}>{index + 1}.</span>
                
                {editingId === sheet.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #0070f3', fontSize: '14px', width: '100%', maxWidth: '200px' }}
                    autoFocus
                  />
                ) : (
                  <span style={{ fontWeight: '500' }}>{sheet.title}</span>
                )}
              </div>

              {/* 右側按鈕區：編輯 / 排序 / 刪除 / 右下角放大提示 */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {editingId === sheet.id ? (
                  <button
                    onClick={() => handleSaveEdit(sheet.id)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#10b981', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                  >
                    儲存
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartEdit(sheet)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ✏️ 編輯
                  </button>
                )}

                <button
                  onClick={() => onMoveTrack(index, 'up')}
                  disabled={index === 0}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.4 : 1 }}
                >
                  ▲
                </button>
                <button
                  onClick={() => onMoveTrack(index, 'down')}
                  disabled={index === setlist.length - 1}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: index === setlist.length - 1 ? 'not-allowed' : 'pointer', opacity: index === setlist.length - 1 ? 0.4 : 1 }}
                >
                  ▼
                </button>

                <button
                  onClick={() => onRemoveTrack(sheet.id)}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                >
                  🗑️ 刪除
                </button>

                {/* 點擊全螢幕放大 */}
                <button
                  onClick={() => onOpenModal(sheet, index)}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#8b5cf6', color: 'white', cursor: 'pointer', fontSize: '12px' }}
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