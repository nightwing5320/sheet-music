'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Sheet {
  id: number
  title: string
  artist: string | null
  file_url: string
  image_urls?: string[] | null
  created_at: string
}

export default function Home() {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [activeSheetImages, setActiveSheetImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchSheets()
  }, [])

  const fetchSheets = async () => {
    try {
      const { data, error } = await supabase
        .from('sheets')
        .select('id, title, artist, file_url, image_urls, created_at')
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

  // 登出邏輯
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

  const filteredSheets = sheets.filter((sheet) => {
    const term = searchTerm.toLowerCase()
    const matchesTitle = sheet.title.toLowerCase().includes(term)
    const matchesKey = sheet.artist?.toLowerCase().includes(term) ?? false
    return matchesTitle || matchesKey
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
      <div style={{ marginBottom: '24px' }}>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>載入樂譜庫中...</div>
      ) : filteredSheets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{searchTerm ? '找不到符合條件的樂譜' : '目前還沒有樂譜，點擊右上角新增吧！'}</p>
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

      {/* 燈箱 Modal */}
      {activeSheetImages.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <button 
            onClick={() => setActiveSheetImages([])}
            style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer' }}
          >
            ✕
          </button>

          <img 
            src={activeSheetImages[currentImageIndex]} 
            alt="樂譜內容" 
            style={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }} 
          />

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '20px', color: 'white' }}>
            {activeSheetImages.length > 1 && (
              <button 
                onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                disabled={currentImageIndex === 0}
                style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: currentImageIndex === 0 ? '#444' : '#0070f3', color: 'white', border: 'none', cursor: currentImageIndex === 0 ? 'not-allowed' : 'pointer' }}
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
                style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: currentImageIndex === activeSheetImages.length - 1 ? '#444' : '#0070f3', color: 'white', border: 'none', cursor: currentImageIndex === activeSheetImages.length - 1 ? 'not-allowed' : 'pointer' }}
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