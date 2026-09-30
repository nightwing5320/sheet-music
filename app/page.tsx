'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Sheet {
  id: number
  title: string
  artist: string | null
  tempo?: 'fast' | 'slow' | string | null // 快歌 / 慢歌 分類
  file_url: string
  image_urls?: string[] | null
  created_at: string
}

export default function Home() {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'fast' | 'slow'>('all') // 當前選中的分類
  
  const [activeSheetImages, setActiveSheetImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchSheets()
  }, [])

  // 支援 Esc 鍵關閉全螢幕燈箱
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSheetImages([])
      }
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

      if (error) {
        console.error('Error fetching sheets:', error)
      } else if (data) {
        setSheets(data as Sheet[])
      }
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
      alert('刪除成功！')
    } catch (err: any) {
      alert('刪除失敗：' + (err.message || '未知錯誤'))
    }
  }

  const openModal = (sheet: Sheet) => {
    const pages = (sheet.image_urls && sheet.image_urls.length > 0) 
      ? sheet.image_urls 
      : [sheet.file_url]
    setActiveSheetImages(pages)
    setCurrentImageIndex(0)
  }

  // 1. 關鍵字搜尋過濾
  const searchFilteredSheets = sheets.filter((sheet) => {
    const term = searchTerm.toLowerCase()
    const matchesTitle = sheet.title.toLowerCase().includes(term)
    const matchesKey = sheet.artist?.toLowerCase().includes(term) ?? false
    return matchesTitle || matchesKey
  })

  // 2. 計算各分類的樂譜數量 (基於搜尋後的結果)
  const countAll = searchFilteredSheets.length
  const countFast = searchFilteredSheets.filter((s) => s.tempo === 'fast').length
  const countSlow = searchFilteredSheets.filter((s) => s.tempo === 'slow').length

  // 3. 依據頁籤 (Tab) 篩選出最終顯示的樂譜
  const filteredSheets = searchFilteredSheets.filter((sheet) => {
    if (activeTab === 'fast') return sheet.tempo === 'fast'
    if (activeTab === 'slow') return sheet.tempo === 'slow'
    return true // 'all' 顯示全部
  })

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', color: 'var(--text-primary)' }}>
      {/* 頂部標題與功能按鈕 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>🎼 樂譜庫</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Sheet Music Library</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
            + 上傳新樂譜
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
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
              transition: 'background-color 0.2s'
            }}
          >
            🔒 登出
          </button>
        </div>
      </header>

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
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* 📌 快歌 / 慢歌 分類頁籤 (Tabs) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
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
            color: activeTab === 'all' ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.2s'
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
            backgroundColor: activeTab === 'fast' ? '#f59e0b' : 'var(--card-bg)', // 橙黃色代表快歌
            color: activeTab === 'fast' ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.2s'
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
            backgroundColor: activeTab === 'slow' ? '#10b981' : 'var(--card-bg)', // 綠色代表慢歌
            color: activeTab === 'slow' ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.2s'
          }}
        >
          🌙 慢歌 ({countSlow})
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
                  
                  {/* 分類標籤 (快歌 / 慢歌) */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    left: '8px', 
                    backgroundColor: sheet.tempo === 'slow' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(245, 158, 11, 0.9)', 
                    color: 'white', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: 'bold' 
                  }}>
                    {sheet.tempo === 'slow' ? '🌙 慢歌' : '⚡ 快歌'}
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
                  
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* 全螢幕滿版燈箱 Modal */}
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
          {/* 📌 右上角顯眼退出按鈕 */}
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

          {/* 滿版圖片 */}
          <div 
            style={{ 
              width: '100vw', 
              height: '100vh', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeSheetImages[currentImageIndex]} 
              alt="樂譜內容" 
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                userSelect: 'none'
              }} 
            />
          </div>

          {/* 底部導覽切換 */}
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
                style={{ 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  backgroundColor: currentImageIndex === 0 ? 'rgba(255,255,255,0.1)' : '#0070f3', 
                  color: currentImageIndex === 0 ? '#888' : 'white', 
                  border: 'none', 
                  cursor: currentImageIndex === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
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
                style={{ 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  backgroundColor: currentImageIndex === activeSheetImages.length - 1 ? 'rgba(255,255,255,0.1)' : '#0070f3', 
                  color: currentImageIndex === activeSheetImages.length - 1 ? '#888' : 'white', 
                  border: 'none', 
                  cursor: currentImageIndex === activeSheetImages.length - 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
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