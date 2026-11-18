/**
 * Compresses an image file via canvas with an automatic fallback to raw DataURL
 * so mobile camera formats or large files never fail silently.
 */
export function compressImageFile(file, callback, maxWidth = 600, quality = 0.65) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const rawData = e.target?.result
    if (!rawData) return

    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const width = img.width || maxWidth
        const height = img.height || Math.round(maxWidth * 0.7)
        const scaleSize = Math.min(1, maxWidth / width)
        canvas.width = Math.max(1, Math.round(width * scaleSize))
        canvas.height = Math.max(1, Math.round(height * scaleSize))
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          callback(rawData)
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        callback(canvas.toDataURL('image/jpeg', quality))
      } catch (err) {
        console.warn('Canvas compress error, fallback to raw data:', err)
        callback(rawData)
      }
    }
    img.onerror = () => {
      console.warn('Image load error, fallback to raw data')
      callback(rawData)
    }
    img.src = rawData
  }
  reader.onerror = (err) => {
    console.error('FileReader error:', err)
  }
  reader.readAsDataURL(file)
}
