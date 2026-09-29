'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function UploadPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [keyName, setKeyName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile))
    } else {
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) {
      alert('請填寫樂譜名稱並選擇樂譜圖片！')
      return
    }

    try {
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('sheet-music')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('sheet-music')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from('sheets')
        .insert([{ title, artist: keyName, file_url: urlData.publicUrl }])

      if (dbError) throw dbError

      alert('樂譜上傳成功！')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      alert('上傳失敗：' + (error.message || '未知錯誤'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <main style={{ maxWidth: '520px', margin: '40px auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '20px', display: 'inline-block' }}>
        ← 返回樂譜庫
      </Link>
      
      <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>新增樂譜</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>樂譜名稱 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="例如：卡農 Canon in D"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>調性 (Key)</label>
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="例如：C, G, D, Am, F#"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>樂譜圖片 *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            style={{ width: '100%', fontSize: '14px' }}
          />
        </div>

        {previewUrl && (
          <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <img src={previewUrl} alt="預覽圖片" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', backgroundColor: '#f8fafc' }} />
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          style={{
            backgroundColor: uploading ? '#94a3b8' : '#0070f3',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '700',
            marginTop: '10px',
            boxShadow: '0 2px 8px rgba(0, 112, 243, 0.25)'
          }}
        >
          {uploading ? '檔案上傳中...' : '確認上傳'}
        </button>
      </form>
    </main>
  )
}