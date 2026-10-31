// utils/pdfToImages.ts
// 在瀏覽器端將 PDF 每一頁轉成 JPEG 圖片，上傳後與一般樂譜圖片相同（檢視器、翻頁、筆記皆可用）

const TARGET_WIDTH = 1600 // 輸出寬度（px），足以在平板上清楚閱讀樂譜
const MAX_SCALE = 4 // 避免極小尺寸的 PDF 被放大過頭
const JPEG_QUALITY = 0.85

export const isPdfFile = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

// onProgress(目前頁數, 總頁數)
export async function pdfToImages(
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<File[]> {
  // pdf.js 只能在瀏覽器執行，於使用時才動態載入
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  const pdf = await loadingTask.promise
  const baseName = file.name.replace(/\.pdf$/i, '')
  const images: File[] = []

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      onProgress?.(pageNumber, pdf.numPages)

      const page = await pdf.getPage(pageNumber)
      const scale = Math.min(TARGET_WIDTH / page.getViewport({ scale: 1 }).width, MAX_SCALE)
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)

      // JPEG 不支援透明，先鋪白底避免透明區域變黑
      const context = canvas.getContext('2d')
      if (!context) throw new Error('無法建立畫布')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)

      await page.render({ canvas, viewport }).promise

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
      if (!blob) throw new Error(`第 ${pageNumber} 頁轉換失敗`)

      images.push(new File([blob], `${baseName}-p${pageNumber}.jpg`, { type: 'image/jpeg' }))

      // 釋放記憶體（多頁 PDF 在手機上較吃資源）
      page.cleanup()
      canvas.width = 0
      canvas.height = 0
    }
  } finally {
    // 結束 worker 並釋放 PDF 資源
    await loadingTask.destroy()
  }

  return images
}
