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
    <div style={{
      borderRadius: '16px',
      overflow: 'hidden',
      /* 📌 使用 CSS 變數，沒有設定時提供淺色預設值 */
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

        {/* 放大按鈕 */}
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
      </div>

      {/* 內容區域 */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

          {/* 編輯按鈕 */}
          <Link 
            href={`/edit/${sheet.id}`} 
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px', 
              fontWeight: '600',
              color: '#0284c7', 
              backgroundColor: 'rgba(2, 132, 199, 0.08)',
              border: '1px solid rgba(2, 132, 199, 0.2)', 
              borderRadius: '10px',
              padding: '8px 12px',
              textDecoration: 'none'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            編輯
          </Link>
        </div>

        {/* 底部功能鍵 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={() => onToggleSetlist(sheet)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px 18px',
              borderRadius: '10px',
              border: 'none',
              background: isInSetlist 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: isInSetlist ? '0 2px 8px rgba(16, 185, 129, 0.25)' : '0 2px 8px rgba(99, 102, 241, 0.25)',
            }}
          >
            {isInSetlist ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                已加入歌單
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                加入歌單
              </>
            )}
          </button>

          {/* 刪除按鈕 */}
          {onDeleteSheet && (
            <button
              onClick={() => onDeleteSheet(sheet.id, sheet.title)}
              title="刪除樂譜"
              style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}