'use client'

import { Sheet } from '@/types'
import { ListMusic, Trash2, Maximize2, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react'

// 歌曲列右側的小方形按鈕
const trackButtonClass =
  'inline-flex items-center justify-center w-8 h-8 rounded-[6px] bg-transparent border border-(--border-color) text-(--text-secondary) cursor-pointer transition-all duration-200'

// 上下移動按鈕：停用時淡灰色
const moveButtonClass = `${trackButtonClass} disabled:text-[#cbd5e1] disabled:cursor-not-allowed`

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
    <div className="rounded-[16px] bg-(--card-bg) border border-(--border-color) shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-6 mb-8 transition-all duration-200">
      {/* 標題與清空按鈕 */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <ListMusic size={22} className="text-(--text-primary)" />
          <h2 className="m-0 text-[20px] font-bold text-(--text-primary)">
            今日敬拜歌單 ({setlist.length})
          </h2>
        </div>

        {/* 一鍵清空按鈕 */}
        <button
          onClick={onClearSetlist}
          className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[8px] text-[13px] font-medium text-(--text-secondary) bg-transparent border border-(--border-color) cursor-pointer transition-all duration-200 hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.05)]"
        >
          <RotateCcw size={14} />
          <span>一鍵清空</span>
        </button>
      </div>

      {/* 歌單列表 */}
      <div className="flex flex-col gap-3">
        {setlist.map((sheet, index) => (
          <div
            key={sheet.id}
            className="flex items-center justify-between px-4 py-3 rounded-[12px] bg-(--card-bg) border border-(--border-color) transition-all duration-200"
          >
            {/* 左側：序號與歌名 */}
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-bold text-(--text-secondary) min-w-6">
                {index + 1}.
              </span>
              <span className="text-[16px] font-semibold text-(--text-primary)">
                {sheet.title}
              </span>
            </div>

            {/* 右側：動作按鈕群組 (向上、向下、刪除、放大) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onMoveTrack(index, 'up')}
                disabled={index === 0}
                title="向上移動"
                className={moveButtonClass}
              >
                <ChevronUp size={16} />
              </button>

              <button
                onClick={() => onMoveTrack(index, 'down')}
                disabled={index === setlist.length - 1}
                title="向下移動"
                className={moveButtonClass}
              >
                <ChevronDown size={16} />
              </button>

              <button
                onClick={() => onRemoveTrack(sheet.id)}
                title="從歌單移除"
                className={`${trackButtonClass} hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.05)]`}
              >
                <Trash2 size={15} />
              </button>

              <button
                onClick={() => onOpenModal(sheet, index)}
                title="檢視樂譜"
                className={`${trackButtonClass} hover:text-[#2563eb] hover:border-[rgba(37,99,235,0.3)] hover:bg-[rgba(37,99,235,0.05)]`}
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
