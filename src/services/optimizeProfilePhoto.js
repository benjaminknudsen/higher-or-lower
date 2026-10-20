export const MAX_UPLOAD_PHOTO_BYTES = 2 * 1024 * 1024
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024
export function avatarDimensions(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width * height > 80_000_000) throw new Error('Billedet er for stort. Vælg et mindre billede.')
  const scale = Math.min(1, 512 / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}
export function validatePhotoFile(file) {
  if (!file || file.size === 0) throw new Error('Vælg en gyldig billedfil.')
  if (file.size > MAX_PHOTO_BYTES) throw new Error('Billedet er for stort. Vælg et billede under 25 MB.')
  if (!file.type?.startsWith('image/') && !/\.(heic|heif|jpe?g|png|webp|gif|avif)$/i.test(file.name || '')) throw new Error('Vælg en billedfil, fx JPEG eller PNG.')
}
export async function optimizeProfilePhoto(file, env = globalThis) {
  validatePhotoFile(file)
  const source = env.URL.createObjectURL(file)
  try {
    // HTMLImageElement applies EXIF orientation before canvas rendering in supported browsers.
    const image = new env.Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('Billedet kan ikke åbnes. Prøv JPEG eller PNG. HEIC kræver, at din browser understøtter formatet.'))
      image.src = source
    })
    const size = avatarDimensions(image.naturalWidth, image.naturalHeight)
    const canvas = env.document.createElement('canvas')
    canvas.width = size.width; canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Billedet kunne ikke behandles. Prøv igen.')
    context.drawImage(image, 0, 0, size.width, size.height)
    for (const type of ['image/webp', 'image/jpeg']) {
      if (type === 'image/jpeg') {
        // Give transparent PNGs a white background when JPEG is the available encoder.
        context.fillStyle = '#fff'
        context.fillRect(0, 0, size.width, size.height)
        context.drawImage(image, 0, 0, size.width, size.height)
      }
      for (const quality of [.85, .7, .5]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality))
        // Safari may return PNG rather than null for an unsupported WebP encoder.
        if (!blob || blob.type !== type || blob.size === 0) break
        if (blob.size <= MAX_UPLOAD_PHOTO_BYTES) return blob
      }
    }
    throw new Error('Billedet kunne ikke komprimeres til upload. Prøv et andet billede.')
  } finally { env.URL.revokeObjectURL(source) }
}
