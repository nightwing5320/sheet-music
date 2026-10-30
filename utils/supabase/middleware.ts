// utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith('/login');
  const isApi = pathname.startsWith('/api/');

  // 轉址時需帶上 supabaseResponse 的 cookie（例如刷新或清除的 session）
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  // 檢查是否已通過管理員審核
  let isApproved = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_approved')
      .eq('id', user.id)
      .single();
    isApproved = !!profile?.is_approved;
  }

  // 已登入但尚未審核：登出並導回 /login（API 回傳 403）
  if (user && !isApproved) {
    await supabase.auth.signOut({ scope: 'local' });
    if (isApi) {
      return NextResponse.json({ error: 'Account pending approval' }, { status: 403 });
    }
    if (!isLoginPage) return redirectTo('/login');
    return supabaseResponse;
  }

  // 門禁邏輯：未登入且存取的不是 /login 頁面，API 回傳 401，頁面強制跳轉至 /login
  if (!user && !isLoginPage) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return redirectTo('/login');
  }

  // 若已登入且嘗試進入 /login，自動重定向至樂譜庫首頁 /
  if (user && isLoginPage) {
    return redirectTo('/');
  }

  return supabaseResponse;
}