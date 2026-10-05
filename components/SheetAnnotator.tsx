'use client'

import React from 'react'
import { Sheet } from '@/types'
import { 
  X, 
  Pencil, 
  ListMusic, 
  ChevronLeft, 
  ChevronRight,
  Maximize2
} from 'lucide-react'

interface SheetAnnotatorProps {
  sheet: Sheet
  onClose: () => void
  // 如果有前一首/後一首或前後頁功能
  setlistContext?: {
    currentIndex: number
    totalCount: number
  }
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  isAnnotating?: boolean
  onToggleAnnotation?: () => void
}

export function SheetAnnotator({
  sheet,
  onClose,
  setlistContext,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  isAnnotating = false,
  onToggleAnnotation,
}: SheetAnnotatorProps) {
  const imageUrl = sheet.image_urls?.[0] || sheet.file_url

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(15, 23, 42, 0.85)', // 深色半透明遮罩
      backdropFilter: 'blur(12px)',               // 📌 現代感毛玻璃效果
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px',
      boxSizing: 'border-box',
    }}>

      {/* 📌 1. 頂部工具列 Top Bar */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}>
        {/* 左側：歌單位置資訊標籤 */}
        {setlistContext ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            fontSize: '14px',
            fontWeight: '600',
            backdropFilter: 'blur(8px)',
          }}>
            <ListMusic size={16} />
            <span>歌單 ({setlistContext.currentIndex + 1}/{setlistContext.totalCount})：{sheet.title}</span>
          </div>
        ) : (
          <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '700' }}>
            {sheet.title}
          </div>
        )}

        {/* 右側：動作按鈕 (塗鴉筆記 + 關閉 Modal) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onToggleAnnotation && (
            <button
              onClick={onToggleAnnotation}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '38px',
                padding: '0 14px',
                borderRadius: '10px',
                backgroundColor: isAnnotating ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                if (!isAnnotating) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                if (!isAnnotating) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <Pencil size={15} />
              <span>{isAnnotating ? '結束筆記' : '塗鴉筆記'}</span>
            </button>
          )}

          {/* 關閉 Modal 按鈕 */}
          <button
            onClick={onClose}
            title="關閉 (Esc)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)' // Hover 時顯示微紅關閉提示
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.9)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* 📌 2. 中間樂譜檢視區域 Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        margin: '16px 0',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          maxHeight: '100%',
          maxWidth: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', // 高質感沉浸陰影
          backgroundColor: '#ffffff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <img 
            src={imageUrl} 
            alt={sheet.title} 
            style={{
              maxHeight: '78vh',
              maxWidth: '90vw',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </div>
      </div>

      {/* 📌 3. 底部分頁切換列 Bottom Pagination Control */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '6px 12px',
        borderRadius: '30px',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        zIndex: 10,
      }}>
        {/* 上一頁 / 上一首 */}
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '36px',
            padding: '0 16px',
            borderRadius: '20px',
            backgroundColor: hasPrev ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            border: 'none',
            color: hasPrev ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: hasPrev ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (hasPrev) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'
          }}
          onMouseLeave={(e) => {
            if (hasPrev) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
          }}
        >
          <ChevronLeft size={16} />
          <span>上一首</span>
        </button>

        {/* 頁數資訊 */}
        <span style={{ 
          fontSize: '13px', 
          fontWeight: '600', 
          color: 'rgba(255, 255, 255, 0.7)',
          padding: '0 8px'
        }}>
          {setlistContext ? `${setlistContext.currentIndex + 1} / ${setlistContext.totalCount}` : '第 1/1 頁'}
        </span>

        {/* 下一頁 / 下一首 */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '36px',
            padding: '0 16px',
            borderRadius: '20px',
            backgroundColor: hasNext ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            border: 'none',
            color: hasNext ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: hasNext ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (hasNext) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'
          }}
          onMouseLeave={(e) => {
            if (hasNext) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
          }}
        >
          <span>下一首</span>
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  )
}