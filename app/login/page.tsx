// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false); // 控制登入/註冊狀態
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // 📌 新增：顯示名稱 State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isSignUp) {
      // 📌 註冊邏輯：將 display_name 寫入 Supabase Auth metadata
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
    } else {
      // 登入邏輯
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
            // 尚未審核通過 -> 強制登出並提示
            await supabase.auth.signOut();
            setMessage({ 
              type: 'error', 
              text: '您的帳號正在等待管理員審核中，通過後方可使用！' 
            });
            setLoading(false);
            return;
        }

        // 審核通過，進入系統
        router.push('/');
        router.refresh();
      }
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e9ecef',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '40px 32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* LOGO 圖示 */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '16px',
          backgroundColor: '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          marginBottom: '20px'
        }}>
          🎼
        </div>

        {/* 標題與副標題 */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '800',
          color: '#1f2937',
          margin: '0 0 4px 0',
          textAlign: 'center',
          letterSpacing: '-0.3px'
        }}>
          樂譜庫 Sheet Music Library
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#6b7280',
          margin: '0 0 28px 0',
          textAlign: 'center'
        }}>
          {isSignUp ? '建立新帳號以繼續' : '登入以繼續'}
        </p>

        {/* 提示訊息 */}
        {message && (
          <div style={{
            width: '100%',
            marginBottom: '20px',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: message.type === 'error' ? '#fee2e2' : '#d1fae5',
            color: message.type === 'error' ? '#dc2626' : '#059669',
            fontSize: '14px',
            boxSizing: 'border-box',
            textAlign: 'center'
          }}>
            {message.text}
          </div>
        )}

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* 📌 新增：顯示名稱輸入框（僅在切換至「註冊」時顯示） */}
          {isSignUp && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '700',
                color: '#374151'
              }}>
                顯示名稱 / 姓名 *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例如：大衛"
                required={isSignUp}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, background-color 0.2s'
                }}
              />
            </div>
          )}

          {/* Email 輸入框 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#374151'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '15px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, background-color 0.2s'
              }}
            />
          </div>

          {/* 密碼輸入框 */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#374151'
            }}>
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '15px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, background-color 0.2s'
              }}
            />
          </div>

          {/* 送出按鈕 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: '#1e3a8a',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '16px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
              transition: 'background-color 0.2s, transform 0.1s'
            }}
          >
            {loading ? '處理中...' : isSignUp ? '註冊帳號' : '登入'}
          </button>
        </form>

        {/* 切換按鈕 */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#111827',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            {isSignUp ? (
              <>已有帳號？ <span style={{ textDecoration: 'underline' }}>立即登入</span></>
            ) : (
              <>還沒有帳號？ <span style={{ textDecoration: 'underline' }}>立即註冊</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}