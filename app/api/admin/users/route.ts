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
      .order('updated_at', { ascending: false }) // 📌 修正：將 created_at 改為 updated_at

    if (error) throw error

    return NextResponse.json({ users: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// 2. 更新使用者的審核狀態 (is_approved)
export async function PATCH(request: Request) {
  try {
    const { userId, isApproved } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_approved: isApproved })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, user: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}