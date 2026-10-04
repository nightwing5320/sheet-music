'use client'

import React from 'react'
import { Sheet } from '@/types'
import { ListMusic, Trash2, Maximize2, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react'

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
    <div style={{
      borderRadius: '16px',
      backgroundColor: 'var(--card-bg, #ffffff)',
      border: '1px solid var(--border-color, #e2e8f0)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      padding: '24px',
      marginBottom: '32px',
      transition: 'all 0.2s ease',
    }}>
      {/* 標題與清空按鈕 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListMusic size={22} style={{ color: 'var(--text-primary, #0f172a)' }} />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--text-primary, #0f172a)' }}>
            今日敬拜歌單 ({setlist.length})
          </h2>
        </div>

        {/* 一鍵清空按鈕 (Ghost 質感風格) */}
        <button
          onClick={onClearSetlist}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '34px',
            padding: '0 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            color: 'var(--text-secondary, #64748b)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color, #e2e8f0)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary, #64748b)'
            e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <RotateCcw size={14} />
          <span>一鍵清空</span>
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
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-secondary, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              transition: 'all 0.2s ease',
            }}
          >
            {/* 左側：序號與歌名 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: '15px',
                fontWeight: '700',
                color: 'var(--text-secondary, #64748b)',
                minWidth: '24px'
              }}>
                {index + 1}.
              </span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary, #0f172a)' }}>
                {sheet.title}
              </span>
            </div>

            {/* 右側：動作按鈕群組 (向上、向下、刪除、放大) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              
              {/* 向上移動 (調用 onMoveTrack(index, 'up')) */}
              <button
                onClick={() => onMoveTrack(index, 'up')}
                disabled={index === 0}
                title="向上移動"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  color: index === 0 ? '#cbd5e1' : 'var(--text-secondary, #64748b)',
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <ChevronUp size={16} />
              </button>

              {/* 向下移動 (調用 onMoveTrack(index, 'down')) */}
              <button
                onClick={() => onMoveTrack(index, 'down')}
                disabled={index === setlist.length - 1}
                title="向下移動"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  color: index === setlist.length - 1 ? '#cbd5e1' : 'var(--text-secondary, #64748b)',
                  cursor: index === setlist.length - 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <ChevronDown size={16} />
              </button>

              {/* 刪除按鈕 (調用 onRemoveTrack(sheet.id)) */}
              <button
                onClick={() => onRemoveTrack(sheet.id)}
                title="從歌單移除"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  color: 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444'
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary, #94a3b8)'
                  e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Trash2 size={15} />
              </button>

              {/* 放大檢視 (調用 onOpenModal(sheet, index)) */}
              <button
                onClick={() => onOpenModal(sheet, index)}
                title="檢視樂譜"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  color: 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#2563eb'
                  e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)'
                  e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary, #94a3b8)'
                  e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Maximize2 size={15} />
              </button>

            </div>
          </div>
        ))}
      </div>
    </div>
  )
}