'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/Toast'
import {
  formPageClass,
  backLinkClass,
  pageTitleRowClass,
  pageTitleClass,
  cardClass,
  labelClass,
  inputClass,
  buttonBaseClass,
  submitButtonClass,
  loadingTextClass,
} from '@/utils/ui'
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
  const toast = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        setUserEmail(user.email || '')

        // 讀取 profiles 表中的資料
        const { data } = await supabase
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

    fetchProfile()
  }, [supabase, router])

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

      toast.success('個人資料更新成功！')
      router.refresh()
      router.push('/')      
    } catch (err) {
      toast.error('更新失敗：' + (err as Error).message)
    } finally {
      setSavingProfile(false)
    }
  }

  // 2. 修改密碼
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.info('兩次輸入的新密碼不相符！')
      return
    }

    setSavingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success('密碼修改成功！')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error('密碼修改失敗：' + (err as Error).message)
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return <div className={loadingTextClass}>載入個人資料中...</div>
  }

  return (
    <main className={formPageClass}>
      {/* 返回樂譜庫按鈕 */}
      <Link href="/" className={backLinkClass}>
        <ArrowLeft size={16} />
        <span>返回樂譜庫</span>
      </Link>

      {/* 主標題 */}
      <div className={pageTitleRowClass}>
        <User size={26} className="text-(--text-primary)" />
        <h1 className={pageTitleClass}>個人資料設定</h1>
      </div>

      {/* 基本資料卡片 */}
      <div className={`${cardClass} mb-6`}>
        <div className="flex items-center gap-2 mb-5">
          <UserCheck size={20} className="text-(--text-primary)" />
          <h2 className="m-0 text-[18px] font-bold">修改基本資料</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1.5 text-[13px] font-medium">
              帳號 Email
            </label>
            <input
              type="text"
              value={userEmail}
              disabled
              className="w-full px-3 py-2.5 rounded-[8px] border border-(--border-color) bg-[#939393ca] text-(--text-secondary) box-border opacity-70 cursor-not-allowed"
            />
          </div>

          <div>
            <label className={labelClass}>
              顯示名稱
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="例如：大衛"
              className={inputClass}
            />
          </div>

          <button type="submit" disabled={savingProfile} className={`${submitButtonClass} mt-1`}>
            <Save size={18} />
            <span>{savingProfile ? '儲存中...' : '儲存顯示名稱'}</span>
          </button>
        </form>
      </div>

      {/* 修改密碼卡片 */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-5">
          <KeyRound size={20} className="text-(--text-primary)" />
          <h2 className="m-0 text-[18px] font-bold">重設密碼</h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>
              新密碼
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="至少 6 位數"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              確認新密碼
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="再次輸入新密碼"
              className={inputClass}
            />
          </div>

          {/* 柔和翡翠綠代表安全動作 */}
          <button type="submit" disabled={savingPassword} className={`${buttonBaseClass} bg-[#059669] text-white mt-1`}>
            <Lock size={18} />
            <span>{savingPassword ? '更新中...' : '更新密碼'}</span>
          </button>
        </form>
      </div>
    </main>
  )
}
