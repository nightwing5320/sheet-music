'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function EditSheet() {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [tempo, setTempo] = useState<string>('') // 速度分類 state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const router = useRouter()
  const params = useParams()
  const id = params?.id
  const supabase = createClient()

  useEffect(() => {
    if (id) fetchSheet()
  }, [id])

  const fetchSheet = async () => {
    try {
      const { data, error } = await supabase
        .from('sheets')
        .select('title, artist, tempo')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setTitle(data.title || '')
        setArtist(data.artist || '')
        setTempo(data.tempo || '') // 載入資料庫中的 tempo 值
      }
    } catch (err: any) {
      alert('讀取樂譜資料失敗：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('sheets')
        .update({
          title,
          artist,
          tempo: tempo || null, // 若未選擇或選「未分類」，存入 null
        })
        .eq('id', id)

      if (error) throw error

      alert('更新成功！')
      router.push('/')
      router.refresh()
    } catch (err: any) {
      alert('更新失敗：' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>載入中...</div>

  return (
    <main style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>✏️ 編輯樂譜</h1>
      
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>樂譜名稱：</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box' 
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>調性 / 原唱：</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box' 
            }}
          />
        </div>

        {/* 📌 快慢歌分類選擇欄位 */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>速度分類：</label>
          <select
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
          >
            <option value="">❓ 未分類</option>
            <option value="fast">⚡ 快歌</option>
            <option value="slow">🌙 慢歌</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '8px', 
              backgroundColor: '#0070f3', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0, 112, 243, 0.25)'
            }}
          >
            {saving ? '儲存中...' : '儲存變更'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '8px', 
              backgroundColor: 'var(--card-bg)', 
              color: 'var(--text-secondary)', 
              border: '1px solid var(--border-color)', 
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            取消
          </button>
        </div>
      </form>
    </main>
  )
}