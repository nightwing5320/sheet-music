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
      /* 📌 使用與整體風格搭調的淡紫底色 */
      backgroundColor: 'var(--setlist-bg, #f3e8ff)', 
      border: '1px solid var(--setlist-border, #d8b4fe)',
      borderRadius: '16px', 
      padding: '20px', 
      marginBottom: '24px', 
      boxShadow: '0 4px 16px rgba(168, 85, 247, 0.08)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--setlist-title, #581c87)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📋 今日敬拜歌單 ({setlist.length})
        </h2>
        {setlist.length > 0 && (
          <button
            onClick={onClearSetlist}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '8px', 
              border: 'none', 
              backgroundColor: '#ef4444', 
              color: 'white', 
              cursor: 'pointer', 
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            一鍵清空
          </button>
        )}
      </div>

      {setlist.length === 0 ? (
        <p style={{ color: 'var(--setlist-empty, #7e22ce)', fontSize: '14px', margin: 0 }}>歌單目前是空的，請從下方樂譜庫新增。</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {setlist.map((sheet, index) => (
            <div 
              key={`${sheet.id}-${index}`} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '10px 14px', 
                backgroundColor: 'var(--setlist-item-bg, #ffffff)', 
                borderRadius: '10px',
                border: '1px solid var(--setlist-item-border, #e9d5ff)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#7c3aed', fontSize: '14px' }}>{index + 1}.</span>
                
                {editingId === sheet.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      border: '1px solid #7c3aed', 
                      backgroundColor: 'var(--card-bg, #ffffff)',
                      color: 'var(--text-primary, #0f172a)',
                      fontSize: '14px', 
                      width: '100%', 
                      maxWidth: '220px' 
                    }}
                    autoFocus
                  />
                ) : (
                  <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary, #1e293b)' }}>{sheet.title}</span>
                )}
              </div>

              {/* 右側按鈕區 */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {onUpdateSheetTitle && (
                  editingId === sheet.id ? (
                    <button
                      onClick={() => handleSaveEdit(sheet.id)}
                      style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                    >
                      儲存
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(sheet)}
                      style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                    >
                      ✏️ 編輯
                    </button>
                  )
                )}

                <button
                  onClick={() => onMoveTrack(index, 'up')}
                  disabled={index === 0}
                  style={{ 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color, #e2e8f0)', 
                    backgroundColor: 'var(--btn-bg, #f1f5f9)',
                    color: 'var(--text-primary, #334155)',
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
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color, #e2e8f0)', 
                    backgroundColor: 'var(--btn-bg, #f1f5f9)',
                    color: 'var(--text-primary, #334155)',
                    cursor: index === setlist.length - 1 ? 'not-allowed' : 'pointer', 
                    opacity: index === setlist.length - 1 ? 0.3 : 1 
                  }}
                >
                  ▼
                </button>

                <button
                  onClick={() => onRemoveTrack(sheet.id)}
                  style={{ 
                    padding: '5px 10px', 
                    borderRadius: '6px', 
                    border: 'none', 
                    backgroundColor: '#ef4444', 
                    color: 'white', 
                    cursor: 'pointer', 
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  🗑️ 刪除
                </button>

                {/* 灰色放大按鈕 */}
                <button
                  onClick={() => onOpenModal(sheet, index)}
                  style={{ 
                    padding: '5px 10px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color, #cbd5e1)', 
                    backgroundColor: 'var(--btn-bg, #e2e8f0)',
                    color: 'var(--text-primary, #334155)', 
                    cursor: 'pointer', 
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
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