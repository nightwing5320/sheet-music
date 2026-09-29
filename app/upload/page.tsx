'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [instrument, setInstrument] = useState('吉他')
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files || files.length === 0) return alert('請選擇至少一張樂譜照片！')

    setUploading(true)
    const imageUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${i}.${fileExt}`

        // 上傳到 Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('music-sheets')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // 取得公開下載網址
        const { data: publicUrlData } = supabase.storage
          .from('music-sheets')
          .getPublicUrl(fileName)

        imageUrls.push(publicUrlData.publicUrl)
      }

      // 寫入 Database
      const { error: dbError } = await supabase
        .from('sheets')
        .insert([{ title, artist, instrument, image_urls: imageUrls }])

      if (dbError) throw dbError

      alert('樂譜上傳成功！')
      router.push('/')
    } catch (error: any) {
      alert('上傳失敗：' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">上傳新樂譜照片</h1>
      <form onSubmit={handleUpload} className="space-y-4 text-gray-700">
        <div>
          <label className="block text-sm font-medium mb-1">歌名</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：晴天"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">歌手/創作者</label>
          <input
            type="text"
            required
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：周杰倫"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">樂器種類</label>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="吉他">吉他</option>
            <option value="鋼琴">鋼琴</option>
            <option value="烏克麗麗">烏克麗麗</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">選擇樂譜照片 (可多選)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(e.target.files)}
            className="w-full p-1 border rounded"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? '上傳中...' : '確定上傳'}
        </button>
      </form>
    </div>
  )
}