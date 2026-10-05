'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { ArrowLeft, Save, Music, Zap, Moon, HelpCircle, FileText } from 'lucide-react'

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [tempo, setTempo] = useState<string>('')
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
        setTempo(data.tempo || '')
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
        .update({ 
          title, 
          artist, 
          tempo: tempo || null 
        })
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
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary, #64748b)' }}>
        載入中...
      </div>
    )
  }

  return (
    <main style={{ maxWidth: '520px', margin: '40px auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 📌 返回樂譜庫 (Ghost 風格 Hover 效果) */}
      <Link 
        href="/" 
        style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary, #64748b)', 
          textDecoration: 'none', 
          fontSize: '14px', 
          fontWeight: '500', 
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #e2e8f0)',
          marginBottom: '24px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#2563eb'
          e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)'
          e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary, #64748b)'
          e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)'
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <ArrowLeft size={16} />
        <span>返回樂譜庫</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <FileText size={24} style={{ color: 'var(--text-primary, #0f172a)' }} />
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-primary, #0f172a)' }}>
          編輯樂譜資訊
        </h1>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {fileUrl && (
          <div style={{ 
            borderRadius: '12px', 
            overflow: 'hidden', 
            border: '1px solid var(--border-color, #e2e8f0)', 
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            padding: '12px'
          }}>
            <img src={fileUrl} alt="樂譜圖檔" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '6px' }} />
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>
            樂譜名稱 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color, #cbd5e1)', 
              fontSize: '15px', 
              boxSizing: 'border-box',
              backgroundColor: 'var(--card-bg, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>
            調性（Key）
          </label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color, #cbd5e1)', 
              fontSize: '15px', 
              boxSizing: 'border-box',
              backgroundColor: 'var(--card-bg, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
            }}
          />
        </div>

        {/* 📌 速度分類選單 */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>
            速度分類
          </label>
          <select
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              fontSize: '15px',
              boxSizing: 'border-box',
              backgroundColor: 'var(--card-bg, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              cursor: 'pointer'
            }}
          >
            <option value="">未分類</option>
            <option value="fast">快歌</option>
            <option value="slow">慢歌</option>
          </select>
        </div>

        {/* 📌 儲存按鈕 */}
        <button
          type="submit"
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: saving ? 'var(--text-secondary, #94a3b8)' : 'var(--text-primary, #1e293b)',
            color: 'var(--background, #ffffff)',
            height: '42px',
            borderRadius: '10px',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            marginTop: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
          }}
        >
          <Save size={18} />
          <span>{saving ? '儲存中...' : '儲存變更'}</span>
        </button>
      </form>
    </main>
  )
}