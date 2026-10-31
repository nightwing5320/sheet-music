// app/auth/callback/route.ts
// Email 連結（例如重設密碼）回到此處：用網址中的 code 換取登入 session，再導向 next 頁面
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // 只允許站內路徑，避免被導向外部網站
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
    console.error('Failed to exchange auth code:', error.message)
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalid`)
}
