'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import {
  formPageClass,
  backLinkClass,
  pageTitleRowClass,
  pageTitleClass,
  cardClass,
  labelClass,
  inputClass,
  submitButtonClass,
} from '@/utils/ui'
import { ArrowLeft, MessageSquareWarning, Send } from 'lucide-react'

const CATEGORIES = [
  { id: 'bug', label: '問題' },
  { id: 'suggestion', label: '建議' },
  { id: 'other', label: '其他' },
] as const

const MAX_MESSAGE_LENGTH = 2000

export default function FeedbackPage() {
  const router = useRouter()
  const toast = useToast()
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['id']>('bug')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      toast.info('請填寫內容')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message,
          screen: `${window.innerWidth}×${window.innerHeight}`,
        }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result.error || '送出失敗')

      toast.success('已送出，謝謝你的回報！')
      router.push('/')
    } catch (err) {
      toast.error('送出失敗：' + (err as Error).message)
      setSending(false)
    }
  }

  return (
    <main className={formPageClass}>
      <Link href="/" className={backLinkClass}>
        <ArrowLeft size={16} />
        <span>返回樂譜庫</span>
      </Link>

      <div className={pageTitleRowClass}>
        <MessageSquareWarning size={26} className="text-(--text-primary)" />
        <h1 className={pageTitleClass}>回報問題</h1>
      </div>

      <form onSubmit={handleSubmit} className={`${cardClass} flex flex-col gap-4`}>
        <div>
          <label className={labelClass}>類型</label>
          <div className="flex gap-2">
            {CATEGORIES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                aria-pressed={category === id}
                className={`h-[36px] px-4 rounded-[18px] text-[14px] font-semibold cursor-pointer transition-all duration-200 border ${
                  category === id
                    ? 'bg-(--text-primary) text-(--background) border-(--text-primary)'
                    : 'bg-transparent text-(--text-secondary) border-(--border-color) hover:text-(--text-primary)'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="feedback-message" className={labelClass}>
            內容
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={'發生了什麼事？在哪一頁、做了什麼操作？\n例如：在平板上放大樂譜寫筆記後，關掉再打開筆記位置跑掉'}
            className={`${inputClass} resize-y leading-relaxed`}
          />
          <p className="mt-1.5 mb-0 text-[12px] text-(--text-secondary)">
            會一併附上你的名稱、裝置與瀏覽器資訊，方便找出問題。
          </p>
        </div>

        <button type="submit" disabled={sending} className={submitButtonClass}>
          <Send size={17} />
          <span>{sending ? '送出中...' : '送出'}</span>
        </button>
      </form>
    </main>
  )
}
