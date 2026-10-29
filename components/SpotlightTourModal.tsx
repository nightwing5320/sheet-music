'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react'

export interface TourStep {
  targetSelector: string // DOM query selector, e.g. '#header-theme-toggle'
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface SpotlightTourModalProps {
  isOpen: boolean
  steps: TourStep[]
  onClose: () => void
}

export function SpotlightTourModal({ isOpen, steps, onClose }: SpotlightTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const step = steps[currentStepIndex]

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0)
      setTargetRect(null)
    }
  }, [isOpen])

  // 定位目標元素的位置
  useEffect(() => {
    if (!isOpen || !step) return

    const updateRect = () => {
      const el = document.querySelector(step.targetSelector)
      if (el) {
        // 📌 確保自動平滑捲動到畫面中央
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        
        // 延遲一小段時間等待捲動定位完成後精準取座標
        setTimeout(() => {
          const rect = el.getBoundingClientRect()
          setTargetRect(rect)
        }, 100)
      } else {
        setTargetRect(null)
      }
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect)

    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect)
    }
  }, [isOpen, currentStepIndex, step])

  if (!isOpen || !step) return null

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  // 計算引導氣泡與箭頭的位置
  const getTooltipStyle = (): { tooltip: React.CSSProperties; arrow: React.CSSProperties } => {
    if (!targetRect) {
      return {
        tooltip: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        arrow: { display: 'none' }
      }
    }

    const margin = 14
    const prefPos = step.position || 'bottom'

    // 預設 Bottom
    let top = targetRect.bottom + margin
    let left = targetRect.left + targetRect.width / 2 - 160 // 氣泡寬度 320px 的一半
    let arrowTop: any = -8
    let arrowLeft: any = '50%'
    let arrowTransform = 'translateX(-50%) rotate(45deg)'

    if (prefPos === 'top') {
      top = targetRect.top - margin - 140
      arrowTop = 'calc(100% - 4px)'
    } else if (prefPos === 'left') {
      top = targetRect.top + targetRect.height / 2 - 60
      left = targetRect.left - 320 - margin
      arrowTop = '50%'
      arrowLeft = 'calc(100% - 4px)'
      arrowTransform = 'translateY(-50%) rotate(45deg)'
    } else if (prefPos === 'right') {
      top = targetRect.top + targetRect.height / 2 - 60
      left = targetRect.right + margin
      arrowTop = '50%'
      arrowLeft = -4
      arrowTransform = 'translateY(-50%) rotate(45deg)'
    }

    // 螢幕邊界夾緊（防氣泡跑出畫面）
    left = Math.max(16, Math.min(left, window.innerWidth - 336))
    top = Math.max(16, Math.min(top, window.innerHeight - 200))

    return {
      tooltip: {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: '320px',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      },
      arrow: {
        position: 'absolute',
        width: '12px',
        height: '12px',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.18)',
        borderTop: '1px solid rgba(255, 255, 255, 0.18)',
        top: arrowTop,
        left: arrowLeft,
        transform: arrowTransform,
        zIndex: 1
      }
    }
  }

  const { tooltip: tooltipStyle, arrow: arrowStyle } = getTooltipStyle()

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'auto' }}>
      
      {/* 📌 1. 光圈遮罩 (Spotlight Hole Effect) */}
      {targetRect ? (
        <div
          style={{
            position: 'fixed',
            boxShadow: `0 0 0 9999px rgba(15, 23, 42, 0.75)`,
            borderRadius: '12px',
            top: `${targetRect.top - 6}px`,      /* 📌 修正：精準扣除 padding 偏移 */
            left: `${targetRect.left - 6}px`,    /* 📌 修正：精準扣除 padding 偏移 */
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            transition: 'all 0.3s ease-out',
            pointerEvents: 'none',
            border: '2px solid #3b82f6'
          }}
        />
      ) : (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)' }} />
      )}

      {/* 📌 2. 說明氣泡框與指向箭頭 */}
      <div 
        style={{
          ...tooltipStyle,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(16px)',
          zIndex: 100000
        }}
      >
        {/* 小箭頭 */}
        <div style={arrowStyle} />

        {/* 標題與關閉按鈕 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} style={{ color: '#3b82f6' }} />
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
              {step.title}
            </h4>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '2px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 說明文字 */}
        <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.5' }}>
          {step.description}
        </p>

        {/* 底部指示器與 Next 按鈕 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '600' }}>
            步驟 {currentStepIndex + 1} / {steps.length}
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12.5px'
                }}
              >
                上一步
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              <span>{currentStepIndex === steps.length - 1 ? '完成導覽' : '下一步'}</span>
              {currentStepIndex === steps.length - 1 ? <Check size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}