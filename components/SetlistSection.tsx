'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { Sheet } from '@/types'
import { isPastDate, openDatePicker, todayString } from '@/utils/teamSetlists'
import { ListMusic, Trash2, Maximize2, ChevronUp, ChevronDown, RotateCcw, Users } from 'lucide-react'

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
  onShareToTeam?: (serviceDate: string) => Promise<void>
}

export function SetlistSection({
  setlist,
  onOpenModal,
  onMoveTrack,
  onRemoveTrack,
  onClearSetlist,
  onShareToTeam,
}: SetlistSectionProps) {
  const toast = useToast()
  // 分享前先選聚會日期；null 表示未開啟
  const [shareDate, setShareDate] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  if (setlist.length === 0) return null

  // 只能選今天以後：聚會日期已過的團隊歌單會被自動刪除
  const handleShareDateChange = (value: string) => {
    if (isPastDate(value)) {
      toast.info('聚會日期不能選過去的日期')
      return
    }
    setShareDate(value)
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onShareToTeam || !shareDate) return
    if (shareDate < todayString()) {
      toast.info('聚會日期不能選過去的日期')
      return
    }

    setSharing(true)
    await onShareToTeam(shareDate)
    setSharing(false)
  }

  return (
    <div className="rounded-[16px] bg-(--card-bg) border border-(--border-color) shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-6 mb-8 transition-all duration-200">
      {/* 標題與操作按鈕 */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ListMusic size={22} className="text-(--text-primary)" />
          <h2 className="m-0 text-[20px] font-bold text-(--text-primary)">
            個人歌單 ({setlist.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* 分享為團隊歌單 */}
          {onShareToTeam && (
            <button
              onClick={() => setShareDate(shareDate === null ? todayString() : null)}
              aria-expanded={shareDate !== null}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[8px] text-[13px] font-medium text-(--text-secondary) bg-transparent border border-(--border-color) cursor-pointer transition-all duration-200 hover:text-[#2563eb] hover:border-[rgba(37,99,235,0.3)] hover:bg-[rgba(37,99,235,0.05)]"
            >
              <Users size={14} />
              <span>分享為團隊歌單</span>
            </button>
          )}

          {/* 一鍵清空按鈕 */}
          <button
            onClick={onClearSetlist}
            className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[8px] text-[13px] font-medium text-(--text-secondary) bg-transparent border border-(--border-color) cursor-pointer transition-all duration-200 hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.05)]"
          >
            <RotateCcw size={14} />
            <span>一鍵清空</span>
          </button>
        </div>
      </div>

      {/* 分享前選擇聚會日期 */}
      {shareDate !== null && (
        <form onSubmit={handleShare} className="flex items-end gap-2 flex-wrap mb-5 p-3 rounded-[12px] border border-(--border-color)">
          <div>
            <label htmlFor="share-date" className="block mb-1.5 text-[13px] font-semibold text-(--text-secondary)">
              聚會日期
            </label>
            <input
              id="share-date"
              type="date"
              value={shareDate}
              min={todayString()}
              onChange={(e) => handleShareDateChange(e.target.value)}
              onClick={openDatePicker}
              required
              className="cursor-pointer h-[34px] px-3 rounded-[8px] border border-(--border-color) bg-(--card-bg) text-(--text-primary) box-border text-[14px]"
            />
          </div>
          <button
            type="submit"
            disabled={sharing}
            className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[8px] text-[13px] font-semibold bg-(--text-primary) text-(--background) border-none cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Users size={14} />
            <span>{sharing ? '建立中...' : '建立團隊歌單'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShareDate(null)}
            className="inline-flex items-center h-[34px] px-3 rounded-[8px] text-[13px] font-medium text-(--text-secondary) bg-transparent border border-(--border-color) cursor-pointer transition-all duration-200 hover:text-(--text-primary)"
          >
            取消
          </button>
        </form>
      )}

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
