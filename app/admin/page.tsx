'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
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
  const supabase = createClient()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('all')

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  useEffect(() => {
    checkAdminAndFetchUsers()
  }, [])

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

  const checkAdminAndFetchUsers = async () => {
    try {
      setLoading(true)
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
    } catch (err: any) {
      console.error('Error fetching admin profiles:', err)
      alert('載入使用者資料失敗：' + err.message)
    } finally {
      setLoading(false)
    }
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
    } catch (err: any) {
      alert('操作失敗：' + err.message)
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
      alert('更新使用者資料成功！')
    } catch (err: any) {
      alert('更新失敗：' + err.message)
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
        method: 'DELETE'
      })

      const result = await res.json()
      if (result.error) throw new Error(result.error)

      setUsers(prev => prev.filter(u => u.id !== user.id))
      alert('成功刪除使用者帳號！')
    } catch (err: any) {
      alert('刪除失敗：' + err.message)
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
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary, #64748b)' }}>
        驗證權限與載入資料中...
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <main style={{ maxWidth: '600px', margin: '60px auto', padding: '24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>⚠️ 權限不足</h2>
        <p style={{ color: 'var(--text-secondary, #64748b)', margin: '12px 0 24px 0' }}>
          當前帳號（{currentUser?.email}）非系統管理者，無法存取管理後台。
        </p>
        <Link href="/" style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: 'var(--text-primary)', color: 'var(--background)', textDecoration: 'none' }}>
          返回首頁
        </Link>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '850px', margin: '40px auto', padding: '24px', color: 'var(--text-primary, #0f172a)' }}>
      
      {/* 頂部導覽 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.color = '#2563eb'
            e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)'
            e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)'
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.color = 'var(--text-secondary, #64748b)'
            e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <ArrowLeft size={16} />
          <span>返回樂譜庫</span>
        </Link>

        <button
          onClick={handleLogout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <LogOut size={15} />
          <span>手動登出</span>
        </button>
      </div>

      {/* 標題與重新整理 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={28} style={{ color: '#2563eb' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>波波貓的後台</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
              當前管理者：{currentUser?.email}
            </p>
          </div>
        </div>

        <button
          onClick={checkAdminAndFetchUsers}
          title="重新整理"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #e2e8f0)',
            backgroundColor: 'var(--card-bg, #ffffff)',
            color: 'var(--text-primary, #0f172a)',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: '600'
          }}
        >
          <RefreshCw size={15} />
          <span>重新整理</span>
        </button>
      </div>

      {/* 搜尋與過濾 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #64748b)' }} />
          <input
            type="text"
            placeholder="搜尋名稱、Email 或 ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              backgroundColor: 'var(--card-bg, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-secondary, #f1f5f9)', padding: '4px', borderRadius: '10px', gap: '4px' }}>
          {[
            { id: 'all', label: '全部', count: users.length },
            { id: 'pending', label: '待審核', count: users.filter(u => !u.is_approved).length },
            { id: 'approved', label: '已審核', count: users.filter(u => u.is_approved).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: filter === tab.id ? 'var(--card-bg, #ffffff)' : 'transparent',
                color: filter === tab.id ? 'var(--text-primary, #0f172a)' : 'var(--text-secondary, #64748b)',
                fontWeight: filter === tab.id ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* 使用者卡片列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-color, #cbd5e1)', borderRadius: '12px', color: 'var(--text-secondary, #64748b)' }}>
            目前沒有對應的使用者資料
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div 
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                backgroundColor: 'var(--card-bg, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: u.is_approved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: u.is_approved ? '#10b981' : '#f59e0b',
                  flexShrink: 0
                }}>
                  {u.is_approved ? <CheckCircle2 size={22} /> : <Clock size={22} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>
                      {u.display_name || '未填寫名稱'}
                    </span>
                    {u.is_admin && (
                      <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontWeight: '700' }}>
                        管理員
                      </span>
                    )}
                  </div>
                  {u.email && (
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                      Mail: {u.email}
                    </div>
                  )}
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                    ID: {u.id.substring(0, 18)}...
                  </div>
                  {/* 顯示最後登入時間 (Last Sign In At) */}
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                    <span>最後登入：<strong style={{ color: 'var(--text-primary, #0f172a)' }}>{formatDate(u.last_sign_in_at)}</strong></span>
                  </div>
                </div>
              </div>

              {/* 按鈕組 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => startEditing(u)}
                  title="修改名稱與 Email"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '36px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    backgroundColor: 'var(--card-bg, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={15} />
                  <span>編輯</span>
                </button>

                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDeleteUser(u)}
                    disabled={updatingId === u.id}
                    title="徹底刪除使用者"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: updatingId === u.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Trash2 size={15} />
                    <span>刪除</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleApprove(u.id, u.is_approved)}
                  disabled={updatingId === u.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '36px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: u.is_approved ? '#ef4444' : '#059669',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: updatingId === u.id ? 'not-allowed' : 'pointer',
                    opacity: updatingId === u.id ? 0.6 : 1
                  }}
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
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color, #cbd5e1)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>修改使用者資料</h3>
              <button 
                onClick={() => setEditingUser(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                <User size={14} />
                <span>顯示名稱 / 姓名</span>
              </label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: 'var(--card-bg, #ffffff)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                <Mail size={14} />
                <span>註冊 Email</span>
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: 'var(--card-bg, #ffffff)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingUser(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveUser}
                disabled={updatingId === editingUser.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: updatingId === editingUser.id ? 'not-allowed' : 'pointer'
                }}
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