'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Sheet {
  id: number
  title: string
  artist: string | null
  tempo?: 'fast' | 'slow' | string | null
  file_url: string
  image_urls?: string[] | null
  created_at: string
}

export default function Home() {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'fast' | 'slow' | 'unclassified'>('all')
  
  // 📌 敬拜歌單 State (預設會從 LocalStorage 載入)
  const [setlist, setSetlist] = useState<Sheet[]>([])
  const [isSetlistOpen, setIsSetlistOpen] = useState(false) // 展開/折疊歌單

  const [activeSheetImages, setActiveSheetImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchSheets()
    // 初始化時從 LocalStorage 載入暫存歌單
    const savedSetlist = localStorage.getItem('worship_setlist')
    if (savedSetlist) {
      try {
        setSetlist(JSON.parse(savedSetlist))
      } catch (e) {
        console.error('Failed to load setlist', e)
      }
    }
  }, [])

  // 當歌單改變時自動同步回 LocalStorage
  useEffect(() => {
    localStorage.setItem('worship_setlist', JSON.stringify(setlist))
  }, [setlist])

  // Esc 關閉燈箱
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveSheetImages([])
    }
    if (activeSheetImages.length > 0) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSheetImages])

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
    const confirmDelete = window.confirm(`確定要刪除樂譜「${title}」嗎？`)
    if (!confirmDelete) return

    try {
      const { error } = await supabase.from('sheets').delete().eq('id', id)
      if (error) throw error

      setSheets((prev) => prev.filter((sheet) => sheet.id !== id))
      // 如果歌單裡也有，同步移除
      setSetlist((prev) => prev.filter((sheet) => sheet.id !== id))
      alert('刪除成功！')
    } catch (err: any) {
      alert('刪除失敗：' + (err.message || '未知錯誤'))
    }
  }

  // ----------------------------------------------------
  // 🎼 歌單操作邏輯 (新增、移除、排序、清除)
  // ----------------------------------------------------
  const addToSetlist = (sheet: Sheet) => {
    if (setlist.some((item) => item.id === sheet.id)) {
      alert('此樂譜已經在歌單中了！')
      return
    }
    setSetlist((prev) => [...prev, sheet])
    setIsSetlistOpen(true) // 自動展開歌單欄
  }

  const removeFromSetlist = (id: number) => {
    setSetlist((prev) => prev.filter((item) => item.id !== id))
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
    if (window.confirm('確定要清除今天的敬拜歌單嗎？')) {
      setSetlist([])
    }
  }

  const openModal = (sheet: Sheet) => {
    const pages = (sheet.image_urls && sheet.image_urls.length > 0) 
      ? sheet.image_urls 
      : [sheet.file_url]
    setActiveSheetImages(pages)
    setCurrentImageIndex(0)
  }

  // 關鍵字搜尋過濾
  const searchFilteredSheets = sheets.filter((sheet) => {
    const term = searchTerm.toLowerCase()
    const matchesTitle = sheet.title.toLowerCase().includes(term)
    const matchesKey = sheet.artist?.toLowerCase().includes(term) ?? false
    return matchesTitle || matchesKey
  })

  // 分類計數
  const countAll = searchFilteredSheets.length
  const countFast = searchFilteredSheets.filter((s) => s.tempo === 'fast').length
  const countSlow = searchFilteredSheets.filter((s) => s.tempo === 'slow').length
  const countUnclassified = searchFilteredSheets.filter(
    (s) => !s.tempo || (s.tempo !== 'fast' && s.tempo !== 'slow')
  ).length

  // 頁籤過濾
  const filteredSheets = searchFilteredSheets.filter((sheet) => {
    if (activeTab === 'fast') return sheet.tempo === 'fast'
    if (activeTab === 'slow') return sheet.tempo === 'slow'
    if (activeTab === 'unclassified') {
      return !sheet.tempo || (sheet.tempo !== 'fast' && sheet.tempo !== 'slow')
    }
    return true
  })

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', color: 'var(--text-primary)' }}>
      {/* 頂部 Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>🎼 樂譜庫</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Sheet Music Library</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setIsSetlistOpen(!isSetlistOpen)}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📋 當日歌單 ({setlist.length})
          </button>
          <Link 
            href="/upload" 
            style={{ 
              backgroundColor: '#0070f3', 
              color: 'white', 
              padding: '10px 18px', 
              borderRadius: '8px', 
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0, 112, 243, 0.25)',
            }}
          >
            + 上傳樂譜
          </Link>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)'
            }}
          >
            🔒 登出
          </button>
        </div>
      </header>

      {/* 📌 當日敬拜歌單展折區塊 (Setlist Drawer) */}
      {isSetlistOpen && (
        <div style={{
          backgroundColor: 'var(--card-bg)',
          border: '2px solid #8b5cf6',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '28px',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 今日敬拜歌單 ({setlist.length} 首)
            </h2>
            {setlist.length > 0 && (
              <button
                onClick={clearSetlist}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🗑️ 清除歌單
              </button>
            )}
          </div>

          {setlist.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, textAlign: 'center', padding: '16px 0' }}>
              歌單目前是空的！在下方樂譜卡片點擊「➕ 加至歌單」即可開始編排。
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {setlist.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--input-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: '800', fontSize: '15px', color: '#8b5cf6', width: '24px' }}>
                      #{index + 1}
                    </span>
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '15px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => openModal(item)}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                        🎵 Key: {item.artist || '未指定'} | {item.tempo === 'fast' ? '⚡快歌' : item.tempo === 'slow' ? '🌙慢歌' : '❓未分類'}
                      </span>
                    </div>
                  </div>

                  {/* 歌單功能按鈕：排序與刪除 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => openModal(item)}
                      style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#0070f3', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      放大開啟
                    </button>
                    <button
                      disabled={index === 0}
                      onClick={() => moveSetlistTrack(index, 'up')}
                      style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}
                      title="向上移"
                    >
                      ▲
                    </button>
                    <button
                      disabled={index === setlist.length - 1}
                      onClick={() => moveSetlistTrack(index, 'down')}
                      style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: index === setlist.length - 1 ? 'not-allowed' : 'pointer', opacity: index === setlist.length - 1 ? 0.3 : 1 }}
                      title="向下移"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => removeFromSetlist(item.id)}
                      style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                      title="移出歌單"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 搜尋欄 */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 搜尋樂譜名稱或調性 (例如：C, G, Am)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '15px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text-primary)',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* 分類頁籤 Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'all' ? '#0070f3' : 'var(--card-bg)',
            color: activeTab === 'all' ? 'white' : 'var(--text-secondary)'
          }}
        >
          🎵 全部 ({countAll})
        </button>

        <button
          onClick={() => setActiveTab('fast')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'fast' ? '#f59e0b' : 'var(--card-bg)',
            color: activeTab === 'fast' ? 'white' : 'var(--text-secondary)'
          }}
        >
          ⚡ 快歌 ({countFast})
        </button>

        <button
          onClick={() => setActiveTab('slow')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'slow' ? '#10b981' : 'var(--card-bg)',
            color: activeTab === 'slow' ? 'white' : 'var(--text-secondary)'
          }}
        >
          🌙 慢歌 ({countSlow})
        </button>

        <button
          onClick={() => setActiveTab('unclassified')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'unclassified' ? '#6b7280' : 'var(--card-bg)',
            color: activeTab === 'unclassified' ? 'white' : 'var(--text-secondary)'
          }}
        >
          ❓ 未分類 ({countUnclassified})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>載入樂譜庫中...</div>
      ) : filteredSheets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {searchTerm ? '找不到符合條件的樂譜' : '這個分類目前還沒有樂譜！'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {filteredSheets.map((sheet) => {
            const pageCount = sheet.image_urls?.length || 1
            const coverImage = (sheet.image_urls && sheet.image_urls.length > 0) ? sheet.image_urls[0] : sheet.file_url
            const isInSetlist = setlist.some((item) => item.id === sheet.id)

            return (
              <div 
                key={sheet.id} 
                style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  backgroundColor: 'var(--card-bg)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div 
                  style={{ position: 'relative', cursor: 'pointer', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}
                  onClick={() => openModal(sheet)}
                >
                  <img 
                    src={coverImage} 
                    alt={sheet.title} 
                    style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }} 
                  />
                  <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                    📄 {pageCount} 頁
                  </div>
                  
                  <div style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    left: '8px', 
                    backgroundColor: sheet.tempo === 'slow' 
                      ? 'rgba(16, 185, 129, 0.9)' 
                      : sheet.tempo === 'fast'
                      ? 'rgba(245, 158, 11, 0.9)'
                      : 'rgba(107, 114, 128, 0.9)', 
                    color: 'white', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: 'bold' 
                  }}>
                    {sheet.tempo === 'slow' ? '🌙 慢歌' : sheet.tempo === 'fast' ? '⚡ 快歌' : '❓ 未分類'}
                  </div>

                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    點擊放大
                  </div>
                </div>

                <div style={{ padding: '14px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', lineHeight: '1.3', color: 'var(--text-primary)' }}>{sheet.title}</h3>
                    <div style={{ display: 'inline-block', backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                      🎵 調性：{sheet.artist || '未指定'}
                    </div>
                  </div>

                  {/* 📌 新增：加至歌單按鈕 */}
                  <button
                    onClick={() => addToSetlist(sheet)}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: isInSetlist ? '#e9d5ff' : '#8b5cf6',
                      color: isInSetlist ? '#6b21a8' : 'white',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isInSetlist ? '✓ 已在歌單中' : '➕ 加至歌單'}
                  </button>

                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link 
                      href={`/edit/${sheet.id}`}
                      style={{ fontSize: '13px', color: '#0070f3', textDecoration: 'none', fontWeight: '600' }}
                    >
                      編輯
                    </Link>
                    <button
                      onClick={() => handleDelete(sheet.id, sheet.title)}
                      style={{ fontSize: '13px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' }}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 滿版燈箱 Modal */}
      {activeSheetImages.length > 0 && (
        <div 
          onClick={() => setActiveSheetImages([])}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 0,
            boxSizing: 'border-box'
          }}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setActiveSheetImages([])
            }}
            title="關閉全螢幕 (Esc)"
            style={{ 
              position: 'fixed', 
              top: '24px', 
              right: '24px', 
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              border: '2px solid #ffffff',
              color: '#ffffff', 
              fontSize: '28px', 
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)'
            }}
          >
            ✕
          </button>

          <div 
            style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeSheetImages[currentImageIndex]} 
              alt="樂譜內容" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none' }} 
            />
          </div>

          <div 
            style={{ 
              position: 'fixed',
              bottom: '20px',
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              padding: '8px 20px',
              borderRadius: '30px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              zIndex: 10001
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {activeSheetImages.length > 1 && (
              <button 
                onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                disabled={currentImageIndex === 0}
                style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: currentImageIndex === 0 ? 'rgba(255,255,255,0.1)' : '#0070f3', color: currentImageIndex === 0 ? '#888' : 'white', border: 'none', cursor: currentImageIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                ← 上頁
              </button>
            )}

            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              第 {currentImageIndex + 1} / {activeSheetImages.length} 頁
            </span>

            {activeSheetImages.length > 1 && (
              <button 
                onClick={() => setCurrentImageIndex(prev => Math.min(activeSheetImages.length - 1, prev + 1))}
                disabled={currentImageIndex === activeSheetImages.length - 1}
                style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: currentImageIndex === activeSheetImages.length - 1 ? 'rgba(255,255,255,0.1)' : '#0070f3', color: currentImageIndex === activeSheetImages.length - 1 ? '#888' : 'white', border: 'none', cursor: currentImageIndex === activeSheetImages.length - 1 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                下頁 →
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}