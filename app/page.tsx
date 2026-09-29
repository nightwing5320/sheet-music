'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

interface Sheet {
  id: number
  title: string
  artist: string | null
  file_url: string
  created_at: string
}

export default function Home() {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>樂譜庫 Sheet Music Library</h1>
        <Link 
          href="/upload" 
          style={{ 
            backgroundColor: '#0070f3', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '6px', 
            textDecoration: 'none' 
          }}
        >
          + 上傳樂譜
        </Link>
      </header>

      {loading ? (
        <p>載入中...</p>
      ) : sheets.length === 0 ? (
        <p style={{ color: '#666' }}>目前還沒有樂譜，點擊右上角新增吧！</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {sheets.map((sheet) => (
            <div 
              key={sheet.id} 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '12px', 
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <img 
                src={sheet.file_url} 
                alt={sheet.title} 
                style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} 
              />
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{sheet.title}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{sheet.artist || '未知創作者'}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}