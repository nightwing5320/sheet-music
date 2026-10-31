'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
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
import { inputClass, submitButtonClass } from '@/utils/ui';

// 登入表單的標籤與輸入框
const LOGIN_LABEL_CLASS = 'flex items-center gap-1.5 text-[13.5px] font-semibold text-(--text-primary)';
const LOGIN_INPUT_CLASS = `${inputClass} text-[15px] outline-none transition-all duration-200`;

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

    // 忘記密碼模式
    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // 信件連結先到 /auth/callback 換取登入 session，再跳轉至 /profile 重設密碼
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
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

    // 註冊模式
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

    // 登入模式
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
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', user.id)
          .select('is_approved')
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
    <div className="min-h-screen flex items-center justify-center bg-(--background) p-5 [font-family:system-ui,-apple-system,sans-serif]">
      <div className="w-full max-w-[420px] bg-(--card-bg) border border-(--border-color) rounded-[16px] px-7 py-9 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex flex-col items-center box-border">
        {/* LOGO 圖示 */}
        <div className="w-16 h-16 rounded-[16px] bg-(--card-bg) border border-(--border-color) flex items-center justify-center mb-5">
          {mode === 'forgot' ? (
            <KeyRound size={32} className="text-(--text-primary)" />
          ) : (
            <Piano size={32} className="text-(--text-primary)" />
          )}
        </div>

        {/* 標題與副標題 */}
        <h1 className="text-[22px] font-extrabold text-(--text-primary) mt-0 mx-0 mb-1.5 text-center tracking-[-0.3px]">
          {mode === 'forgot' ? '重設密碼' : '樂譜庫 Sheet Music Library'}
        </h1>
        <p className="text-[14px] text-(--text-secondary) mt-0 mx-0 mb-6 text-center font-medium">
          {mode === 'forgot' 
            ? '請輸入註冊時的 Email，我們將寄送重設連結給您' 
            : mode === 'signup' 
            ? '建立新帳號以繼續' 
            : '登入以繼續'}
        </p>

        {/* 提示訊息 */}
        {message && (
          <div
            className={`w-full mb-5 px-3.5 py-3 rounded-[10px] text-[13.5px] box-border flex items-center gap-2 border ${
              message.type === 'error'
                ? 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-[#ef4444]'
                : 'bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)] text-[#10b981]'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle size={18} className="shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} className="w-full">
          {/* 顯示名稱輸入框（僅註冊時顯示） */}
          {mode === 'signup' && (
            <div className="mb-[18px]">
              <label className={`${LOGIN_LABEL_CLASS} mb-1.5`}>
                <User size={15} className="text-(--text-secondary)" />
                <span>顯示名稱 / 姓名 *</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例如：大衛"
                required={mode === 'signup'}
                className={LOGIN_INPUT_CLASS}
              />
            </div>
          )}

          {/* Email 輸入框 */}
          <div className="mb-[18px]">
            <label className={`${LOGIN_LABEL_CLASS} mb-1.5`}>
              <Mail size={15} className="text-(--text-secondary)" />
              <span>Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="David@example.com"
              required
              className={LOGIN_INPUT_CLASS}
            />
          </div>

          {/* 密碼輸入框 (非忘記密碼模式才顯示) */}
          {mode !== 'forgot' && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <label className={LOGIN_LABEL_CLASS}>
                  <Lock size={15} className="text-(--text-secondary)" />
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
                    className="bg-transparent border-none text-[#2563eb] text-[12.5px] font-semibold cursor-pointer p-0"
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
                className={LOGIN_INPUT_CLASS}
              />
            </div>
          )}

          {/* 送出按鈕 */}
          <button
            type="submit"
            disabled={loading}
            className={`${submitButtonClass} w-full shadow-[0_2px_8px_rgba(0,0,0,0.08)]`}
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
        <div className="mt-5 text-center">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setMessage(null);
              }}
              className="inline-flex items-center gap-1.5 bg-transparent border-none text-(--text-secondary) text-[13.5px] font-semibold cursor-pointer px-2 py-1 transition-all duration-200"
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
              className="bg-transparent border-none text-(--text-secondary) text-[14px] font-medium cursor-pointer px-2 py-1 transition-all duration-200 hover:text-[#2563eb]"
            >
              {mode === 'signup' ? (
                <>已有帳號？ <span className="font-bold underline">立即登入</span></>
              ) : (
                <>還沒有帳號？ <span className="font-bold underline">立即註冊</span></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
