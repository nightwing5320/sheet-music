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
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: 'calc(100% - 32px)',
          maxWidth: '420px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => {
          const { color, Icon } = TOAST_STYLES[toast.type]
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'var(--card-bg, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderLeft: `4px solid ${color}`,
                color: 'var(--text-primary, #1e293b)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                fontSize: '14px',
                fontWeight: '600',
                pointerEvents: 'auto',
                animation: 'toast-in 0.2s ease-out'
              }}
            >
              <Icon size={18} style={{ color, flexShrink: 0 }} />
              <span style={{ flex: 1, wordBreak: 'break-word' }}>{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="關閉提示"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'inline-flex',
                  color: 'var(--text-secondary, #64748b)'
                }}
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
