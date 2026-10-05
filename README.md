# 🎼 樂譜庫 (Sheet Music Library)

一個基於 **Next.js 15 (App Router)** 與 **Supabase** 打造的高質感、跨裝置雲端敬拜樂譜管理平台。專為敬拜領唱、樂手與教會團隊設計，提供即時歌單整理、全螢幕樂譜檢視以及 Apple Pencil 樂譜塗鴉筆記功能。

---

## ✨ 核心特色 (Key Features)

- **🎨 現代石墨灰極簡 UI (Modern Dark/Light UI)**
  - 全站採用低彩度「石墨灰/深鋼」設計語言，完美支援深色/淺色主題切換。
  - 全面遷移至 `lucide-react` 向量圖示，擺脫 Emoji 在不同作業系統上的渲染差異。
- **📋 敬拜歌單管理 (Worship Setlist Control)**
  - 支持即時新增/移除歌單、一鍵清空，並可彈性調整歌曲上下順序。
  - 按鈕採用清爽的 Ghost/Capsule 膠囊設計，滑鼠 Hover 具備流暢的微互動視覺反饋。
- **✏️ 樂譜即時標註與塗鴉 (Sheet Annotation System)**
  - 支援全螢幕樂譜 Modal 檢視與毛玻璃沉浸式背景 (`backdrop-filter`)。
  - 整合 SVG 互動畫布，專為 **Apple Pencil** 及滑鼠繪圖優化（排除手掌誤觸），支援多色選擇、粗細切換與復原功能。
- **🏷️ 多維度篩選與速度分類 (Tempo & Key Filtering)**
  - 支援關鍵字搜尋（樂譜名稱、調性 Key）。
  - 整合快歌 (`fast`)、慢歌 (`slow`) 與未分類篩選標籤頁。
- **🔒 權限與帳號管理 (Auth & Profile Approval)**
  - Supabase Auth 身份驗證，支援管理員審核機制（`is_approved`），確保樂譜庫存取安全。

---

## 🛠️ 技術棧 (Tech Stack)

- **Framework**: [Next.js 15](https://nextjs.org/) (React 19 / App Router)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL & Supabase Storage)
- **Icons**: [lucide-react](https://lucide.dev/)
- **Styling**: Pure CSS Variables (Dark/Light mode native support)
- **Language**: TypeScript

---

## 📁 專案結構 (Project Structure)

```text
├── app/
│   ├── layout.tsx             # 全域 Layout 與 CSS 變數配置
│   ├── page.tsx               # 樂譜庫首頁 (主控台/搜尋/篩選)
│   ├── login/                 # 登入與註冊頁面 (審核機制提示)
│   ├── profile/               # 個人資料與密碼重設
│   ├── upload/                # 新增樂譜頁面 (支援多頁上傳與預覽)
│   └── edit/[id]/             # 編輯樂譜資訊與速度分類
├── components/
│   ├── SheetCard.tsx          # 樂譜卡片組件 (編輯/刪除/加入歌單)
│   ├── SetlistSection.tsx     # 今日歌單懸浮/置頂管理區塊
│   ├── SheetViewerModal.tsx   # 全螢幕樂譜檢視器 Container
│   └── SheetAnnotator.tsx     # SVG 手寫筆記與塗鴉圖層組件
├── lib/
│   └── supabase.ts            # Supabase Client 初始化
└── public/
