'use client'

import { useState } from 'react'
import { Sheet } from '@/types'
import { SheetAnnotator } from './SheetAnnotator'

interface SetlistSectionProps {
  setlist: Sheet[]
  onUpdateSetlist: (newSetlist: Sheet[]) => void // 📌 傳入更新歌單的函式
  onRemoveFromSetlist: (id: number) => void
  onOpenViewer: (index: number) => void
}

export function SetlistSection({
  setlist,
  onUpdateSetlist,
  onRemoveFromSetlist,
  onOpenViewer,
}: SetlistSectionProps) {
  // 正在編輯筆記的歌單項目
  const [editingSheetIndex, setEditingSheetIndex] = useState<number | null>(null)

  // 儲存筆記至今日歌單
  const handleSaveAnnotation = (savedDataJson: string) => {
    if (editingSheetIndex === null) return

    const updatedSetlist = [...setlist]
    updatedSetlist[editingSheetIndex] = {
      ...updatedSetlist[editingSheetIndex],
      annotation: savedDataJson // 📌 將筆劃 JSON 寫入該首歌曲
    }

    onUpdateSetlist(updatedSetlist) // 更新歌單 State 與 localStorage
    localStorage.setItem('worship_setlist', JSON.stringify(updatedSetlist)) // 寫入快取儲存
    alert('歌單筆記已儲存！')
    setEditingSheetIndex(null)
  }

  const activeSheet = editingSheetIndex !== null ? setlist[editingSheetIndex] : null
  const activeImageUrl = activeSheet?.image_urls?.[0] || activeSheet?.file_url

  return (
    <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
      <h2 style={{ marginTop: 0, fontSize: '20px', fontWeight: 'bold' }}>📋 今日敬拜歌單 ({setlist.length})</h2>

      {setlist.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '14px' }}>歌單目前是空的，請從下方樂譜庫新增。</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {setlist.map((sheet, index) => (
            <div key={`${sheet.id}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div onClick={() => onOpenViewer(index)} style={{ cursor: 'pointer', flex: 1 }}>
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{index + 1}.</span>
                <span>{sheet.title}</span>
                {sheet.annotation && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981' }}> (已附筆記 ✏️)</span>}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {/* 📌 專屬今日歌單的筆記按鈕 */}
                <button
                  onClick={() => setEditingSheetIndex(index)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                >
                  ✏️ 筆記
                </button>

                <button
                  onClick={() => onRemoveFromSetlist(sheet.id)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📌 開啟筆記畫布，並帶入之前的筆記 */}
      {editingSheetIndex !== null && activeImageUrl && (
        <SheetAnnotator
          imageUrl={activeImageUrl}
          initialData={activeSheet?.annotation} // 帶入舊筆跡
          onSave={handleSaveAnnotation}
          onClose={() => setEditingSheetIndex(null)}
        />
      )}
    </div>
  )
}