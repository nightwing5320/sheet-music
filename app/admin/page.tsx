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
  Search
} from 'lucide-react'

interface UserProfile {
  id: string
  display_name: string | null
  email?: string | null
  is_approved: boolean
  is_admin?: boolean
  created_at?: string
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')

  useEffect(() => {
    checkAdminAndFetchUsers()
  }, [])

  // 檢查 Session 並獲取使用者列表
  const checkAdminAndFetchUsers = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setCurrentUser(session.user)

      // 讀取所有 profiles 資料
      const { data, error } = await supabase
        .from('profiles')
        .select('*')

      if (error) throw error

      setUsers(data || [])
    } catch (err: any) {
      console.error('Error fetching admin data:', err)
      alert('載入使用者資料失敗：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 手動登出邏輯
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // 切換帳號審核狀態 (Approve / Revoke)
  const handleToggleApprove = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingId(userId)
      const nextStatus = !currentStatus

      // 直接更新 Supabase profiles 資料表
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: nextStatus })
        .eq('id', userId)

      if (error) throw error

      // 同步更新前端 State
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: nextStatus } : u))
    } catch (err: any) {
      alert('更新審核狀態失敗：' + err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  // 篩選與搜尋
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.id.toLowerCase()).includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (filter === 'pending') return !user.is_approved
    if (filter === 'approved') return user.is_approved
    return true
  })

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary, #64748b)' }}>
        載入管理後台資料中...
      </div>
    )
  }

  return (
    <main style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', color: 'var(--text-primary, #0f172a)' }}>
      
      {/* 頂部導覽 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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
        >
          <ArrowLeft size={16} />
          <span>返回樂譜庫</span>
        </Link>

        {/* 手動登出按鈕 */}
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
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <LogOut size={15} />
          <span>手動登出</span>
        </button>
      </div>

      {/* 標題區 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={28} style={{ color: '#2563eb' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>樂譜管理後台 - 帳號審核</h1>
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

      {/* 搜尋與篩選列 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #64748b)' }} />
          <input
            type="text"
            placeholder="搜尋名稱或 ID..."
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
            { id: 'pending', label: '待審核', count: users.filter(u => !u.is_approved).length },
            { id: 'approved', label: '已審核', count: users.filter(u => u.is_approved).length },
            { id: 'all', label: '全部', count: users.length }
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
                cursor: 'pointer',
                boxShadow: filter === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* 使用者審核列表 */}
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
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: u.is_approved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: u.is_approved ? '#10b981' : '#f59e0b'
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
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                    User ID: {u.id.substring(0, 18)}...
                  </div>
                </div>
              </div>

              {/* 操作開通 / 停權按鈕 */}
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
                  opacity: updatingId === u.id ? 0.6 : 1,
                  transition: 'all 0.2s ease'
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
          ))
        )}
      </div>
    </main>
  )
}