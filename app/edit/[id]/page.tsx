'use client'

import { useEffect, useState, use } from 'react'
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
  loadingTextClass,
} from '@/utils/ui'
import { ArrowLeft, Save, FileText } from 'lucide-react'

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [tempo, setTempo] = useState<string>('')
  const [fileUrl, setFileUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
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
      } catch (err) {
        toast.error('無法載入樂譜資料：' + (err as Error).message)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchSheetDetails()
  }, [id, supabase, router, toast])

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

      toast.success('更新成功！')
      router.push('/')
      router.refresh()
    } catch (err) {
      toast.error('儲存失敗：' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className={loadingTextClass}>載入中...</div>
  }

  return (
    <main className={formPageClass}>
      {/* 返回樂譜庫 */}
      <Link href="/" className={backLinkClass}>
        <ArrowLeft size={16} />
        <span>返回樂譜庫</span>
      </Link>

      <div className={pageTitleRowClass}>
        <FileText size={24} className="text-(--text-primary)" />
        <h1 className={pageTitleClass}>
          編輯樂譜資訊
        </h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {fileUrl && (
          <div className="rounded-[12px] overflow-hidden border border-(--border-color) bg-[#f8fafc] p-3">
            <img src={fileUrl} alt="樂譜圖檔" className="w-full max-h-[200px] object-contain rounded-[6px]" />
          </div>
        )}

        <div>
          <label className={labelClass}>
            樂譜名稱 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={`${inputClass} text-[15px]`}
          />
        </div>

        <div>
          <label className={labelClass}>
            調性（Key）
          </label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className={`${inputClass} text-[15px]`}
          />
        </div>

        {/* 速度分類選單 */}
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

        {/* 儲存按鈕 */}
        <button
          type="submit"
          disabled={saving}
          className={`${submitButtonClass} mt-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.1)]`}
        >
          <Save size={18} />
          <span>{saving ? '儲存中...' : '儲存變更'}</span>
        </button>
      </form>
    </main>
  )
}
