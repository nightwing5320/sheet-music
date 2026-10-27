import type { Metadata, Viewport } from "next"; // 📌 1. 匯入 Viewport 型別
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
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
  maximumScale: 1,
  userScalable: false, // 阻止手機版網頁因手勢誤觸而被放大錯位
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
          defaultTheme="system"
          themes={["light", "dark", "theme-coffee", "theme-pink"]}
          enableSystem
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}