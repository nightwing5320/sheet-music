'use client'

import { Sheet } from '@/types'

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
  const imageUrl = sheet.image_urls?.[0] || sheet.file_url

  return (
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
      <div onClick={() => onOpenModal(sheet)} style={{ cursor: 'pointer' }}>
        <div style={{ position: 'relative', width: '100%', height: '180px', marginBottom: '12px', overflow: 'hidden', borderRadius: '8px' }}>
          <img src={imageUrl} alt={sheet.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold' }}>{sheet.title}</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Key: {sheet.artist || '未指定'}</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button onClick={() => onOpenModal(sheet)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#0070f3', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
          👁️ 查看
        </button>

        <button onClick={() => onAddToSetlist(sheet)} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', backgroundColor: isInSetlist ? '#10b981' : '#8b5cf6', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
          {isInSetlist ? '✓ 已加入' : '+ 歌單'}
        </button>

        <button onClick={() => onDelete(sheet.id, sheet.title)} style={{ padding: '8px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer' }}>
          🗑️
        </button>
      </div>
    </div>
  )
}