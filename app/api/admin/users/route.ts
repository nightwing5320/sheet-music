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

    if (email !== undefined) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email })
      if (authError) throw authError

      await supabaseAdmin
        .from('profiles')
        .update({ email })
        .eq('id', userId)
    }

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

// 3. 📌 新增：刪除使用者帳號
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 從 Supabase Auth 中刪除使用者（CASCADE 會自動清空 profiles 資料）
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}