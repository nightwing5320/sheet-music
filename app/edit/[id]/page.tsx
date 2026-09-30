'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSheetDetails()
  }, [id])

  const fetchSheetDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('sheets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        setTitle(data.title || '')
        setArtist(data.artist || '')
        setFileUrl(data.file_url || '')
      }
    } catch (err: any) {
      alert('無法載入樂譜資料：' + err.message)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const { error } = await supabase
        .from('sheets')
        .update({ title, artist })
        .eq('id', id)

      if (error) throw error

      alert('更新成功！')
      router.push('/')
      router.refresh()
    } catch (err: any) {
      alert('儲存失敗：' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>載入中...</div>
  }

  return (
    <main style={{ maxWidth: '520px', margin: '40px auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '20px', display: 'inline-block' }}>
        ← 返回樂譜庫
      </Link>

      <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>編輯樂譜資訊</h1>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {fileUrl && (
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <img src={fileUrl} alt="樂譜圖檔" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>樂譜名稱 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>調性（Key）</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            backgroundColor: saving ? '#94a3b8' : '#0070f3',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '700',
            marginTop: '10px',
            boxShadow: '0 2px 8px rgba(0, 112, 243, 0.25)'
          }}
        >
          {saving ? '儲存中...' : '儲存變更'}
        </button>
      </form>
    </main>
  )
}