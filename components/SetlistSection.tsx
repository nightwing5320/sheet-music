'use client'

import React from 'react'
import { Sheet } from '@/types'

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
  if (setlist.length === 0) return null

  return (
    <div
      style={{
        backgroundColor: 'var(--card-bg, #1e293b)',
        border: '1px solid var(--border-color, #334155)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transition: 'background-color 0.2s, border-color 0.2s',
      }}
    >
      {/* 區塊標題列 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--text-primary, #f8fafc)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📋 今日敬拜歌單 ({setlist.length})
        </h2>

        <button
          onClick={onClearSetlist}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          一鍵清空
        </button>
      </div>

      {/* 歌單列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {setlist.map((sheet, index) => (
          <div
            key={sheet.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--input-bg, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '12px',
              padding: '12px 16px',
              gap: '12px',
            }}
          >
            {/* 歌曲名稱與序號 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontWeight: '800',
                  color: '#8b5cf6',
                  fontSize: '15px',
                  flexShrink: 0,
                }}
              >
                {index + 1}.
              </span>
              <span
                style={{
                  fontWeight: '600',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: '15px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {sheet.title}
              </span>
            </div>

            {/* 操作按鈕群組 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* 向上移動 */}
              <button
                onClick={() => onMoveTrack(index, 'up')}
                disabled={index === 0}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #334155)',
                  backgroundColor: 'var(--card-bg, #1e293b)',
                  color: index === 0 ? 'var(--text-secondary, #64748b)' : 'var(--text-primary, #f8fafc)',
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: index === 0 ? 0.4 : 1,
                }}
              >
                ▲
              </button>

              {/* 向下移動 */}
              <button
                onClick={() => onMoveTrack(index, 'down')}
                disabled={index === setlist.length - 1}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #334155)',
                  backgroundColor: 'var(--card-bg, #1e293b)',
                  color: index === setlist.length - 1 ? 'var(--text-secondary, #64748b)' : 'var(--text-primary, #f8fafc)',
                  cursor: index === setlist.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: index === setlist.length - 1 ? 0.4 : 1,
                }}
              >
                ▼
              </button>

              {/* 刪除 */}
              <button
                onClick={() => onRemoveTrack(sheet.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🗑️ 刪除
              </button>

              {/* 放大檢視 */}
              <button
                onClick={() => onOpenModal(sheet, index)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #334155)',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🔍 放大
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}