// app/api/notify-admin/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { record } = await req.json() // 取得新註冊使用者的資料

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'ireneliu2006@gmail.com', // Admin 的接收信箱
      subject: '🎉 新使用者註冊通知',
      html: `<p>有新使用者註冊囉！</p><p>Email: ${record.email}</p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}