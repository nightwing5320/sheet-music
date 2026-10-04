'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Sheet } from '@/types' // 📌 匯入統一型態

// 📌 匯入獨立元件
import { Header } from '@/components/Header'
import { SetlistSection } from '@/components/SetlistSection'
import { SheetCard } from '@/components/SheetCard'
import { SheetViewerModal } from '@/components/SheetViewerModal'

// 強制動態渲染，防止 Next.js 建置預覽時因無金鑰失敗
export const dynamic = 'force-dynamic'

export default function Home() {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'fast' | 'slow' | 'unclassified'>('all')
  
  const [setlist, setSetlist] = useState<Sheet[]>([])
  const [isSetlistOpen, setIsSetlistOpen] = useState(false)

  // 📌 記錄目前選中的樂譜物件與 Modal 狀態
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null)
  const [activeSheetImages, setActiveSheetImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentSetlistIndex, setCurrentSetlistIndex] = useState<number | null>(null)

  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [userDisplayName, setUserDisplayName] = useState<string>('')

  const router = useRouter()
  const supabase = createClient()

  // 1. 筆記資料 State
  const [annotations, setAnnotations] = useState<Record<string, any>>({})

  // 2. 初始讀取 LocalStorage 紀錄
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

  // 3. 更新筆記並同步存至 LocalStorage
  const handleUpdateAnnotations = (annotationKey: string, newPaths: any[]) => {
    console.log('✍️ 正在儲存筆記，Key 為:', annotationKey, '內容:', newPaths)
    setAnnotations((prev) => {
      const updated = { ...prev, [annotationKey]: newPaths }
      localStorage.setItem('worship_sheet_annotations', JSON.stringify(updated))
      return updated
    })
  }

  useEffect(() => {
    fetchUserProfile()
    fetchSheets()
    const savedSetlist = localStorage.getItem('worship_setlist')
    if (savedSetlist) {
      try {
        setSetlist(JSON.parse(savedSetlist))
      } catch (e) {
        console.error('Failed to load setlist', e)
      }
    }
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      if (profile && profile.display_name) {
        setUserDisplayName(profile.display_name)
      } else if (user.user_metadata?.display_name) {
        setUserDisplayName(user.user_metadata.display_name)
      } else if (user.email) {
        setUserDisplayName(user.email.split('@')[0])
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
  }

  useEffect(() => {
    localStorage.setItem('worship_setlist', JSON.stringify(setlist))
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

  // 📌 開啟 Modal 時，同步保存目前點擊的 Sheet 物件
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

  const searchFilteredSheets = sheets.filter((sheet) => {
    const term = searchTerm.toLowerCase()
    return sheet.title.toLowerCase().includes(term) || (sheet.artist?.toLowerCase().includes(term) ?? false)
  })

  const countAll = searchFilteredSheets.length
  const countFast = searchFilteredSheets.filter((s) => s.tempo === 'fast').length
  const countSlow = searchFilteredSheets.filter((s) => s.tempo === 'slow').length
  const countUnclassified = searchFilteredSheets.filter((s) => !s.tempo || (s.tempo !== 'fast' && s.tempo !== 'slow')).length

  const filteredSheets = searchFilteredSheets.filter((sheet) => {
    if (activeTab === 'fast') return sheet.tempo === 'fast'
    if (activeTab === 'slow') return sheet.tempo === 'slow'
    if (activeTab === 'unclassified') return !sheet.tempo || (sheet.tempo !== 'fast' && sheet.tempo !== 'slow')
    return true
  })

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', color: 'var(--text-primary)' }}>
      {/* 1️⃣ 頂部 Header 元件 */}
      <Header
        userDisplayName={userDisplayName}
        setlistCount={setlist.length}
        isSetlistOpen={isSetlistOpen}
        onToggleSetlist={() => setIsSetlistOpen(!isSetlistOpen)}
        onLogout={handleLogout}
      />

      {/* 2️⃣ 歌單展折區元件 */}
      {isSetlistOpen && (
        <SetlistSection
          setlist={setlist}
          onOpenModal={openModal}
          onMoveTrack={moveSetlistTrack}
          onRemoveTrack={removeFromSetlist}
          onClearSetlist={clearSetlist}
        />
      )}

      {/* 搜尋欄 */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 搜尋樂譜名稱或調性 (例如：C, G, Am)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', fontSize: '15px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* 分類 Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('all')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'all' ? '#0a70e3b6' : 'var(--card-bg)', color: activeTab === 'all' ? 'white' : 'var(--text-secondary)' }}>🎵 全部 ({countAll})</button>
        <button onClick={() => setActiveTab('fast')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'fast' ? '#f4ae35ca' : 'var(--card-bg)', color: activeTab === 'fast' ? 'white' : 'var(--text-secondary)' }}>⚡ 快歌 ({countFast})</button>
        <button onClick={() => setActiveTab('slow')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'slow' ? '#35c394d0' : 'var(--card-bg)', color: activeTab === 'slow' ? 'white' : 'var(--text-secondary)' }}>🌙 慢歌 ({countSlow})</button>
        <button onClick={() => setActiveTab('unclassified')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'unclassified' ? '#6b7280' : 'var(--card-bg)', color: activeTab === 'unclassified' ? 'white' : 'var(--text-secondary)' }}>❓ 未分類 ({countUnclassified})</button>
      </div>

      {/* 樂譜清單區塊 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>載入樂譜庫中...</div>
      ) : filteredSheets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{searchTerm ? '找不到符合條件的樂譜' : '這個分類目前還沒有樂譜！'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredSheets.map((sheet) => (
            <SheetCard
              key={sheet.id}
              sheet={sheet}
              isInSetlist={setlist.some((item) => item.id === sheet.id)}
              onOpenModal={openModal}
              onToggleSetlist={addToSetlist}
              onDeleteSheet={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 📌 修正後的 SheetViewerModal 渲染條件 */}
      {activeSheetImages.length > 0 && selectedSheet && (
        <SheetViewerModal
          selectedSheet={selectedSheet} // 📌 傳入目前選中的樂譜物件
          activeSheetImages={activeSheetImages}
          currentImageIndex={currentImageIndex}
          currentSetlistIndex={currentSetlistIndex}
          setlist={setlist}
          annotations={annotations} // 📌 新增此行
          onUpdateAnnotations={handleUpdateAnnotations} // 📌 新增此行
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