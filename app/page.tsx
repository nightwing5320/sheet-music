'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

interface Sheet {
  id: number
  title: string
  artist: string | null // 資料庫中依然對應 artist 欄位，但前端顯示為調性
  file_url: string
  created_at: string
}

export default function Home() {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchSheets()
  }, [])

  const fetchSheets = async () => {
    try {
      const { data, error } = await supabase
        .from('sheets')
        .select('id, title, artist, file_url, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching sheets:', error)
      } else if (data) {
        setSheets(data)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
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

  const filteredSheets = sheets.filter((sheet) => {
    const term = searchTerm.toLowerCase()
    const matchesTitle = sheet.title.toLowerCase().includes(term)
    const matchesKey = sheet.artist?.toLowerCase().includes(term) ?? false
    return matchesTitle || matchesKey
  })

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>🎼 樂譜庫</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px'}}>Sheet Music Library</p>
        </div>
        <Link 
          href="/upload" 
          style={{ 
            backgroundColor: '#0070f3', 
            color: 'white', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0, 112, 243, 0.25)',
          }}
        >
          + 上傳新樂譜
        </Link>
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
            border: '1px solid #e2e8f0',
            outline: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>載入樂譜庫中...</div>
      ) : filteredSheets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b', margin: 0 }}>{searchTerm ? '找不到符合條件的樂譜' : '目前還沒有樂譜，點擊右上角新增吧！'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {filteredSheets.map((sheet) => (
            <div 
              key={sheet.id} 
              style={{ 
                border: '1px solid #edf2f7', 
                borderRadius: '12px', 
                overflow: 'hidden',
                backgroundColor: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div 
                style={{ position: 'relative', cursor: 'pointer', backgroundColor: '#f1f5f9', overflow: 'hidden' }}
                onClick={() => setSelectedImage(sheet.file_url)}
              >
                <img 
                  src={sheet.file_url} 
                  alt={sheet.title} 
                  style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }} 
                />
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                  點擊放大
                </div>
              </div>
              <div style={{ padding: '14px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', lineHeight: '1.3' }}>{sheet.title}</h3>
                  <div style={{ display: 'inline-block', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                    🎵 調性：{sheet.artist || '未指定'}
                  </div>
                </div>
                
                {/* 編輯與刪除按鈕 */}
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          ))}
        </div>
      )}

      {/* 燈箱 Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={selectedImage} 
            alt="樂譜大圖" 
            style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: '8px' }} 
          />
        </div>
      )}
    </main>
  )
}