// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 檢查瀏覽器本地儲存的 Session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // 未登入 -> 強制跳轉至登入頁
        router.push('/login');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };

    checkUser();
  }, [router, supabase]);

  // 手動登出邏輯
  const handleLogout = async () => {
    await supabase.auth.signOut(); // 清除本地 LocalStorage Session
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">樂譜管理後台</h1>
          <p className="text-sm text-gray-500">當前登入者：{user?.email}</p>
        </div>
        
        {/* 手動登出按鈕 */}
        <button
          onClick={handleLogout}
          className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition"
        >
          🔒 手動登出
        </button>
      </header>

      <main>
        <p className="text-green-600 font-semibold mb-4">✅ 已成功通過管理員身分驗證！此裝置會保持登入狀態，直到點擊上方登出。</p>
        {/* 這裡可放置樂譜編輯、上傳、刪除等管理功能 */}
      </main>
    </div>
  );
}