'use client'

import { Sheet } from '@/types'
import Link from 'next/link'

interface SheetCardProps {
  sheet: Sheet
  isInSetlist: boolean
  onToggleSetlist: (sheet: Sheet) => void
  onOpenModal: (sheet: Sheet) => void
  onDeleteSheet?: (id: number, title: string) => void
}

export function SheetCard({
  sheet,
  isInSetlist,
  onToggleSetlist,
  onOpenModal,
  onDeleteSheet,
}: SheetCardProps) {
  const imageUrl = sheet.image_urls?.[0] || sheet.file_url

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--card-bg)', display: 'flex', flexDirection: 'column' }}>
      
      {/* 樂譜圖片容器 (右下角放放大按鈕) */}
      <div 
        style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f3f4f6', cursor: 'pointer' }}
        onClick={() => onOpenModal(sheet)}
      >
        <img 
          src={imageUrl} 
          alt={sheet.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* 📌 圖片右下角：放大按鈕 */}
        <button
          onClick={(e) => {
            e.stopPropagation() // 避免與容器點擊重疊
            onOpenModal(sheet)
          }}
          title="全螢幕放大"
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          🔍
        </button>
      </div>

      {/* 下方標題與操作區 */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{sheet.title}</h3>
            {sheet.artist && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{sheet.artist}</p>}
          </div>

          {/* 📌 跳轉至獨立編輯頁面 /edit/[id] */}
          <Link 
            href={`/edit/${sheet.id}`} 
            style={{ 
              fontSize: '13px', 
              color: 'white', 
              textDecoration: 'none', 
              padding: '6px 10px', 
              borderRadius: '6px',
              border: '1px solid #0070f3', 
              backgroundColor: '#0070f3',
            }}
          >
            ✏️ 編輯
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {/* 加入 / 移除歌單 */}
          <button
            onClick={() => onToggleSetlist(sheet)}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isInSetlist ? '#26c944' : '#8b5cf6',
              color: 'white',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {isInSetlist ? '已加入' : '+ 加入歌單'}
          </button>

          {/* 刪除樂譜 */}
          {onDeleteSheet && (
            <button
              onClick={() => onDeleteSheet(sheet.id, sheet.title)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #ef4444',
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🗑️刪除
            </button>
          )}
        </div>
      </div>
    </div>
  )
}