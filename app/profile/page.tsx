'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { 
  ArrowLeft, 
  User, 
  UserCheck, 
  KeyRound, 
  Save, 
  Lock 
} from 'lucide-react'

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
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary, #64748b)' }}>
        載入個人資料中...
      </div>
    )
  }

  return (
    <main style={{ maxWidth: '520px', margin: '40px auto', padding: '24px', color: 'var(--text-primary, #0f172a)' }}>
      
      {/* 返回樂譜庫按鈕 */}
      <Link 
        href="/" 
        style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary, #64748b)', 
          textDecoration: 'none', 
          fontSize: '14px', 
          fontWeight: '500', 
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #e2e8f0)',
          marginBottom: '24px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#2563eb'
          e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)'
          e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary, #64748b)'
          e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)'
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <ArrowLeft size={16} />
        <span>返回樂譜庫</span>
      </Link>

      {/* 主標題 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <User size={26} style={{ color: 'var(--text-primary, #0f172a)' }} />
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>個人資料設定</h1>
      </div>

      {/* 基本資料卡片 */}
      <div style={{ 
        backgroundColor: 'var(--card-bg, #ffffff)', 
        border: '1px solid var(--border-color, #e2e8f0)', 
        borderRadius: '16px', 
        padding: '24px', 
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <UserCheck size={20} style={{ color: 'var(--text-primary, #0f172a)' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>修改基本資料</h2>
        </div>
        
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary, #64748b)', fontWeight: '500' }}>
              帳號 Email
            </label>
            <input
              type="text"
              value={userEmail}
              disabled
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color, #e2e8f0)', 
                backgroundColor: 'var(--bg-secondary, #f1f5f9)', 
                color: '#64748b', 
                boxSizing: 'border-box',
                opacity: 0.7,
                cursor: 'not-allowed'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
              顯示名稱
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="例如：大衛"
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color, #cbd5e1)', 
                backgroundColor: 'var(--card-bg, #ffffff)', 
                color: 'var(--text-primary, #0f172a)', 
                boxSizing: 'border-box' 
              }}
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '42px', 
              borderRadius: '10px', 
              backgroundColor: savingProfile ? 'var(--text-secondary, #94a3b8)' : 'var(--text-primary, #1e293b)', 
              color: 'var(--background, #ffffff)', 
              border: 'none', 
              fontWeight: '600', 
              fontSize: '15px',
              cursor: savingProfile ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '4px'
            }}
          >
            <Save size={18} />
            <span>{savingProfile ? '儲存中...' : '儲存顯示名稱'}</span>
          </button>
        </form>
      </div>

      {/* 修改密碼卡片 */}
      <div style={{ 
        backgroundColor: 'var(--card-bg, #ffffff)', 
        border: '1px solid var(--border-color, #e2e8f0)', 
        borderRadius: '16px', 
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <KeyRound size={20} style={{ color: 'var(--text-primary, #0f172a)' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>重設密碼</h2>
        </div>

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
              新密碼
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="至少 6 位數"
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color, #cbd5e1)', 
                backgroundColor: 'var(--card-bg, #ffffff)', 
                color: 'var(--text-primary, #0f172a)', 
                boxSizing: 'border-box' 
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
              確認新密碼
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="再次輸入新密碼"
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color, #cbd5e1)', 
                backgroundColor: 'var(--card-bg, #ffffff)', 
                color: 'var(--text-primary, #0f172a)', 
                boxSizing: 'border-box' 
              }}
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '42px', 
              borderRadius: '10px', 
              backgroundColor: savingPassword ? 'var(--text-secondary, #94a3b8)' : '#059669', // 柔和翡翠綠代表安全動作
              color: '#ffffff', 
              border: 'none', 
              fontWeight: '600', 
              fontSize: '15px',
              cursor: savingPassword ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '4px'
            }}
          >
            <Lock size={18} />
            <span>{savingPassword ? '更新中...' : '更新密碼'}</span>
          </button>
        </form>
      </div>
    </main>
  )
}