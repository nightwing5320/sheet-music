'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  Music2, 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2,
  Piano,
  ArrowLeft
} from 'lucide-react';

export default function LoginPage() {
  // 模式 State：'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 1. 忘記密碼模式
    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile`, // 使用者點擊信件連結後跳轉重設密碼的頁面
      });

      if (error) {
        setMessage({ type: 'error', text: error.message || '發送重設郵件失敗，請檢查 Email 是否正確！' });
      } else {
        setMessage({ 
          type: 'success', 
          text: '重設密碼信件已發送！請至您的 Email 信箱查看並點擊連結。' 
        });
      }
      setLoading(false);
      return;
    }

    // 2. 註冊模式
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message || '註冊失敗，請重試！' });
      } else {
        setMessage({ type: 'success', text: '註冊成功！您的帳號需等待管理員審核通過後方可登入使用。' });
      }
      setLoading(false);
      return;
    }

    // 3. 登入模式
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ type: 'error', text: '帳號或密碼錯誤！' });
      setLoading(false);
      return;
    } 

    if (user) {
      // 檢查是否已獲得管理員審核
      const { data: profile } = await supabase
          .from('profiles')
          .select('is_approved')
          .eq('id', user.id)
          .single();

      if (!profile || !profile.is_approved) {
          await supabase.auth.signOut();
          setMessage({ 
            type: 'error', 
            text: '您的帳號正在等待管理員審核中，通過後方可使用！' 
          });
          setLoading(false);
          return;
      }

      router.push('/');
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background, #0f172a)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        padding: '36px 28px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        {/* LOGO 圖示 */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {mode === 'forgot' ? (
            <KeyRound size={32} style={{ color: 'var(--text-primary)' }} />
          ) : (
            <Piano size={32} style={{ color: 'var(--text-primary)' }} />
          )}
        </div>

        {/* 標題與副標題 */}
        <h1 style={{
          fontSize: '22px',
          fontWeight: '800',
          color: 'var(--text-primary, #0f172a)',
          margin: '0 0 6px 0',
          textAlign: 'center',
          letterSpacing: '-0.3px'
        }}>
          {mode === 'forgot' ? '重設密碼' : '樂譜庫 Sheet Music Library'}
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary, #64748b)',
          margin: '0 0 24px 0',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {mode === 'forgot' 
            ? '請輸入註冊時的 Email，我們將寄送重設連結給您' 
            : mode === 'signup' 
            ? '建立新帳號以繼續' 
            : '登入以繼續'}
        </p>

        {/* 提示訊息 */}
        {message && (
          <div style={{
            width: '100%',
            marginBottom: '20px',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
            color: message.type === 'error' ? '#ef4444' : '#10b981',
            fontSize: '13.5px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {message.type === 'error' ? (
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* 顯示名稱輸入框（僅註冊時顯示） */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px',
                fontSize: '13.5px',
                fontWeight: '600',
                color: 'var(--text-primary, #0f172a)'
              }}>
                <User size={15} style={{ color: 'var(--text-secondary, #64748b)' }} />
                <span>顯示名稱 / 姓名 *</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例如：大衛"
                required={mode === 'signup'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '15px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: 'var(--card-bg, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>
          )}

          {/* Email 輸入框 */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
              fontSize: '13.5px',
              fontWeight: '600',
              color: 'var(--text-primary, #0f172a)'
            }}>
              <Mail size={15} style={{ color: 'var(--text-secondary, #64748b)' }} />
              <span>Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'var(--card-bg, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          {/* 密碼輸入框 (非忘記密碼模式才顯示) */}
          {mode !== 'forgot' && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: 'var(--text-primary, #0f172a)'
                }}>
                  <Lock size={15} style={{ color: 'var(--text-secondary, #64748b)' }} />
                  <span>密碼</span>
                </label>

                {/* 忘記密碼按鈕 */}
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setMessage(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    忘記密碼？
                  </button>
                )}
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '15px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: 'var(--card-bg, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>
          )}

          {/* 送出按鈕 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '42px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '10px',
              backgroundColor: loading ? 'var(--text-secondary, #94a3b8)' : 'var(--text-primary, #1e293b)',
              color: 'var(--background, #ffffff)',
              fontWeight: '600',
              fontSize: '15px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <span>處理中...</span>
            ) : mode === 'forgot' ? (
              <>
                <KeyRound size={18} />
                <span>發送重設信件</span>
              </>
            ) : mode === 'signup' ? (
              <>
                <UserPlus size={18} />
                <span>註冊帳號</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>登入</span>
              </>
            )}
          </button>
        </form>

        {/* 切換模式按鈕區塊 */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setMessage(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #64748b)',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 8px',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeft size={15} />
              <span>返回登入頁面</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setMessage(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #64748b)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '4px 8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary, #64748b)'}
            >
              {mode === 'signup' ? (
                <>已有帳號？ <span style={{ fontWeight: '700', textDecoration: 'underline' }}>立即登入</span></>
              ) : (
                <>還沒有帳號？ <span style={{ fontWeight: '700', textDecoration: 'underline' }}>立即註冊</span></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}