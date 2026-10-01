'use client'

import Link from 'next/link'
import { Sheet } from '@/types' // 📌 匯入統一型態

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
  const pageCount = sheet.image_urls?.length || 1
  const coverImage = (sheet.image_urls && sheet.image_urls.length > 0) ? sheet.image_urls[0] : sheet.file_url

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--card-bg)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', cursor: 'pointer', backgroundColor: 'var(--border-color)', overflow: 'hidden' }} onClick={() => onOpenModal(sheet)}>
        <img src={coverImage} alt={sheet.title} style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>📄 {pageCount} 頁</div>
        <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: sheet.tempo === 'slow' ? 'rgba(16, 185, 129, 0.9)' : sheet.tempo === 'fast' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(107, 114, 128, 0.9)', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
          {sheet.tempo === 'slow' ? '🌙 慢歌' : sheet.tempo === 'fast' ? '⚡ 快歌' : '❓ 未分類'}
        </div>
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>點擊放大</div>
      </div>

      <div style={{ padding: '14px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', lineHeight: '1.3', color: 'var(--text-primary)' }}>{sheet.title}</h3>
          <div style={{ display: 'inline-block', backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>🎵 調性：{sheet.artist || '未指定'}</div>
        </div>

        <button
          onClick={() => onAddToSetlist(sheet)}
          style={{ marginTop: '12px', width: '100%', padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: isInSetlist ? '#e9d5ff' : '#8b5cf6', color: isInSetlist ? '#6b21a8' : 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
        >
          {isInSetlist ? '✓ 已在歌單中' : '➕ 加至歌單'}
        </button>

        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/edit/${sheet.id}`} style={{ fontSize: '13px', color: '#0070f3', textDecoration: 'none', fontWeight: '600' }}>編輯</Link>
          <button onClick={() => onDelete(sheet.id, sheet.title)} style={{ fontSize: '13px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' }}>刪除</button>
        </div>
      </div>
    </div>
  )
}