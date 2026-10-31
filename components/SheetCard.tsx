'use client'

import { Sheet } from '@/types'
import Link from 'next/link'
import { Edit3, Trash2, Plus, Check, ZoomIn } from 'lucide-react'

// 編輯 / 刪除小按鈕共用樣式（hover 顏色各自加上）
const smallActionClass =
  'inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[8px] text-[13px] font-medium text-(--text-secondary) bg-transparent border border-(--border-color) no-underline leading-none box-border cursor-pointer transition-all duration-200'

interface SheetCardProps {
  sheet: Sheet
  isInSetlist: boolean
  isFirst?: boolean
  onToggleSetlist: (sheet: Sheet) => void
  onOpenModal: (sheet: Sheet) => void
  onDeleteSheet?: (id: number, title: string) => void
}

export function SheetCard({
  sheet,
  isInSetlist,
  isFirst,
  onToggleSetlist,
  onOpenModal,
  onDeleteSheet,
}: SheetCardProps) {
  const imageUrl = sheet.image_urls?.[0] || sheet.file_url

  return (
    <div
      id={isFirst ? 'tour-first-sheet' : undefined}
      className="rounded-[16px] overflow-hidden bg-(--card-bg) border border-(--border-color) shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col transition-all duration-200"
    >
      {/* 樂譜預覽圖 */}
      <div
        onClick={() => onOpenModal(sheet)}
        className="relative w-full h-[210px] bg-[#f8fafc] cursor-pointer overflow-hidden"
      >
        <img
          src={imageUrl}
          alt={sheet.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-top"
        />

        {/* 放大按鈕 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenModal(sheet)
          }}
          title="全螢幕放大檢視"
          className="absolute bottom-2.5 right-2.5 w-[34px] h-[34px] rounded-[10px] bg-[rgba(0,0,0,0.65)] border border-[rgba(255,255,255,0.3)] text-white flex items-center justify-center cursor-pointer backdrop-blur-[6px] shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
        >
          <ZoomIn size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* 內容區域 */}
      <div className="p-6 flex flex-col gap-4 flex-1 justify-between">
        <div className="flex justify-between items-start gap-2">
          <div>
            {/* 樂譜標題 */}
            <h3 className="m-0 text-[22px] font-bold text-(--text-primary)">
              {sheet.title}
            </h3>
            {/* 調性資訊 */}
            <div className="flex gap-4 mt-1.5 items-center">
              {sheet.artist && (
                <span className="text-[14px] px-1.5 py-1 rounded-[6px] bg-[var(--tag-bg,#f1f5f9)] text-(--text-secondary) font-medium">
                  調性：{sheet.artist}
                </span>
              )}
            </div>
          </div>

          {/* 編輯與刪除按鈕（tour-* class 供導覽定位使用） */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href={`/edit/${sheet.id}`}
              className={`tour-edit-btn ${smallActionClass} hover:text-[#2563eb] hover:border-[rgba(37,99,235,0.3)] hover:bg-[rgba(37,99,235,0.05)]`}
            >
              <Edit3 size={14} />
              <span>編輯</span>
            </Link>

            {onDeleteSheet && (
              <button
                onClick={() => onDeleteSheet(sheet.id, sheet.title)}
                title="刪除樂譜"
                className={`tour-delete-btn ${smallActionClass} hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.05)]`}
              >
                <Trash2 size={14} />
                <span>刪除</span>
              </button>
            )}
          </div>
        </div>

        {/* 底部功能鍵 */}
        <div className="flex gap-2 mt-auto items-center w-full">
          <button
            onClick={() => onToggleSetlist(sheet)}
            className={`tour-add-setlist-btn w-full flex-1 h-[42px] flex items-center justify-center gap-1.5 px-3.5 rounded-[10px] border-none font-semibold text-[15px] cursor-pointer transition-all duration-200 ${
              isInSetlist
                ? 'bg-[#c9fae3] text-[#047857] shadow-none'
                : 'bg-(--text-primary) text-(--background) shadow-[0_2px_6px_rgba(0,0,0,0.08)]'
            }`}
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
