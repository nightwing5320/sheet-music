'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/Toast'
import { Sheet } from '@/types'

// 匯入獨立元件
import { Header } from '@/components/Header'
import { SetlistSection } from '@/components/SetlistSection'
import { SheetCard } from '@/components/SheetCard'
import { SheetViewerModal } from '@/components/SheetViewerModal'
import { SpotlightTourModal, TourStep } from '@/components/SpotlightTourModal'

// 匯入頁面邏輯 hooks
import { useSheets } from '@/hooks/useSheets'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useSetlist } from '@/hooks/useSetlist'
import { useSheetFilters, TempoTab } from '@/hooks/useSheetFilters'
import { useSheetViewer } from '@/hooks/useSheetViewer'
import { createTeamSetlist, defaultSetlistTitle, nextSundayString } from '@/utils/teamSetlists'

import { Music, Zap, Moon, HelpCircle, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '#tour-setlist-btn',
    title: '當日敬拜歌單',
    description: '點擊此處可開啟、刪除或編輯今天的歌單',
    position: 'bottom'
  },
  {
    targetSelector: '#tour-profile-btn',
    title: '個人設定',
    description: '可在這裡修改使用者名稱與密碼',
    position: 'bottom'
  },
  {
    targetSelector: '#tour-upload-btn',
    title: '上傳新樂譜',
    description: '快速上傳 PDF 或圖片格式樂譜，系統會自動生成清晰預覽與跨頁連結',
    position: 'bottom'
  },
  {
    targetSelector: '#tour-theme-toggle',
    title: '切換深淺色模式',
    description: '依個人喜好隨時切換不同主題',
    position: 'bottom'
  },
  {
    targetSelector: '.tour-add-setlist-btn',
    title: '加入歌單',
    description: '點擊此按鈕可將樂譜加入今天的歌單',
    position: 'top'
  },
  {
    targetSelector: '.tour-edit-btn',
    title: '編輯樂譜資訊',
    description: '修正歌曲標題、調性及速度（快歌/慢歌）',
    position: 'top'
  },
  {
    targetSelector: '.tour-delete-btn',
    title: '刪除樂譜',
    description: '從樂譜庫中永久移除該首歌曲',
    position: 'top'
  },
  {
    targetSelector: '#tour-help-btn',
    title: '使用說明與導覽',
    description: '點擊此處可查看使用說明，重新啟動導覽模式',
    position: 'bottom'
  }
]

// 速度分類標籤（activeClass 需寫完整 class 名稱，Tailwind 才掃描得到）
const TEMPO_TABS: { id: TempoTab; label: string; Icon: typeof Music; activeClass: string }[] = [
  { id: 'all', label: '全部', Icon: Music, activeClass: 'bg-[#0d60bfe6]' },
  { id: 'fast', label: '快歌', Icon: Zap, activeClass: 'bg-[#f8b136e2]' },
  { id: 'slow', label: '慢歌', Icon: Moon, activeClass: 'bg-[#2fb689e3]' },
  { id: 'unclassified', label: '未分類', Icon: HelpCircle, activeClass: 'bg-[#64748be6]' },
]

// 調性標籤樣式
const KEY_CHIP_CLASS = 'px-3.5 py-1.5 rounded-[20px] border-none text-[13px] cursor-pointer shadow-none'
const KEY_CHIP_ACTIVE = 'bg-[#f8b136e2] text-white'
const KEY_CHIP_INACTIVE = 'bg-(--card-bg) text-(--text-secondary)'

// 分頁按鈕樣式（停用時淡化）
const PAGE_BUTTON_CLASS =
  'inline-flex items-center gap-1 px-4 py-2 rounded-[10px] border border-(--border-color) bg-(--card-bg) text-[14px] font-semibold text-(--text-primary) cursor-pointer disabled:text-(--text-secondary) disabled:opacity-50 disabled:cursor-not-allowed'

export default function Home() {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const { sheets, loading, deleteSheet } = useSheets(supabase)
  const { userDisplayName, isAdmin } = useUserProfile(supabase)
  const { setlist, isInSetlist, addToSetlist, removeFromSetlist, moveSetlistTrack, clearSetlist } = useSetlist(supabase)
  const {
    searchTerm,
    selectedKey,
    activeTab,
    currentPage,
    totalPages,
    dynamicKeys,
    counts,
    filteredCount,
    paginatedSheets,
    handleSearchChange,
    handleKeySelect,
    handleTabSelect,
    goToPage,
  } = useSheetFilters(sheets)
  const viewer = useSheetViewer(setlist)

  const [isSetlistOpen, setIsSetlistOpen] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const listTopRef = useRef<HTMLDivElement>(null)

  // 第一次使用時自動開啟導覽
  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_spotlight_tour')
    if (!hasSeen) {
      const timer = setTimeout(() => setShowTour(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleCloseTour = () => {
    setShowTour(false)
    localStorage.setItem('has_seen_spotlight_tour', 'true')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`確定要刪除樂譜「${title}」嗎？`)) return
    try {
      await deleteSheet(id)
      removeFromSetlist(id)
      toast.success('刪除成功！')
    } catch (err) {
      toast.error('刪除失敗：' + ((err as Error).message || '未知錯誤'))
    }
  }

  // 將個人歌單複製為新的團隊歌單（預設下一個主日），並前往該歌單頁面調整
  const handleShareToTeam = async () => {
    if (setlist.length === 0) return
    try {
      const serviceDate = nextSundayString()
      const id = await createTeamSetlist(supabase, {
        title: defaultSetlistTitle(serviceDate),
        serviceDate,
        sheetIds: setlist.map((sheet) => sheet.id),
      })
      toast.success('已建立團隊歌單，可在此修改名稱與日期')
      router.push(`/team/${id}`)
    } catch (err) {
      toast.error('分享失敗：' + (err as Error).message)
    }
  }

  const handleAddToSetlist = (sheet: Sheet) => {
    if (!addToSetlist(sheet)) {
      toast.info('此樂譜已經在歌單中了！')
      return
    }
    setIsSetlistOpen(true)
  }

  const handlePageChange = (newPage: number) => {
    if (!goToPage(newPage)) return
    // 換頁時平滑滾動回樂譜列表頂部
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="w-full max-w-[1000px] mx-auto px-5 py-8 text-(--text-primary) overflow-x-hidden">
      {/* Header */}
      <Header
        userDisplayName={userDisplayName}
        is_admin={isAdmin}
        setlistCount={setlist.length}
        isSetlistOpen={isSetlistOpen}
        onToggleSetlist={() => setIsSetlistOpen(!isSetlistOpen)}
        onLogout={handleLogout}
        onOpenTour={() => setShowTour(true)}
      />

      {/* Spotlight Tour */}
      <SpotlightTourModal
        isOpen={showTour}
        steps={TOUR_STEPS}
        onClose={handleCloseTour}
      />

      {/* Setlist Section */}
      {isSetlistOpen && (
        <SetlistSection
          setlist={setlist}
          onOpenModal={viewer.openSheet}
          onMoveTrack={moveSetlistTrack}
          onRemoveTrack={removeFromSetlist}
          onClearSetlist={clearSetlist}
          onShareToTeam={handleShareToTeam}
        />
      )}

      {/* 搜尋欄 */}
      <div className="relative mb-5 w-full">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-secondary) pointer-events-none"
        />

        <input
          type="text"
          placeholder="搜尋樂譜名稱或調性 (例如：C, G, Am)..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-10 py-3 text-[15px] rounded-[10px] border border-(--border-color) bg-(--input-bg) text-(--text-primary) outline-none box-border focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
        />

        {searchTerm && (
          <button
            onClick={() => handleSearchChange('')}
            type="button"
            title="清除搜尋"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer inline-flex items-center justify-center p-1 rounded-full text-(--text-secondary)"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 調性標籤 */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="flex gap-1.5 flex-wrap items-center">
          {/* 全部按鈕 */}
          <button
            onClick={() => handleKeySelect(null)}
            className={`${KEY_CHIP_CLASS} font-semibold ${selectedKey === null ? KEY_CHIP_ACTIVE : KEY_CHIP_INACTIVE}`}
          >
            全部
          </button>

          {dynamicKeys.map((key) => {
            const isSelected = selectedKey === key
            return (
              <button
                key={key}
                onClick={() => handleKeySelect(isSelected ? null : key)}
                className={`${KEY_CHIP_CLASS} font-bold ${isSelected ? KEY_CHIP_ACTIVE : KEY_CHIP_INACTIVE}`}
              >
                {key}
              </button>
            )
          })}
        </div>
      </div>

      {/* 速度分類標籤 */}
      <div className="flex gap-2.5 mb-6 border-b-2 border-(--border-color) pb-3 flex-wrap">
        {TEMPO_TABS.map(({ id, label, Icon, activeClass }) => (
          <button
            key={id}
            onClick={() => handleTabSelect(id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-[20px] border-none font-bold text-[14px] cursor-pointer ${
              activeTab === id ? `${activeClass} text-white` : 'bg-(--card-bg) text-(--text-secondary)'
            }`}
          >
            <Icon size={15} />
            <span>{label} ({counts[id]})</span>
          </button>
        ))}
      </div>

      {/* 樂譜列表頂部錨點 (用於換頁平滑滾動) */}
      <div ref={listTopRef} />

      {/* 樂譜列表 */}
      {loading ? (
        <div className="text-center py-15 text-(--text-secondary)">載入樂譜庫中...</div>
      ) : paginatedSheets.length === 0 ? (
        <div className="text-center py-15 bg-(--card-bg) rounded-[12px] border border-dashed border-(--border-color)">
          <p className="text-(--text-secondary) m-0">{searchTerm || selectedKey ? '找不到符合條件的樂譜' : '這個分類目前還沒有樂譜！'}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
            {paginatedSheets.map((sheet, index) => (
              <SheetCard
                key={sheet.id}
                sheet={sheet}
                isFirst={index === 0 && currentPage === 1}
                isInSetlist={isInSetlist(sheet.id)}
                onOpenModal={viewer.openSheet}
                onToggleSetlist={handleAddToSetlist}
                onDeleteSheet={handleDelete}
              />
            ))}
          </div>

          {/* 分頁控制列 (Pagination Bar) */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-9 py-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={PAGE_BUTTON_CLASS}
              >
                <ChevronLeft size={18} />
                <span>上一頁</span>
              </button>

              <span className="text-[14px] font-bold text-(--text-secondary)">
                第 {currentPage} / {totalPages} 頁 (共 {filteredCount} 首)
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={PAGE_BUTTON_CLASS}
              >
                <span>下一頁</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Viewer Modal */}
      {viewer.activeSheetImages.length > 0 && viewer.selectedSheet && (
        <SheetViewerModal
          selectedSheet={viewer.selectedSheet}
          activeSheetImages={viewer.activeSheetImages}
          currentImageIndex={viewer.currentImageIndex}
          currentSetlistIndex={viewer.currentSetlistIndex}
          setlist={setlist}
          annotations={viewer.annotations}
          onUpdateAnnotations={viewer.updateAnnotations}
          onClose={viewer.closeSheet}
          onPrev={viewer.goToPrevPageOrTrack}
          onNext={viewer.goToNextPageOrTrack}
          onTouchStart={viewer.handleTouchStart}
          onTouchEnd={viewer.handleTouchEnd}
        />
      )}
    </main>
  )
}