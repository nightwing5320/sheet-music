'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Sheet } from '@/types'

// 匯入獨立元件
import { Header } from '@/components/Header'
import { SetlistSection } from '@/components/SetlistSection'
import { SheetCard } from '@/components/SheetCard'
import { SheetViewerModal } from '@/components/SheetViewerModal'
import { SpotlightTourModal, TourStep } from '@/components/SpotlightTourModal'

import { Music, Zap, Moon, HelpCircle, Search, X } from 'lucide-react'

export const dynamic = 'force-dynamic'


export default function Home() {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'fast' | 'slow' | 'unclassified'>('all')
  
  const [setlist, setSetlist] = useState<Sheet[]>([])
  const [isSetlistOpen, setIsSetlistOpen] = useState(false)

  const [showTour, setShowTour] = useState(false)

  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const dynamicKeys = Array.from(
    new Set(
      sheets
        .map((s) => {
          return s.artist?.normalize('NFKC')?.trim()
        })
        .filter((k): k is string => typeof k === 'string' && k.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b))
  

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_spotlight_tour')
    if (!hasSeen) {
      const timer = setTimeout(() => setShowTour(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  // 記錄目前選中的樂譜物件與 Modal 狀態
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null)
  const [activeSheetImages, setActiveSheetImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentSetlistIndex, setCurrentSetlistIndex] = useState<number | null>(null)

  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [userDisplayName, setUserDisplayName] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  const router = useRouter()
  const supabase = createClient()

  // 筆記資料 State
  const [annotations, setAnnotations] = useState<Record<string, any>>({})

  // 初始讀取 LocalStorage 紀錄筆記
  useEffect(() => {
    const savedAnnotations = localStorage.getItem('worship_sheet_annotations')
    if (savedAnnotations) {
      try {
        setAnnotations(JSON.parse(savedAnnotations))
      } catch (e) {
        console.error('Failed to load annotations', e)
      }
    }
  }, [])

  const handleCloseTour = () => {
    setShowTour(false)
    localStorage.setItem('has_seen_spotlight_tour', 'true')
  }

  // 更新筆記並同步存至 LocalStorage
  const handleUpdateAnnotations = (annotationKey: string, newPaths: any[]) => {
    setAnnotations((prev) => {
      const updated = { ...prev, [annotationKey]: newPaths }
      localStorage.setItem('worship_sheet_annotations', JSON.stringify(updated))
      return updated
    })
  }

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
      description: '依個人喜好隨時切換深/淺色模式',
      position: 'bottom'
    },
    {
      targetSelector: '#tour-add-setlist-btn',
      title: '加入歌單',
      description: '點擊此按鈕可迅速將樂譜加入今天的歌單',
      position: 'top'
    },
    {
      targetSelector: '#tour-edit-btn',
      title: '編輯樂譜資訊',
      description: '修正歌曲標題、調性及速度（快歌/慢歌）',
      position: 'top'
    },
    {
      targetSelector: '#tour-delete-btn',
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

  useEffect(() => {
    fetchUserProfile()
    fetchSheets()
    
    // 先從 LocalStorage 快取中讀取歌單預覽
    const savedSetlist = localStorage.getItem('worship_setlist')
    if (savedSetlist) {
      try {
        setSetlist(JSON.parse(savedSetlist))
      } catch (e) {
        console.error('Failed to load local setlist', e)
      }
    }
  }, [])

  // 獲取 Profile，並從雲端讀取使用者的 setlist 歌單
  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, is_admin, setlist')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (profile.display_name) {
          setUserDisplayName(profile.display_name)
        } else if (user.user_metadata?.display_name) {
          setUserDisplayName(user.user_metadata.display_name)
        } else if (user.email) {
          setUserDisplayName(user.email.split('@')[0])
        }

        setIsAdmin(!!profile.is_admin)

        // 雲端若有 setlist 紀錄，優先套用雲端資料並更新 LocalStorage
        if (profile.setlist && Array.isArray(profile.setlist)) {
          setSetlist(profile.setlist)
          localStorage.setItem('worship_setlist', JSON.stringify(profile.setlist))
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
  }

  // 當 setlist 歌單變更時，同時寫入 LocalStorage 與同步上傳至 Supabase 雲端
  useEffect(() => {
    localStorage.setItem('worship_setlist', JSON.stringify(setlist))

    const syncSetlistToCloud = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
          .from('profiles')
          .update({ setlist })
          .eq('id', user.id)
      } catch (err) {
        console.error('Failed to sync setlist to cloud:', err)
      }
    }

    syncSetlistToCloud()
  }, [setlist])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSheetImages.length === 0) return
      if (e.key === 'Escape') closeModal()
      else if (e.key === 'ArrowRight') goToNextPageOrTrack()
      else if (e.key === 'ArrowLeft') goToPrevPageOrTrack()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSheetImages, currentImageIndex, currentSetlistIndex, setlist])

  const fetchSheets = async () => {
    try {
      const { data, error } = await supabase
        .from('sheets')
        .select('id, title, artist, tempo, file_url, image_urls, created_at')
        .order('created_at', { ascending: false })

      if (error) console.error('Error fetching sheets:', error)
      else if (data) setSheets(data as Sheet[])
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`確定要刪除樂譜「${title}」嗎？`)) return
    try {
      const { error } = await supabase.from('sheets').delete().eq('id', id)
      if (error) throw error
      setSheets((prev) => prev.filter((sheet) => sheet.id !== id))
      setSetlist((prev) => prev.filter((sheet) => sheet.id !== id))
      alert('刪除成功！')
    } catch (err: any) {
      alert('刪除失敗：' + (err.message || '未知錯誤'))
    }
  }

  const addToSetlist = (sheet: Sheet) => {
    if (setlist.some((item) => item.id === sheet.id)) {
      alert('此樂譜已經在歌單中了！')
      return
    }
    setSetlist((prev) => [...prev, sheet])
    setIsSetlistOpen(true)
  }

  const removeFromSetlist = (id: number) => {
    setSetlist((prev) => prev.filter((sheet) => sheet.id !== id))
  }

  const moveSetlistTrack = (index: number, direction: 'up' | 'down') => {
    const newSetlist = [...setlist]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSetlist.length) return
    const temp = newSetlist[index]
    newSetlist[index] = newSetlist[targetIndex]
    newSetlist[targetIndex] = temp
    setSetlist(newSetlist)
  }

  const clearSetlist = () => {
    if (setlist.length === 0) return
    if (window.confirm('確定要清除今天的敬拜歌單嗎？')) setSetlist([])
  }

  const openModal = (sheet: Sheet, setlistIdx: number | null = null) => {
    const pages = (sheet.image_urls && sheet.image_urls.length > 0) ? sheet.image_urls : [sheet.file_url]
    setSelectedSheet(sheet)
    setActiveSheetImages(pages)
    setCurrentImageIndex(0)
    setCurrentSetlistIndex(setlistIdx)
  }

  const closeModal = () => {
    setSelectedSheet(null)
    setActiveSheetImages([])
    setCurrentSetlistIndex(null)
  }

  const goToNextPageOrTrack = () => {
    if (currentImageIndex < activeSheetImages.length - 1) {
      setCurrentImageIndex((prev) => prev + 1)
    } else if (currentSetlistIndex !== null && currentSetlistIndex < setlist.length - 1) {
      const nextTrackIdx = currentSetlistIndex + 1
      openModal(setlist[nextTrackIdx], nextTrackIdx)
    }
  }

  const goToPrevPageOrTrack = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1)
    } else if (currentSetlistIndex !== null && currentSetlistIndex > 0) {
      const prevTrackIdx = currentSetlistIndex - 1
      const prevSheet = setlist[prevTrackIdx]
      const pages = (prevSheet.image_urls && prevSheet.image_urls.length > 0) ? prevSheet.image_urls : [prevSheet.file_url]
      setSelectedSheet(prevSheet)
      setActiveSheetImages(pages)
      setCurrentImageIndex(pages.length - 1)
      setCurrentSetlistIndex(prevTrackIdx)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX
    if (deltaX < -50) goToNextPageOrTrack()
    else if (deltaX > 50) goToPrevPageOrTrack()
    setTouchStartX(null)
  }

  // 1. 關鍵字搜尋過濾
  const searchFilteredSheets = sheets.filter((sheet) => {
    const term = searchTerm.toLowerCase()
    const matchesTitle = sheet.title.toLowerCase().includes(term)
    const matchesKey = sheet.artist?.toLowerCase().includes(term) ?? false
    return matchesTitle || matchesKey
  })

  // 2. 調性標籤過濾
  const keyFilteredSheets = searchFilteredSheets.filter((sheet) => {
    if (!selectedKey) return true
    if (!sheet.artist) return false

    const rawKey = sheet.artist.normalize('NKFC').trim().toLowerCase()
    const targetKey = selectedKey.normalize('NFKC').trim().toLowerCase()

    if (rawKey === targetKey) return true

    const regex = new RegExp('\\b${targetKey}(?![b#])', 'i')

    return regex.test(rawKey)
  })

  // 3. 計算已經過調性與搜尋過濾後的各速度數量
  const countAll = keyFilteredSheets.length
  const countFast = keyFilteredSheets.filter((s) => s.tempo === 'fast').length
  const countSlow = keyFilteredSheets.filter((s) => s.tempo === 'slow').length
  const countUnclassified = keyFilteredSheets.filter((s) => !s.tempo || (s.tempo !== 'fast' && s.tempo !== 'slow')).length

  // 4. 最終顯示列表：從 keyFilteredSheets（已套用調性過濾）中過濾速度頁籤
  const filteredSheets = keyFilteredSheets.filter((sheet) => {
    if (activeTab === 'fast') return sheet.tempo === 'fast'
    if (activeTab === 'slow') return sheet.tempo === 'slow'
    if (activeTab === 'unclassified') return !sheet.tempo || (sheet.tempo !== 'fast' && sheet.tempo !== 'slow')
    return true
  })

  return (
    <main style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', color: 'var(--text-primary)', overflowX: 'hidden'}}>
      {/* 頂部 Header 元件 */}
      <Header
        userDisplayName={userDisplayName}
        is_admin={isAdmin}
        setlistCount={setlist.length}
        isSetlistOpen={isSetlistOpen}
        onToggleSetlist={() => setIsSetlistOpen(!isSetlistOpen)}
        onLogout={handleLogout}
        onOpenTour={() => setShowTour(true)} //點擊重新觸發導覽
      />

      {/* 高級 Spotlight 箭頭指向導覽 */}
      <SpotlightTourModal
        isOpen={showTour}
        steps={TOUR_STEPS}
        onClose={handleCloseTour}
      />

      {/* 歌單展折區元件 */}
      {isSetlistOpen && (
        <SetlistSection
          setlist={setlist}
          onOpenModal={openModal}
          onMoveTrack={moveSetlistTrack}
          onRemoveTrack={removeFromSetlist}
          onClearSetlist={clearSetlist}
        />
      )}

      {/* 搜尋欄（附帶一鍵清除按鈕） */}
      <div style={{ position: 'relative', marginBottom: '20px', width: '100%' }}>
        {/* 左側搜尋放大鏡圖示 */}
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

        {/* 搜尋輸入框 */}
        <input
          type="text"
          placeholder="搜尋樂譜名稱或調性 (例如：C, G, Am)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '12px 40px 12px 40px', // 左右兩側留出空間給圖示
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

        {/* 右側一鍵清除按鈕 (只有在有輸入文字時顯示) */}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
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
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.backgroundColor = 'var(--border-color)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 調性快速過濾標籤 */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginRight: '4px' }}>
          調性：
        </span>

        {/* 清除選取按鈕 */}
        <button
          onClick={() => setSelectedKey(null)}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: selectedKey === null ? '1px solid #3b82f6' : '1px solid var(--border-color)',
            backgroundColor: selectedKey === null ? 'rgba(59, 130, 246, 0.15)' : 'var(--card-bg)',
            color: selectedKey === null ? '#3b82f6' : 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          全部
        </button>

        {dynamicKeys.map((key) => {
          const isSelected = selectedKey === key
          return (
            <button
              key={key}
              onClick={() => setSelectedKey(isSelected ? null : key)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                backgroundColor: isSelected ? '#3b82f6' : 'var(--card-bg)',
                color: isSelected ? '#ffffff' : 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              {key}
            </button>
          )
        })}
      </div>

      {/* 分類按鈕區 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('all')} 
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
          <span>全部 ({countAll})</span>
        </button>

        <button 
          onClick={() => setActiveTab('fast')} 
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
          <span>快歌 ({countFast})</span>
        </button>

        <button 
          onClick={() => setActiveTab('slow')} 
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
          <span>慢歌 ({countSlow})</span>
        </button>

        <button 
          onClick={() => setActiveTab('unclassified')} 
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
          <span>未分類 ({countUnclassified})</span>
        </button>
      </div>

      {/* 樂譜列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>載入樂譜庫中...</div>
      ) : filteredSheets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{searchTerm || selectedKey ? '找不到符合條件的樂譜' : '這個分類目前還沒有樂譜！'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredSheets.map((sheet, index) => (
            <SheetCard
              key={sheet.id}
              sheet={sheet}
              isFirst={index === 0}
              isInSetlist={setlist.some((item) => item.id === sheet.id)}
              onOpenModal={openModal}
              onToggleSetlist={addToSetlist}
              onDeleteSheet={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 樂譜開啟檢視與塗鴉 Modal */}
      {activeSheetImages.length > 0 && selectedSheet && (
        <SheetViewerModal
          selectedSheet={selectedSheet}
          activeSheetImages={activeSheetImages}
          currentImageIndex={currentImageIndex}
          currentSetlistIndex={currentSetlistIndex}
          setlist={setlist}
          annotations={annotations}
          onUpdateAnnotations={handleUpdateAnnotations}
          onClose={closeModal}
          onPrev={goToPrevPageOrTrack}
          onNext={goToNextPageOrTrack}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      )}
    </main>
  )
}