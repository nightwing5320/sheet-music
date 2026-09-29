'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function UploadPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) {
      alert('請填寫樂譜名稱並選擇圖片！')
      return
    }

    try {
      setUploading(true)

      // 1. 上傳圖片到 Supabase Storage (sheet-music bucket)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('sheet-music')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // 2. 取得圖片公開 URL
      const { data: urlData } = supabase.storage
        .from('sheet-music')
        .getPublicUrl(filePath)

      const fileUrl = urlData.publicUrl

      // 3. 寫入資料庫記錄 (sheets table)
      const { error: dbError } = await supabase
        .from('sheets')
        .insert([
          {
            title: title,
            artist: artist,
            file_url: fileUrl,
          },
        ])

      if (dbError) {
        throw dbError
      }

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
    <main style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
        ← 返回首頁
      </Link>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>上傳新樂譜</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>樂譜名稱 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="例如：Op. 9 No. 2 夜曲"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>創作者 / 歌手</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="例如：蕭邦 Chopin"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>樂譜圖片 *</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            style={{ width: '100%' }}
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          style={{
            backgroundColor: uploading ? '#ccc' : '#0070f3',
            color: 'white',
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {uploading ? '上傳中...' : '確認上傳'}
        </button>
      </form>
    </main>
  )
}