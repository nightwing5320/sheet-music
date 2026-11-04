// utils/keepScrollPosition.ts
import { flushSync } from 'react-dom'

// iPad / iPhone 的 Safari 不會自動修正捲動位置，上方內容變高時畫面會往下跑。
// 更新畫面後依 element 移動的距離補回去，讓畫面看起來定住。
// 使用的頁面需加上 overflow-anchor: none，避免其他瀏覽器的自動修正重複作用。
export function keepScrollPosition(element: HTMLElement | null, update: () => void) {
  const before = element?.getBoundingClientRect().top
  flushSync(update)
  const after = element?.getBoundingClientRect().top

  if (before !== undefined && after !== undefined && after !== before) {
    window.scrollBy({ top: after - before, behavior: 'instant' })
  }
}
