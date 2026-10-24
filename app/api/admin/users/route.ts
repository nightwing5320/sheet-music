import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is missing from environment variables.')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

// 1. 取得所有使用者 Profile 清單
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ users: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// 2. 更新使用者的審核狀態、名稱或 Email
export async function PATCH(request: Request) {
  try {
    const { userId, isApproved, displayName, email } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 📌 若有傳入 email，透過 Supabase Auth Admin API 更新登入 Email 與 profiles
    if (email !== undefined) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email })
      if (authError) throw authError

      // 同步更新 profiles 資料表的 email 欄位
      await supabaseAdmin
        .from('profiles')
        .update({ email })
        .eq('id', userId)
    }

    // 📌 更新 profiles 資料表 (is_approved, display_name)
    const updatePayload: Record<string, any> = {}
    if (isApproved !== undefined) updatePayload.is_approved = isApproved
    if (displayName !== undefined) updatePayload.display_name = displayName

    if (Object.keys(updatePayload).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)

      if (profileError) throw profileError
    }

    // 重新取得最新 profile 資料
    const { data: updatedProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    return NextResponse.json({ success: true, user: updatedProfile })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}