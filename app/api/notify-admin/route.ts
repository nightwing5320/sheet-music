// app/api/notify-admin/route.ts
// 由 Supabase Database Webhook 呼叫（新使用者註冊時），需在 header 帶上 Authorization: Bearer <NOTIFY_ADMIN_SECRET>
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

// 註冊名稱：優先使用 profiles 列上的 display_name，
// 若建立當下尚未寫入，改從 Auth 的 user_metadata（註冊表單填寫的名稱）讀取
async function getDisplayName(record: { id?: string; display_name?: string | null } | undefined) {
  if (record?.display_name) return record.display_name
  if (!record?.id) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { data } = await supabaseAdmin.auth.admin.getUserById(record.id)
    return (data.user?.user_metadata?.display_name as string | undefined) || null
  } catch (err) {
    console.error('Failed to look up display name:', err)
    return null
  }
}

export async function POST(req: Request) {
  // 驗證 webhook 密鑰（未設定時一律拒絕）
  const secret = process.env.NOTIFY_ADMIN_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { record } = await req.json() // 取得新註冊使用者的資料（profiles 新增的那一列）
    const email = escapeHtml(String(record?.email ?? '(未知)'))
    const displayName = escapeHtml(await getDisplayName(record) || '(未填寫)')

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'ireneliu2006@gmail.com', // Admin 的接收信箱
      subject: `🎉 新使用者註冊通知：${displayName}`,
      html: `<p>有新使用者註冊囉！</p><p>名稱: ${displayName}</p><p>Email: ${email}</p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
