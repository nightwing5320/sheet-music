'use client'

import React, { useState, useEffect } from 'react'
import { X, ChevronRight, Check, Sparkles } from 'lucide-react'

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

  // 導覽關閉時重置回第一步（在 render 期間依 prop 變化調整 state）
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (!isOpen) {
      setCurrentStepIndex(0)
      setTargetRect(null)
    }
  }

  const step = steps[currentStepIndex]

  // 定位目標元素的位置
  useEffect(() => {
    if (!isOpen || !step) return

    const updateRect = () => {
      const el = document.querySelector(step.targetSelector)
      if (el) {
        const rect = el.getBoundingClientRect()
        
        // 檢查目標元素是否已經在視窗可見範圍內
        const isInViewport = 
          rect.top >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.left >= 0 &&
          rect.right <= window.innerWidth

        if (!isInViewport) {
          // 如果不在畫面上，才觸發快速滾動
          el.scrollIntoView({ behavior: 'auto', block: 'center' })
        }

        // 立即更新座標，不再死等 300ms 延遲
        requestAnimationFrame(() => {
          setTargetRect(el.getBoundingClientRect())
        })
      } else {
        setTargetRect(null)
      }
    }

    updateRect()

    const timer = setTimeout(updateRect,50)

    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, { capture: true})

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, { capture: true})
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
    let arrowTop: number | string = -8
    let arrowLeft: number | string = '50%'
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
        top: arrowTop,
        left: arrowLeft,
        transform: arrowTransform
      }
    }
  }

  const { tooltip: tooltipStyle, arrow: arrowStyle } = getTooltipStyle()

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-auto">
      {/* 📌 1. 光圈遮罩 (Spotlight Hole Effect)：位置依目標元素計算，需保留 inline style */}
      {targetRect ? (
        <div
          className="fixed shadow-[0_0_0_9999px_rgba(15,23,42,0.75)] rounded-[12px] transition-all duration-300 ease-out pointer-events-none border-2 border-[#3b82f6]"
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgba(15,23,42,0.75)]" />
      )}

      {/* 📌 2. 說明氣泡框與指向箭頭 */}
      <div
        className="bg-[rgba(15,23,42,0.95)] text-white rounded-[16px] p-5 border border-[rgba(255,255,255,0.18)] shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-[16px] z-[100000]"
        style={tooltipStyle}
      >
        {/* 小箭頭 */}
        {targetRect && (
          <div
            className="absolute w-3 h-3 bg-[rgba(15,23,42,0.95)] border-l border-t border-[rgba(255,255,255,0.18)] z-[1]"
            style={arrowStyle}
          />
        )}

        {/* 標題與關閉按鈕 */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-[#3b82f6]" />
            <h4 className="m-0 text-[16px] font-bold text-white">
              {step.title}
            </h4>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-[rgba(255,255,255,0.6)] cursor-pointer p-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* 說明文字 */}
        <p className="mt-0 mx-0 mb-4 text-[13.5px] text-[rgba(255,255,255,0.8)] leading-[1.5]">
          {step.description}
        </p>

        {/* 底部指示器與 Next 按鈕 */}
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-[rgba(255,255,255,0.5)] font-semibold">
            步驟 {currentStepIndex + 1} / {steps.length}
          </span>

          <div className="flex gap-1.5">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-2.5 py-1.5 rounded-[8px] border border-[rgba(255,255,255,0.2)] bg-transparent text-white cursor-pointer text-[12.5px]"
              >
                上一步
              </button>
            )}

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border-none bg-[#3b82f6] text-white font-bold text-[12.5px] cursor-pointer"
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
