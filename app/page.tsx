'use client'

import React, { useEffect, useState, useRef } from 'react'
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
import { useSheetFilters } from '@/hooks/useSheetFilters'
import { useSheetViewer } from '@/hooks/useSheetViewer'

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
    <main style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', color: 'var(--text-primary)', overflowX: 'hidden'}}>
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
        />
      )}

      {/* 搜尋欄 */}
      <div style={{ position: 'relative', marginBottom: '20px', width: '100%' }}>
        <Search 
          size={18} 
          style={{ 
            position: 'absolute', 
            left: '14px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: 'var(--text-secondary)',
            pointerEvents: 'none'
          }} 
        />

        <input
          type="text"
          placeholder="搜尋樂譜名稱或調性 (例如：C, G, Am)..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '12px 40px', 
            fontSize: '15px', 
            borderRadius: '10px', 
            border: '1px solid var(--border-color)', 
            backgroundColor: 'var(--input-bg)', 
            color: 'var(--text-primary)', 
            outline: 'none', 
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#2563eb'
            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-color)'
            e.target.style.boxShadow = 'none'
          }}
        />

        {searchTerm && (
          <button
            onClick={() => handleSearchChange('')}
            type="button"
            title="清除搜尋"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%',
              color: 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 調性標籤 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 全部按鈕 */}
          <button
            onClick={() => handleKeySelect(null)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: selectedKey === null ? '#f8b136e2' : 'var(--card-bg)',
              color: selectedKey === null ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: 'none'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (selectedKey !== null) {
                e.currentTarget.style.borderColor = 'var(--text-secondary)'
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (selectedKey !== null) {
                e.currentTarget.style.borderColor = 'var(--border-color)'
              }
            }}
          >
            全部
          </button>

          {dynamicKeys.map((key) => {
            const isSelected = selectedKey === key
            return (
              <button
                key={key}
                onClick={() => handleKeySelect(isSelected ? null : key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: isSelected ? '#f8b136e2' : 'var(--card-bg)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--text-secondary)'
                  }
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                  }
                }}
              >
                {key}
              </button>
            )
          })}
        </div>
      </div>

      {/* 速度分類標籤 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => handleTabSelect('all')} 
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px', 
            borderRadius: '20px', 
            border: 'none', 
            fontWeight: '700', 
            fontSize: '14px', 
            cursor: 'pointer', 
            backgroundColor: activeTab === 'all' ? '#0d60bfe6' : 'var(--card-bg)', 
            color: activeTab === 'all' ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
          }}
        >
          <Music size={15} />
          <span>全部 ({counts.all})</span>
        </button>

        <button 
          onClick={() => handleTabSelect('fast')} 
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px', 
            borderRadius: '20px', 
            border: 'none', 
            fontWeight: '700', 
            fontSize: '14px', 
            cursor: 'pointer', 
            backgroundColor: activeTab === 'fast' ? '#f8b136e2' : 'var(--card-bg)', 
            color: activeTab === 'fast' ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
          }}
        >
          <Zap size={15} />
          <span>快歌 ({counts.fast})</span>
        </button>

        <button 
          onClick={() => handleTabSelect('slow')} 
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px', 
            borderRadius: '20px', 
            border: 'none', 
            fontWeight: '700', 
            fontSize: '14px', 
            cursor: 'pointer', 
            backgroundColor: activeTab === 'slow' ? '#2fb689e3' : 'var(--card-bg)', 
            color: activeTab === 'slow' ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
          }}
        >
          <Moon size={15} />
          <span>慢歌 ({counts.slow})</span>
        </button>

        <button 
          onClick={() => handleTabSelect('unclassified')} 
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px', 
            borderRadius: '20px', 
            border: 'none', 
            fontWeight: '700', 
            fontSize: '14px', 
            cursor: 'pointer', 
            backgroundColor: activeTab === 'unclassified' ? '#64748be6' : 'var(--card-bg)', 
            color: activeTab === 'unclassified' ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
          }}
        >
          <HelpCircle size={15} />
          <span>未分類 ({counts.unclassified})</span>
        </button>
      </div>

      {/* 樂譜列表頂部錨點 (用於換頁平滑滾動) */}
      <div ref={listTopRef} />

      {/* 樂譜列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>載入樂譜庫中...</div>
      ) : paginatedSheets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{searchTerm || selectedKey ? '找不到符合條件的樂譜' : '這個分類目前還沒有樂譜！'}</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '36px', padding: '16px 0' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--card-bg)',
                  color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronLeft size={18} />
                <span>上一頁</span>
              </button>

              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                第 {currentPage} / {totalPages} 頁 (共 {filteredCount} 首)
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--card-bg)',
                  color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
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