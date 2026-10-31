'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/Toast'
import {
  formPageClass,
  backLinkClass,
  pageTitleRowClass,
  pageTitleClass,
  labelClass,
  inputClass,
  selectClass,
  submitButtonClass,
} from '@/utils/ui'
import { isPdfFile, pdfToImages } from '@/utils/pdfToImages'
import { compressImage } from '@/utils/compressImage'
import { 
  ArrowLeft, 
  PlusCircle, 
  UploadCloud, 
  Layers, 
  Upload,
  Loader2
} from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [keyName, setKeyName] = useState('')
  const [tempo, setTempo] = useState<string>('')
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  // PDF 轉換或圖片壓縮進度，例如「轉換 PDF 中 (2/5)…」；null 表示未在處理
  const [convertingText, setConvertingText] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    // 依選取順序展開：PDF 拆成每頁圖片，圖片先縮小再上傳
    const pages: File[] = []
    try {
      for (const [index, file] of selectedFiles.entries()) {
        if (isPdfFile(file)) {
          setConvertingText('轉換 PDF 中...')
          const images = await pdfToImages(file, (page, total) => setConvertingText(`轉換 PDF 中 (${page}/${total})...`))
          pages.push(...images)

          // 尚未填寫名稱時，以 PDF 檔名作為預設樂譜名稱
          setTitle((prev) => prev || file.name.replace(/\.pdf$/i, ''))
        } else {
          setConvertingText(`處理圖片中 (${index + 1}/${selectedFiles.length})...`)
          pages.push(await compressImage(file))
        }
      }
    } catch (err) {
      console.error('PDF conversion failed:', err)
      const message = (err as Error).name === 'PasswordException' ? '此 PDF 有密碼保護，無法轉換' : (err as Error).message
      toast.error('PDF 轉換失敗：' + message)
      return
    } finally {
      setConvertingText(null)
    }

    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setFiles(pages)
    setPreviewUrls(pages.map((file) => URL.createObjectURL(file)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0 || !title) {
      toast.info('請填寫樂譜名稱並至少選擇一張樂譜圖片或 PDF！')
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

      toast.success('樂譜上傳成功！')
      router.push('/')
      router.refresh()
    } catch (error) {
      toast.error('上傳失敗：' + ((error as Error).message || '未知錯誤'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className={formPageClass}>
      {/* 返回樂譜庫按鈕 */}
      <Link href="/" className={backLinkClass}>
        <ArrowLeft size={16} />
        <span>返回樂譜庫</span>
      </Link>

      {/* 頁面標題 */}
      <div className={pageTitleRowClass}>
        <PlusCircle size={26} className="text-(--text-primary)" />
        <h1 className={pageTitleClass}>新增樂譜</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 樂譜名稱 */}
        <div>
          <label className={labelClass}>
            樂譜名稱 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="例如：主我在此敬拜"
            className={`${inputClass} text-[15px]`}
          />
        </div>

        {/* 調性 */}
        <div>
          <label className={labelClass}>
            調性 (Key)
          </label>
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="例如：C, G, D, Am"
            className={`${inputClass} text-[15px]`}
          />
        </div>

        {/* 速度分類 */}
        <div>
          <label className={labelClass}>
            速度分類
          </label>
          <select
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            className={`${selectClass} text-[15px]`}
          >
            <option value="">未分類</option>
            <option value="fast">快歌</option>
            <option value="slow">慢歌</option>
          </select>
        </div>

        {/* 上傳區域 */}
        <div>
          <label className={labelClass}>
            樂譜圖片 / PDF *
          </label>
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center px-4 py-8 border-2 border-dashed border-(--border-color) rounded-[16px] bg-(--card-bg) text-center transition-all duration-200 box-border ${
              convertingText ? 'cursor-wait opacity-70' : 'cursor-pointer hover:border-[#2563eb] hover:bg-[rgba(37,99,235,0.03)]'
            }`}
          >
            {convertingText ? (
              <Loader2 size={38} className="text-[#2563eb] mb-2.5 animate-spin" />
            ) : (
              <UploadCloud size={38} className="text-(--text-secondary) mb-2.5" />
            )}
            <span className="text-[15px] font-semibold text-[#2563eb] mb-1">
              {convertingText ?? '點擊選擇樂譜圖片或 PDF'}
            </span>
            <span className="text-[12px] text-(--text-secondary)">
              支援多頁上傳：可複選多張圖片，PDF 會自動拆成每一頁
            </span>
            <input
              id="file-upload"
              type="file"
              accept="image/*,application/pdf,.pdf"
              multiple
              onChange={handleFileChange}
              required={files.length === 0}
              disabled={!!convertingText}
              className="hidden"
            />
          </label>
        </div>

        {/* 預覽選擇的頁數 */}
        {previewUrls.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Layers size={15} className="text-(--text-secondary)" />
              <p className="m-0 text-[13px] font-semibold text-(--text-secondary)">
                已選取 {previewUrls.length} 頁樂譜：
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2.5">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative border border-(--border-color) rounded-[8px] overflow-hidden">
                  <img src={url} alt={`頁面 ${index + 1}`} className="w-full h-[90px] object-cover block" />
                  <span className="absolute bottom-1 right-1 bg-[rgba(15,23,42,0.75)] text-white px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold backdrop-blur-[4px]">
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
          disabled={uploading || !!convertingText}
          className={`${submitButtonClass} mt-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]`}
        >
          <Upload size={18} />
          <span>{uploading ? `上傳中 (${previewUrls.length} 頁)...` : '確認上傳'}</span>
        </button>
      </form>
    </main>
  )
}
