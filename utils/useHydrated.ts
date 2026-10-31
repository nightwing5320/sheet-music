// utils/useHydrated.ts
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

// 伺服器端渲染與 hydration 期間回傳 false，之後在瀏覽器端回傳 true
// 取代「useEffect(() => setMounted(true), [])」的寫法
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
