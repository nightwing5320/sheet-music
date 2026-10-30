// proxy.ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 攔截所有路徑，但排除靜態檔案（圖片、圖示、Next.js 內部檔案）與 webhook（notify-admin 自行以密鑰驗證）
     */
    '/((?!_next/static|_next/image|favicon.ico|api/notify-admin|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};