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
    const encode = type => new Promise(resolve => canvas.toBlob(resolve, type, .85))
    const blob = await encode('image/webp') || await encode('image/jpeg')
    if (!blob || blob.size === 0) throw new Error('Billedet kunne ikke komprimeres. Prøv et andet billede.')
    return blob
  } finally { env.URL.revokeObjectURL(source) }
}
