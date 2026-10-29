// app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

// 確認呼叫者已登入且為管理員，否則回傳錯誤 Response
async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 用 service role 讀取，避免受 RLS 影響
  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is missing.')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

// 取得所有使用者 (整合 auth.users 的 last_sign_in_at 與 profiles)
export async function GET() {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const supabaseAdmin = getSupabaseAdmin()

    // 從 Auth Admin API 抓取所有 Auth 帳號 (包含 last_sign_in_at, email, created_at)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) throw authError

    // 從 profiles 資料表抓取審核資訊 (is_approved, is_admin, display_name)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')

    if (profileError) throw profileError

    // 建立 Profiles 快速 Lookup Map
    const profileMap = new Map(profileData.map(p => [p.id, p]))

    // 組合 Auth Users 與 Profile 資料
    const combinedUsers = authData.users.map(user => {
      const profile = profileMap.get(user.id) || {}
      return {
        id: user.id,
        email: user.email,
        display_name: profile.display_name || null,
        is_approved: profile.is_approved ?? false,
        is_admin: profile.is_admin ?? false,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || null // 取得 Supabase 後台原生記錄的時間
      }
    })

    // 按最後登入時間（或註冊時間）排序
    combinedUsers.sort((a, b) => {
      const dateA = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0
      const dateB = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0
      return dateB - dateA
    })

    return NextResponse.json({ users: combinedUsers })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// 更新使用者資料 (is_approved / display_name / email)，只更新有傳入的欄位
export async function PATCH(request: Request) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const { userId, isApproved, displayName, email } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Email 存在 auth.users，需透過 Auth Admin API 更新
    if (typeof email === 'string' && email.trim()) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: email.trim(),
        email_confirm: true
      })
      if (authError) throw authError
    }

    // 2. 審核狀態與顯示名稱存在 profiles 資料表
    const profileUpdates: Record<string, unknown> = {}
    if (typeof isApproved === 'boolean') profileUpdates.is_approved = isApproved
    if (typeof displayName === 'string') profileUpdates.display_name = displayName.trim() || null

    let data = null
    if (Object.keys(profileUpdates).length > 0) {
      const { data: rows, error } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)
        .select()

      if (error) throw error
      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: '找不到此使用者的 profile 資料' }, { status: 404 })
      }
      data = rows[0]
    }

    return NextResponse.json({ success: true, user: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. 刪除 profiles 資料表紀錄
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    // 2. 刪除 auth.users 帳號
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    // 即使 auth.users 之前在後台已經被手動刪除過，這裡也安全忽略
    if (authError && !authError.message.includes('User not found')) {
      throw authError
    }

    // 3. 📌 必須明確回傳 JSON 格式
    return NextResponse.json({ success: true, userId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}