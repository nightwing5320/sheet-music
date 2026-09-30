// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false); // 控制登入/註冊狀態
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isSignUp) {
      // 註冊邏輯
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message || '註冊失敗，請重試！' });
      } else {
        setMessage({ type: 'success', text: '註冊成功！如果已設定驗證信箱，請至信箱點擊確認信。' });
      }
    } else {
      // 登入邏輯
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ type: 'error', text: '帳號或密碼錯誤！' });
      } else {
        router.push('/'); // 登入成功進入樂譜庫
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
      backgroundColor: '#e9ecef', // 與圖片相同的淺灰背景
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        borderRadius: '24px', // 圓角卡片
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
                color: '#111827', // 明確設定文字顏色，防止白字
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
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '15px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                color: '#111827', // 明確設定文字顏色
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, background-color 0.2s'
              }}
            />
          </div>

          {/* 送出按鈕 (深藍色底) */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: '#1e3a8a', // 與圖片相同的經典深藍色
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

        {/* 底部「還沒有帳號？立即註冊」與切換連結 */}
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