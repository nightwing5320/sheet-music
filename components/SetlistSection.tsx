'use client'

import { Sheet } from '@/types' // 📌 匯入統一型態

/*
interface Sheet {
  id: number
  title: string
  artist: string | null
  tempo?: string | null
  file_url: string
  image_urls?: string[] | null
  created_at?: string
}
*/

interface SetlistSectionProps {
  setlist: Sheet[]
  onOpenModal: (sheet: Sheet, index: number) => void
  onMoveTrack: (index: number, direction: 'up' | 'down') => void
  onRemoveTrack: (id: number) => void
  onClearSetlist: () => void
}

export function SetlistSection({
  setlist,
  onOpenModal,
  onMoveTrack,
  onRemoveTrack,
  onClearSetlist,
}: SetlistSectionProps) {
  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      border: '2px solid #8b5cf6',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '28px',
      boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📋 今日敬拜歌單 ({setlist.length} 首)
        </h2>
        {setlist.length > 0 && (
          <button
            onClick={onClearSetlist}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            🗑️ 清除歌單
          </button>
        )}
      </div>

      {setlist.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, textAlign: 'center', padding: '16px 0' }}>
          歌單目前是空的！在下方樂譜卡片點擊「➕ 加至歌單」即可開始編排。
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {setlist.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'var(--input-bg)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: '800', fontSize: '15px', color: '#8b5cf6', width: '24px' }}>
                  #{index + 1}
                </span>
                <div>
                  <span style={{ fontWeight: '700', fontSize: '15px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onOpenModal(item, index)}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                    🎵 Key: {item.artist || '未指定'} | {item.tempo === 'fast' ? '⚡快歌' : item.tempo === 'slow' ? '🌙慢歌' : '❓未分類'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => onOpenModal(item, index)}
                  style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                >
                  ▶ 開始播放
                </button>
                <button
                  disabled={index === 0}
                  onClick={() => onMoveTrack(index, 'up')}
                  style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}
                  title="向上移"
                >
                  ▲
                </button>
                <button
                  disabled={index === setlist.length - 1}
                  onClick={() => onMoveTrack(index, 'down')}
                  style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: index === setlist.length - 1 ? 'not-allowed' : 'pointer', opacity: index === setlist.length - 1 ? 0.3 : 1 }}
                  title="向下移"
                >
                  ▼
                </button>
                <button
                  onClick={() => onRemoveTrack(item.id)}
                  style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                  title="移出歌單"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}