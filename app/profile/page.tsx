'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserEmail(user.email || '')

      // 讀取 profiles 表中的資料
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      if (data) {
        setDisplayName(data.display_name || user.user_metadata?.display_name || '')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  // 1. 修改顯示名稱
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 更新 Supabase profiles 資料表
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id)

      if (dbError) throw dbError

      // 同步更新 Auth metadata
      await supabase.auth.updateUser({
        data: { display_name: displayName }
      })

      alert('個人資料更新成功！')
      router.refresh()
      router.push('/')      
    } catch (err: any) {
      alert('更新失敗：' + err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  // 2. 修改密碼
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('兩次輸入的新密碼不相符！')
      return
    }

    setSavingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      alert('密碼修改成功！')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      alert('密碼修改失敗：' + err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>載入個人資料中...</div>
  }

  return (
    <main style={{ maxWidth: '520px', margin: '40px auto', padding: '24px', color: 'var(--text-primary)' }}>
      <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '20px', display: 'inline-block' }}>
        ← 返回樂譜庫
      </Link>

      <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>👤 個人資料設定</h1>

      {/* 基本資料卡片 */}
      <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>修改基本資料</h2>
        
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>帳號 Email</label>
            <input
              type="text"
              value={userEmail}
              disabled
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--border-color)', color: 'var(--text-secondary)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>顯示名稱</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="例如：大衛"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#0070f3', color: 'white', border: 'none', fontWeight: '700', cursor: savingProfile ? 'not-allowed' : 'pointer' }}
          >
            {savingProfile ? '儲存中...' : '儲存顯示名稱'}
          </button>
        </form>
      </div>

      {/* 修改密碼卡片 */}
      <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>重設密碼</h2>

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>新密碼</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="至少 6 位數"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>確認新密碼</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="再次輸入新密碼"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', fontWeight: '700', cursor: savingPassword ? 'not-allowed' : 'pointer' }}
          >
            {savingPassword ? '更新中...' : '更新密碼'}
          </button>
        </form>
      </div>
    </main>
  )
}