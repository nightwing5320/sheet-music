'use client'

import { Sheet } from '@/types'
import Link from 'next/link'
import { Edit3, Trash2, Plus, Check, ZoomIn } from 'lucide-react'

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
    <div style={{
      borderRadius: '16px',
      overflow: 'hidden',
      backgroundColor: 'var(--card-bg, #ffffff)', 
      border: '1px solid var(--border-color, #e2e8f0)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.2s ease',
    }}>
      
      {/* 樂譜預覽圖 */}
      <div 
        onClick={() => onOpenModal(sheet)}
        style={{
          position: 'relative',
          width: '100%',
          height: '210px',
          backgroundColor: 'var(--bg-secondary, #f8fafc)',
          cursor: 'pointer',
          overflow: 'hidden'
        }}
      >
        <img 
          src={imageUrl} 
          alt={sheet.title} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top',
          }}
        />

        {/* 放大按鈕 (改用 Lucide ZoomIn) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenModal(sheet)
          }}
          title="全螢幕放大檢視"
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
        >
          <ZoomIn size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* 內容區域 */}
      <div 
        style={{ 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div>
            {/* 樂譜標題 */}
            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text-primary, #0f172a)' }}>
              {sheet.title}
            </h3>
            {/* 調性資訊 */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', alignItems: 'center' }}>
              {sheet.artist && (
                <span style={{ fontSize: '14px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'var(--tag-bg, #f1f5f9)', color: 'var(--text-secondary, #64748b)', fontWeight: '500' }}>
                  調性：{sheet.artist}
                </span>
              )}
            </div>
          </div>

          {/* 編輯按鈕 (改用 Lucide Edit3 + 修復 Link 屬性) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Link 
            href={`/edit/${sheet.id}`} 
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
              textDecoration: 'none',
              lineHeight: '1',
              boxSizing: 'border-box',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#2563eb'                           // 滑鼠移入：文字與 Icon 變深藍色
              e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)'     // 邊框變半透明藍色
              e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)' // 背景呈現微亮淡藍色
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary, #64748b)'    // 滑鼠移出：復原預設灰色
              e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Edit3 size={14} />
            <span>編輯</span>
          </Link>

          {/* 刪除按鈕 (改用 Lucide Trash2 純圖示 + Hover 效果) */}
          {onDeleteSheet && (
            <button
              onClick={() => onDeleteSheet(sheet.id, sheet.title)}
              title="刪除樂譜"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color, #e2e8f0)',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
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
          )}
          </div>
        </div>

        {/* 底部功能鍵 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', alignItems: 'center', width: '100%' }}>
          
          {/* 加入歌單按鈕 (改用 Lucide Check & Plus) */}
          <button
            onClick={() => onToggleSetlist(sheet)}
            style={{
              width: '100%',
              flex: 1,
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 14px',
              borderRadius: '10px',
              border: 'none',
              background: isInSetlist 
                ? 'var(--active-green-bg, #ecfdf5)'    // 已加入：極淡柔和翡翠綠底
                : 'var(--text-primary, #1e293b)',      // 未加入：深灰石墨色
              color: isInSetlist 
                ? 'var(--active-green-text, #047857)'  // 已加入：深翡翠綠字
                : 'var(--background, #ffffff)',        // 未加入：白字
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: isInSetlist 
                ? 'none' 
                : '0 2px 6px rgba(0, 0, 0, 0.08)',    // 柔和微陰影
              transition: 'all 0.2s ease',
            }}
          >
            {isInSetlist ? (
              <>
                <Check size={16} strokeWidth={2.8} />
                <span>已加入歌單</span>
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={2.5} />
                <span>加入歌單</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}