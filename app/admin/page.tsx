'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/Toast'
import type { User as AuthUser } from '@supabase/supabase-js'
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  LogOut,
  RefreshCw,
  Search,
  Edit3,
  X,
  Check,
  Mail,
  User,
  Trash2
} from 'lucide-react'
import { backLinkBaseClass, pageTitleClass, inputClass, loadingTextClass } from '@/utils/ui'

// 編輯 Modal 的欄位標籤
const MODAL_LABEL_CLASS = 'flex items-center gap-1.5 text-[13px] font-semibold mb-1.5'

interface UserProfile {
  id: string
  display_name: string | null
  email?: string | null
  is_approved: boolean
  is_admin?: boolean
  created_at?: string
  last_sign_in_at?: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('all')

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '尚未登入過'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

  const checkAdminAndFetchUsers = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setCurrentUser(session.user)

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (!myProfile?.is_admin) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setIsAdmin(true)

      const res = await fetch('/api/admin/users')
      const result = await res.json()

      if (result.error) throw new Error(result.error)

      setUsers(result.users || [])
    } catch (err) {
      console.error('Error fetching admin profiles:', err)
      toast.error('載入使用者資料失敗：' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [supabase, router, toast])

  useEffect(() => {
    // 函式內的 setState 都在 await 之後執行，不是同步呼叫（規則無法辨識 useCallback 內的 async 流程）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAdminAndFetchUsers()
  }, [checkAdminAndFetchUsers])

  // 手動重新整理（顯示載入中）
  const refreshUsers = () => {
    setLoading(true)
    checkAdminAndFetchUsers()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // 切換審核狀態
  const handleToggleApprove = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingId(userId)
      const nextStatus = !currentStatus

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isApproved: nextStatus })
      })

      const result = await res.json()
      if (result.error) throw new Error(result.error)

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: nextStatus } : u))
    } catch (err) {
      toast.error('操作失敗：' + (err as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  // 開啟編輯 Modal
  const startEditing = (user: UserProfile) => {
    setEditingUser(user)
    setEditDisplayName(user.display_name || '')
    setEditEmail(user.email || '')
  }

  // 儲存名稱與 Email
  const handleSaveUser = async () => {
    if (!editingUser) return
    try {
      setUpdatingId(editingUser.id)

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          displayName: editDisplayName,
          email: editEmail
        })
      })

      const result = await res.json()
      if (result.error) throw new Error(result.error)

      setUsers(prev => prev.map(u => u.id === editingUser.id ? { 
        ...u, 
        display_name: editDisplayName, 
        email: editEmail 
      } : u))

      setEditingUser(null)
      toast.success('更新使用者資料成功！')
    } catch (err) {
      toast.error('更新失敗：' + (err as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  // 刪除使用者
  const handleDeleteUser = async (user: UserProfile) => {
    const confirmText = user.display_name ? `「${user.display_name}」` : '此使用者'
    if (!window.confirm(`⚠️ 確定要徹底刪除 ${confirmText} 的帳號嗎？此動作無法復原！`)) {
      return
    }

    try {
      setUpdatingId(user.id)

      const res = await fetch(`/api/admin/users?userId=${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const result = await res.json()
      if (result.error) throw new Error(result.error)

      setUsers(prev => prev.filter(u => u.id !== user.id))
      toast.success('成功刪除使用者帳號！')
    } catch (err) {
      toast.error('刪除失敗：' + (err as Error).message)
      refreshUsers()
    } finally {
      setUpdatingId(null)
    }
  }

  // 搜尋與過濾
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.id.toLowerCase()).includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (filter === 'pending') return !user.is_approved
    if (filter === 'approved') return user.is_approved
    return true
  })

  if (loading) {
    return <div className={loadingTextClass}>驗證權限與載入資料中...</div>
  }

  if (!isAdmin) {
    return (
      <main className="max-w-[600px] mx-auto my-15 p-6 text-center">
        <h2 className="text-[20px] font-extrabold text-[#ef4444]">⚠️ 權限不足</h2>
        <p className="text-(--text-secondary) mt-3 mx-0 mb-6">
          當前帳號（{currentUser?.email}）非系統管理者，無法存取管理後台。
        </p>
        <Link href="/" className="px-[18px] py-2.5 rounded-[8px] bg-(--text-primary) text-(--background) no-underline">
          返回首頁
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-[850px] mx-auto my-10 p-6 text-(--text-primary)">
      {/* 頂部導覽 */}
      <div className="flex justify-between items-center mb-6">
        {/* 返回樂譜庫按鈕 */}
        <Link href="/" className={backLinkBaseClass}>
          <ArrowLeft size={16} />
          <span>返回樂譜庫</span>
        </Link>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[#ef4444] text-[13.5px] font-semibold cursor-pointer"
        >
          <LogOut size={15} />
          <span>手動登出</span>
        </button>
      </div>

      {/* 標題與重新整理 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={28} className="text-[#2563eb]" />
          <div>
            <h1 className={pageTitleClass}>波波貓的後台</h1>
            <p className="mt-1 mx-0 mb-0 text-[13px] text-(--text-secondary)">
              當前管理者：{currentUser?.email}
            </p>
          </div>
        </div>

        <button
          onClick={refreshUsers}
          title="重新整理"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border border-(--border-color) bg-(--card-bg) text-(--text-primary) cursor-pointer text-[13.5px] font-semibold"
        >
          <RefreshCw size={15} />
          <span>重新整理</span>
        </button>
      </div>

      {/* 搜尋與過濾 */}
      <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary)" />
          <input
            type="text"
            placeholder="搜尋名稱、Email 或 ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pr-3 pl-9 rounded-[8px] border border-(--border-color) bg-(--card-bg) text-(--text-primary) text-[14px] box-border"
          />
        </div>

        <div className="inline-flex bg-[#f1f5f9] p-1 rounded-[10px] gap-1">
          {[
            { id: 'all', label: '全部', count: users.length },
            { id: 'pending', label: '待審核', count: users.filter(u => !u.is_approved).length },
            { id: 'approved', label: '已審核', count: users.filter(u => u.is_approved).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`px-3 py-1.5 rounded-[6px] border-none text-[13px] cursor-pointer ${
                filter === tab.id
                  ? 'bg-(--card-bg) text-(--text-primary) font-bold'
                  : 'bg-transparent text-(--text-secondary) font-medium'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* 使用者卡片列表 */}
      <div className="flex flex-col gap-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-(--border-color) rounded-[12px] text-(--text-secondary)">
            目前沒有對應的使用者資料
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between px-5 py-4 bg-(--card-bg) border border-(--border-color) rounded-[12px] shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex-wrap gap-3"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-[240px]">
                <div
                  className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 ${
                    u.is_approved
                      ? 'bg-[rgba(16,185,129,0.1)] text-[#10b981]'
                      : 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
                  }`}
                >
                  {u.is_approved ? <CheckCircle2 size={22} /> : <Clock size={22} />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[15px]">
                      {u.display_name || '未填寫名稱'}
                    </span>
                    {u.is_admin && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] bg-[rgba(37,99,235,0.1)] text-[#2563eb] font-bold">
                        管理員
                      </span>
                    )}
                  </div>
                  {u.email && (
                    <div className="text-[12.5px] text-(--text-secondary) mt-0.5">
                      Mail: {u.email}
                    </div>
                  )}
                  <div className="text-[11.5px] text-(--text-secondary) mt-0.5">
                    ID: {u.id.substring(0, 18)}...
                  </div>
                  {/* 顯示最後登入時間 (Last Sign In At) */}
                  <div className="text-[12px] text-(--text-secondary) mt-1 flex gap-3">
                    <span>最後登入：<strong className="text-(--text-primary)">{formatDate(u.last_sign_in_at)}</strong></span>
                  </div>
                </div>
              </div>

              {/* 按鈕組 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEditing(u)}
                  title="修改名稱與 Email"
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-[8px] border border-(--border-color) bg-(--card-bg) text-(--text-primary) text-[13px] font-semibold cursor-pointer"
                >
                  <Edit3 size={15} />
                  <span>編輯</span>
                </button>

                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDeleteUser(u)}
                    disabled={updatingId === u.id}
                    title="徹底刪除使用者"
                    className="inline-flex items-center gap-1 h-9 px-2.5 rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] text-[#ef4444] text-[13px] font-semibold cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 size={15} />
                    <span>刪除</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleApprove(u.id, u.is_approved)}
                  disabled={updatingId === u.id}
                  className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] border-none text-white font-semibold text-[13px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                    u.is_approved ? 'bg-[#ef4444]' : 'bg-[#059669]'
                  }`}
                >
                  {u.is_approved ? (
                    <>
                      <UserX size={16} />
                      <span>取消開通 / 停權</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} />
                      <span>核准開通</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 編輯 Modal 對話框 */}
      {editingUser && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-[4px] flex items-center justify-center z-[9999] p-5">
          <div className="w-full max-w-[420px] bg-(--card-bg) border border-(--border-color) rounded-[16px] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="m-0 text-[18px] font-bold">修改使用者資料</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="bg-transparent border-none text-(--text-secondary) cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className={MODAL_LABEL_CLASS}>
                <User size={14} />
                <span>顯示名稱 / 姓名</span>
              </label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className={`${inputClass} text-[14px]`}
              />
            </div>

            <div className="mb-6">
              <label className={MODAL_LABEL_CLASS}>
                <Mail size={14} />
                <span>註冊 Email</span>
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className={`${inputClass} text-[14px]`}
              />
            </div>

            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-[8px] border border-(--border-color) bg-transparent text-(--text-primary) font-semibold text-[14px] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveUser}
                disabled={updatingId === editingUser.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] border-none bg-[#2563eb] text-white font-semibold text-[14px] cursor-pointer disabled:cursor-not-allowed"
              >
                <Check size={16} />
                <span>儲存變更</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
