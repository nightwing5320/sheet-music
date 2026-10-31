'use client'

import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const TOAST_STYLES: Record<ToastType, { color: string; Icon: typeof Info }> = {
  success: { color: '#10b981', Icon: CheckCircle2 },
  error: { color: '#ef4444', Icon: AlertCircle },
  info: { color: '#f59e0b', Icon: Info },
}

// 取代 alert()：畫面上方的輕量提示，不會阻擋操作，切換頁面時仍會保留
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextIdRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback((type: ToastType, message: string) => {
    const id = nextIdRef.current++
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]) // 最多同時顯示 3 則
    setTimeout(() => dismiss(id), type === 'error' ? 5000 : 3000)
  }, [dismiss])

  const [api] = useState<ToastApi>(() => ({
    success: (message) => show('success', message),
    error: (message) => show('error', message),
    info: (message) => show('info', message),
  }))

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-2 w-[calc(100%-32px)] max-w-[420px] pointer-events-none"
      >
        {toasts.map((toast) => {
          const { color, Icon } = TOAST_STYLES[toast.type]
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-[12px] bg-(--card-bg) border border-(--border-color) border-l-4 text-(--text-primary) shadow-[0_8px_24px_rgba(0,0,0,0.12)] text-[14px] font-semibold pointer-events-auto animate-[toast-in_0.2s_ease-out]"
              style={{ borderLeftColor: color }}
            >
              <Icon size={18} className="shrink-0" style={{ color }} />
              <span className="flex-1 break-words">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="關閉提示"
                className="bg-transparent border-none cursor-pointer p-0.5 inline-flex text-(--text-secondary)"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
