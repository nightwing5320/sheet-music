// utils/keepScrollPosition.ts
import { flushSync } from 'react-dom'

const SETTLE_MS = 400

// 找出實際在捲動的區塊（首頁的 main 因 overflow-x-hidden 會自己捲動，不是整個視窗）
function findScroller(element: HTMLElement) {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent)
    const canScroll = overflowY === 'auto' || overflowY === 'scroll'
    if (canScroll && parent.scrollHeight > parent.clientHeight) return parent
  }
  return window
}

// iPad / iPhone 的 Safari 不會自動修正捲動位置，上方內容變高時畫面會往下跑。
// 更新畫面後把 element 拉回原本的位置，讓畫面看起來定住。
// 使用的頁面需加上 overflow-anchor: none，避免其他瀏覽器的自動修正重複作用。
export function keepScrollPosition(element: HTMLElement | null, update: () => void) {
  if (!element) {
    flushSync(update)
    return
  }

  const targetTop = element.getBoundingClientRect().top
  flushSync(update)

  const scroller = findScroller(element)
  const correct = () => {
    const drift = element.getBoundingClientRect().top - targetTop
    if (Math.abs(drift) >= 1) scroller.scrollBy({ top: drift, behavior: 'instant' })
  }
  correct()

  // 部分裝置在畫面更新後才調整捲動位置，短時間內持續校正；使用者開始滑動就停止
  const startedAt = performance.now()
  let stopped = false
  const stop = () => {
    stopped = true
  }
  window.addEventListener('touchstart', stop, { once: true, passive: true })
  window.addEventListener('wheel', stop, { once: true, passive: true })

  const settle = () => {
    if (stopped || performance.now() - startedAt > SETTLE_MS) {
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('wheel', stop)
      return
    }
    correct()
    requestAnimationFrame(settle)
  }
  requestAnimationFrame(settle)
}
