'use client'

import { useState } from 'react'
import { Sheet } from '@/types'
import { SheetAnnotator } from './SheetAnnotator'

interface SetlistSectionProps {
  setlist: Sheet[]
  onOpenModal: (sheet: Sheet, setlistIdx?: number | null) => void
  onMoveTrack: (index: number, direction: 'up' | 'down') => void
  onRemoveTrack: (id: number) => void
  onClearSetlist: () => void
  onUpdateSetlist?: (newSetlist: Sheet[]) => void
}

export function SetlistSection({
  setlist,
  onOpenModal,
  onMoveTrack,
  onRemoveTrack,
  onClearSetlist,
  onUpdateSetlist,
}: SetlistSectionProps) {
  // 紀錄當前正在繪製筆記的歌曲 index
  const [editingSheetIndex, setEditingSheetIndex] = useState<number | null>(null)

  // 儲存塗鴉筆記
  const handleSaveAnnotation = (savedDataJson: string) => {
    if (editingSheetIndex === null) return

    const updatedSetlist = [...setlist]
    updatedSetlist[editingSheetIndex] = {
      ...updatedSetlist[editingSheetIndex],
      annotation: savedDataJson
    }

    if (onUpdateSetlist) {
      onUpdateSetlist(updatedSetlist)
    }
    localStorage.setItem('worship_setlist', JSON.stringify(updatedSetlist))
    alert('今日歌單筆記已儲存！')
    setEditingSheetIndex(null)
  }

  const activeSheet = editingSheetIndex !== null ? setlist[editingSheetIndex] : null
  const activeImageUrl = activeSheet?.image_urls?.[0] || activeSheet?.file_url

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
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>歌單目前是空的，請從下方樂譜庫新增。</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {setlist.map((sheet, index) => (
            <div key={`${sheet.id}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              
              {/* 點擊標題開啟全螢幕檢視器 */}
              <div onClick={() => onOpenModal(sheet, index)} style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{index + 1}.</span>
                <span>{sheet.title}</span>
                {sheet.annotation && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                    ✏️ 已附筆記
                  </span>
                )}
              </div>

              {/* 右側操作按鈕 */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {/* 筆記按鈕 */}
                <button
                  onClick={() => setEditingSheetIndex(index)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', cursor: 'pointer', fontSize: '13px' }}
                  title="畫塗鴉筆記"
                >
                  ✏️ 筆記
                </button>

                {/* 順序調整按鈕 */}
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

                {/* 移除歌曲按鈕 */}
                <button
                  onClick={() => onRemoveTrack(sheet.id)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '13px', marginLeft: '4px' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 塗鴉畫布 Modal */}
      {editingSheetIndex !== null && activeImageUrl && (
        <SheetAnnotator
          imageUrl={activeImageUrl}
          initialData={activeSheet?.annotation}
          onSave={handleSaveAnnotation}
          onClose={() => setEditingSheetIndex(null)}
        />
      )}
    </div>
  )
}