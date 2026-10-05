'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeft, 
  PlusCircle, 
  UploadCloud, 
  FileImage, 
  Layers, 
  Upload 
} from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [keyName, setKeyName] = useState('')
  const [tempo, setTempo] = useState<string>('')
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
    
    const urls = selectedFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0 || !title) {
      alert('請填寫樂譜名稱並至少選擇一張樂譜圖片！')
      return
    }

    try {
      setUploading(true)
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_page${i + 1}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
        const filePath = `uploads/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('music-sheets')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('music-sheets')
          .getPublicUrl(filePath)

        uploadedUrls.push(urlData.publicUrl)
      }

      const { error: dbError } = await supabase
        .from('sheets')
        .insert([{ 
          title, 
          artist: keyName, 
          tempo: tempo || null,
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
    <main style={{ maxWidth: '520px', margin: '40px auto', padding: '24px', color: 'var(--text-primary, #0f172a)' }}>
      
      {/* 返回樂譜庫按鈕 */}
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
      
      {/* 頁面標題 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <PlusCircle size={26} style={{ color: 'var(--text-primary, #0f172a)' }} />
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>新增樂譜</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 樂譜名稱 */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
            樂譜名稱 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="例如：主我在此敬拜"
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color, #cbd5e1)', 
              backgroundColor: 'var(--card-bg, #ffffff)', 
              color: 'var(--text-primary, #0f172a)', 
              fontSize: '15px', 
              boxSizing: 'border-box' 
            }}
          />
        </div>

        {/* 調性 */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
            調性 (Key)
          </label>
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="例如：C, G, D, Am"
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color, #cbd5e1)', 
              backgroundColor: 'var(--card-bg, #ffffff)', 
              color: 'var(--text-primary, #0f172a)', 
              fontSize: '15px', 
              boxSizing: 'border-box' 
            }}
          />
        </div>

        {/* 速度分類 */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
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
              backgroundColor: 'var(--card-bg, #ffffff)', 
              color: 'var(--text-primary, #0f172a)', 
              fontSize: '15px', 
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
          >
            <option value="">未分類</option>
            <option value="fast">快歌</option>
            <option value="slow">慢歌</option>
          </select>
        </div>

        {/* 上傳區域 */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
            樂譜圖片 *
          </label>
          <label 
            htmlFor="file-upload"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              border: '2px dashed var(--border-color, #cbd5e1)',
              borderRadius: '16px',
              backgroundColor: 'var(--card-bg, #ffffff)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2563eb'
              e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.03)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color, #cbd5e1)'
              e.currentTarget.style.backgroundColor = 'var(--card-bg, #ffffff)'
            }}
          >
            <UploadCloud size={38} style={{ color: 'var(--text-secondary, #64748b)', marginBottom: '10px' }} />
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#2563eb', marginBottom: '4px' }}>
              點擊選擇樂譜圖片
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
              支援多頁上傳（可在相簿或檔案中複選多張圖）
            </span>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              required={files.length === 0}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* 預覽選擇的頁數 */}
        {previewUrls.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Layers size={15} style={{ color: 'var(--text-secondary, #64748b)' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary, #64748b)' }}>
                已選取 {previewUrls.length} 頁樂譜：
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px' }}>
              {previewUrls.map((url, index) => (
                <div key={index} style={{ position: 'relative', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={url} alt={`頁面 ${index + 1}`} style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }} />
                  <span style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: 'rgba(15, 23, 42, 0.75)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
                    P.{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提交按鈕 */}
        <button
          type="submit"
          disabled={uploading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: uploading ? 'var(--text-secondary, #94a3b8)' : 'var(--text-primary, #1e293b)',
            color: 'var(--background, #ffffff)',
            height: '42px',
            borderRadius: '10px',
            border: 'none',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            marginTop: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload size={18} />
          <span>{uploading ? `上傳中 (${previewUrls.length} 頁)...` : '確認上傳'}</span>
        </button>
      </form>
    </main>
  )
}