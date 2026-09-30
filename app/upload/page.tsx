'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function UploadPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [keyName, setKeyName] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  // 1. 處理多檔案選擇
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
    
    // 建立每一頁的本地預覽圖網址
    const urls = selectedFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)
  }

  // 2. 表單提交上傳
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0 || !title) {
      alert('請填寫樂譜名稱並至少選擇一張樂譜圖片！')
      return
    }

    try {
      setUploading(true)
      const uploadedUrls: string[] = []

      // 迴圈處理每一張選取的圖片
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_page${i + 1}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
        const filePath = `uploads/${fileName}`

        // 上傳至 music-sheets bucket
        const { error: uploadError } = await supabase.storage
          .from('music-sheets')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // 取得公開 URL
        const { data: urlData } = supabase.storage
          .from('music-sheets')
          .getPublicUrl(filePath)

        uploadedUrls.push(urlData.publicUrl)
      }

      // 寫入資料庫：同時寫入 file_url (第一頁) 與 image_urls (所有頁數陣列)
      const { error: dbError } = await supabase
        .from('sheets')
        .insert([{ 
          title, 
          artist: keyName, 
          file_url: uploadedUrls[0], 
          image_urls: uploadedUrls 
        }])

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
    <main style={{ maxWidth: '520px', margin: '40px auto', padding: '24px', color: 'var(--text-primary)' }}>
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
            placeholder="例如：主我在此敬拜"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '15px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>調性 (Key)</label>
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="例如：C, G, D, Am"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '15px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>樂譜圖片（可一次選取多張）*</label>
          <input
            type="file"
            accept="image/*"
            multiple // 👈 關鍵：必須加上 multiple 才能在手機/電腦上複選圖片
            onChange={handleFileChange}
            required
            style={{ width: '100%', fontSize: '14px' }}
          />
        </div>

        {/* 預覽選擇的頁數 */}
        {previewUrls.length > 0 && (
          <div>
            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>已選取 {previewUrls.length} 頁樂譜：</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px' }}>
              {previewUrls.map((url, index) => (
                <div key={index} style={{ position: 'relative', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                  <img src={url} alt={`頁面 ${index + 1}`} style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                    P.{index + 1}
                  </span>
                </div>
              ))}
            </div>
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
          {uploading ? `上傳中 (${previewUrls.length} 頁)...` : '確認上傳'}
        </button>
      </form>
    </main>
  )
}