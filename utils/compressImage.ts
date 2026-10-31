// utils/compressImage.ts
// 上傳前在瀏覽器端縮小樂譜圖片（手機照片常有 3–5 MB），加快手機載入並節省儲存空間

const MAX_WIDTH = 1600 // 與 PDF 轉圖相同，足以在平板上清楚閱讀樂譜
const MAX_HEIGHT = 2400
const JPEG_QUALITY = 0.85

// 無法處理的格式（例如部分瀏覽器不支援的 HEIC）或壓縮後沒有變小時，回傳原檔
export async function compressImage(file: File): Promise<File> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch (err) {
    console.warn('Image compression skipped:', file.name, err)
    return file
  }

  const scale = Math.min(MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height, 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  // JPEG 不支援透明，先鋪白底避免透明區域變黑
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  canvas.width = 0
  canvas.height = 0

  if (!blob || (scale === 1 && blob.size >= file.size)) return file

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
}
