// app/api/notify-admin/route.ts
// 由 Supabase Database Webhook 呼叫（新使用者註冊時），需在 header 帶上 Authorization: Bearer <NOTIFY_ADMIN_SECRET>
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export async function POST(req: Request) {
  // 驗證 webhook 密鑰（未設定時一律拒絕）
  const secret = process.env.NOTIFY_ADMIN_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { record } = await req.json() // 取得新註冊使用者的資料
    const email = escapeHtml(String(record?.email ?? '(未知)'))

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'ireneliu2006@gmail.com', // Admin 的接收信箱
      subject: '🎉 新使用者註冊通知',
      html: `<p>有新使用者註冊囉！</p><p>Email: ${email}</p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
