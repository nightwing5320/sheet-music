// utils/ui.ts
// 表單頁面（登入、個人設定、上傳、編輯、管理後台）共用的 Tailwind class

// 單欄表單頁面的外框
export const formPageClass = 'max-w-[520px] mx-auto my-10 p-6 text-(--text-primary)'

// 「返回樂譜庫」連結（Base 不含外距，可放在同一列的其他按鈕旁）
export const backLinkBaseClass =
  'inline-flex items-center gap-1.5 text-(--text-secondary) no-underline text-[14px] font-medium px-3 py-1.5 rounded-[8px] border border-(--border-color) transition-all duration-200 hover:text-[#2563eb] hover:border-[rgba(37,99,235,0.3)] hover:bg-[rgba(37,99,235,0.05)]'
export const backLinkClass = `${backLinkBaseClass} mb-6`

// 頁面標題列與標題
export const pageTitleRowClass = 'flex items-center gap-2 mb-6'
export const pageTitleClass = 'm-0 text-[24px] font-extrabold text-(--text-primary)'

// 卡片
export const cardClass =
  'bg-(--card-bg) border border-(--border-color) rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)]'

// 表單欄位
export const labelClass = 'block mb-1.5 font-semibold text-[14px]'
export const inputClass =
  'w-full px-3 py-2.5 rounded-[8px] border border-(--border-color) bg-(--card-bg) text-(--text-primary) box-border'
export const selectClass = `${inputClass} cursor-pointer`

// 送出按鈕：基礎樣式（不含顏色，避免同一元素出現兩個 bg-* 互相衝突）
export const buttonBaseClass =
  'inline-flex items-center justify-center gap-2 h-[42px] rounded-[10px] border-none font-semibold text-[15px] cursor-pointer transition-all duration-200 disabled:bg-(--text-secondary) disabled:cursor-not-allowed'

// 送出按鈕（深色），停用時變灰
export const submitButtonClass = `${buttonBaseClass} bg-(--text-primary) text-(--background)`

// 載入中提示
export const loadingTextClass = 'text-center py-15 text-(--text-secondary)'
