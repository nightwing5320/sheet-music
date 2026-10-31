import type { Metadata, Viewport } from "next"; // 📌 1. 匯入 Viewport 型別
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "樂譜庫｜Sheet Music Library",
  description: "Private Worship Sheet Music Library",
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

// 📌 2. 新增並導出 viewport 設定
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 允許使用者縮放頁面（無障礙）；樂譜檢視器內的手勢由 SheetViewerModal 自行攔截，
  // 輸入框自動放大問題由 globals.css 的手機版 16px 字級處理
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-TW"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          themes={["light", "dark", "theme-coffee", "theme-pink", "theme-mint"]}
          enableSystem
        >
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}