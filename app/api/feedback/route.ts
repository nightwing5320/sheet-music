// app/api/feedback/route.ts
// 使用者回報問題：存進 feedback 資料表，並寄 Email 通知管理員（proxy 已確認為已審核的登入使用者）
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/utils/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const CATEGORY_LABELS = { bug: '問題', suggestion: '建議', other: '其他' } as const
type Category = keyof typeof CATEGORY_LABELS

const MAX_MESSAGE_LENGTH = 2000

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const category: Category = body?.category in CATEGORY_LABELS ? body.category : 'other'
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  const screen = typeof body?.screen === 'string' ? body.screen.slice(0, 50) : null

  if (!message) return NextResponse.json({ error: '請填寫內容' }, { status: 400 })
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `內容請在 ${MAX_MESSAGE_LENGTH} 字以內` }, { status: 400 })
  }

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || '(未填寫)'
  const userAgent = req.headers.get('user-agent')?.slice(0, 300) ?? null

  const { error } = await supabase.from('feedback').insert({
    category,
    message,
    screen,
    user_agent: userAgent,
    display_name: displayName,
    email: user.email ?? null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 回報已存好；寄信失敗不影響結果
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'ireneliu2006@gmail.com', // Admin 的接收信箱
      subject: `📮 使用者回報（${CATEGORY_LABELS[category]}）：${displayName}`,
      html: [
        `<p><strong>${escapeHtml(displayName)}</strong>（${escapeHtml(user.email ?? '')}）回報了${CATEGORY_LABELS[category]}：</p>`,
        `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
        `<hr><p style="color:#64748b;font-size:12px">螢幕：${escapeHtml(screen ?? '-')}<br>裝置：${escapeHtml(userAgent ?? '-')}</p>`,
      ].join(''),
    })
  } catch (err) {
    console.error('Failed to send feedback email:', err)
  }

  return NextResponse.json({ success: true })
}
