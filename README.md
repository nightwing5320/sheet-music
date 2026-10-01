# 🎼 雲端敬拜樂譜庫 (Worship Sheet Music Library)

一個專為教會敬拜團與音樂事工打造的響應式 Web 樂譜管理系統。支援多頁樂譜上傳、現場服事歌單編排、全螢幕觸控滑動播放，以及完善的使用者權限審核機制。

---

## ✨ 核心功能

### 1. 🎼 樂譜管理與分類
- **多頁上傳與預覽**：支援單頁或多頁樂譜圖片上傳，首頁卡片自動顯示封面與總頁數。
- **快慢歌與調性標籤**：可針對歌曲標記調性（Key）以及速度（⚡ 快歌 / 🌙 慢歌 / ❓ 未分類），方便即時搜尋與分頁切換。
- **關鍵字搜尋**：支援透過歌名或 Key（如 C, G, Am）進行即時搜尋。

### 2. 📋 現場服事敬拜歌單
- **當日歌單編排**：可將樂譜一鍵新增至今日歌單，並支援拖拉/按鈕上下調整順序與清除歌單。
- **本地端自動儲存**：使用 `localStorage` 自動保存當前編排的歌單，重新整理或關閉頁面不遺失。

### 3. 📱 全螢幕模式
- **全螢幕燈箱模式**：支援電腦鍵盤（← / → 方向鍵、Esc 鍵）與行動裝置（左右滑動手勢）翻頁。
- **跨歌曲無縫切換**：在歌單播放模式下，當前樂譜翻至最後一頁時，自動順暢切換至歌單中的下一首樂譜。

### 4. 👤 使用者管理與審核機制
- **個人資料管理**：登入使用者可自行修改顯示名稱（`display_name`）與安全變更密碼。
- **審核開通機制 (`/admin`)**：新使用者註冊後需由管理員於後台開通（`is_approved`），維護事工團隊的樂譜版權與資安。
- **忘記密碼與安全驗證**：整合 Supabase Auth 安全驗證機制，支援郵件發送重設密碼連結。

---

## 🛠️ 技術堆疊 (Tech Stack)

- **前端框架**：[Next.js](https://nextjs.org/) (App Router, React, TypeScript)
- **後端與資料庫**：[Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Row Level Security)
- **樣式處理**：CSS Modules / CSS Variables (支援簡約現代風格與卡片化 UI)

---

## 📁 專案架構 (Project Structure)

```text
├── app/
│   ├── page.tsx               # 主頁 (樂譜清單、搜尋與歌單控制)
│   ├── profile/page.tsx       # 個人資料與密碼修改
│   ├── upload/page.tsx        # 樂譜上傳頁面
│   ├── edit/[id]/page.tsx     # 樂譜編輯頁面
│   ├── admin/page.tsx         # 管理員使用者審核後台
│   ├── login/page.tsx         # 登入頁面
│   ├── forgot-password/      # 忘記密碼發送頁
│   └── reset-password/       # 設定新密碼頁
├── components/                # 模組化元件
│   ├── Header.tsx             # 頂部導覽列與使用者歡迎詞
│   ├── SetlistSection.tsx     # 敬拜歌單展折與順序調整區
│   ├── SheetCard.tsx          # 單張樂譜卡片元件
│   └── SheetViewerModal.tsx   # 全螢幕放大與觸控/鍵盤播放燈箱
├── types/
│   └── index.ts               # 共用 TypeScript 介面定義 (Sheet 等)
└── utils/
    └── supabase/              # Supabase Client 與 Server 連接設定
