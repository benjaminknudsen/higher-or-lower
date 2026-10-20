export const PROFILE_PHOTO_BUCKET = 'fcm-avatars'
const MAX_PHOTO_BYTES = 2 * 1024 * 1024

function photoExtension(blob) {
  if (blob?.type === 'image/webp') return 'webp'
  if (blob?.type === 'image/jpeg') return 'jpg'
  throw new Error('Brug et komprimeret WebP- eller JPEG-billede.')
}

export function profilePhotoPublicUrl(client, path) {
  if (!client || typeof path !== 'string' || !path) return ''
  const { data } = client.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(path)
  return data?.publicUrl ?? ''
}

export async function saveCloudProfilePhoto(client, userId, blob, previousPath = null) {
  if (!client || !userId || !(blob instanceof Blob) || blob.size <= 0 || blob.size > MAX_PHOTO_BYTES) {
    throw new Error('Billedet er ugyldigt eller større end 2 MB.')
  }
  const extension = photoExtension(blob)
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const bucket = client.storage.from(PROFILE_PHOTO_BUCKET)
  let uploadError
  try {
    ({ error: uploadError } = await bucket.upload(path, blob, {
      contentType: blob.type, cacheControl: '31536000', upsert: false,
    }))
  } catch {
    throw new Error('Profilbilledet kunne ikke uploades. Kontrollér forbindelsen, og prøv igen.')
  }
  if (uploadError) throw new Error('Profilbilledet kunne ikke uploades. Kontrollér forbindelsen, og prøv igen.')
  let data, profileError
  try {
    ({ data, error: profileError } = await client.from('profiles').update({ avatar_path: path })
      .eq('id', userId).select('id,avatar_path').single())
  } catch {
    profileError = new Error('Profilbilledets sti kunne ikke gemmes.')
  }
  if (profileError || data?.id !== userId || data?.avatar_path !== path) {
    let cleanupError
    try { ({ error: cleanupError } = await bucket.remove([path])) } catch { cleanupError = new Error('Storage-oprydningen fejlede.') }
    if (cleanupError) throw new Error('Billedet blev uploadet, men profilen kunne ikke opdateres. Et ubrugt billede skal ryddes op i Storage.')
    throw new Error('Profilbilledets sti kunne ikke gemmes på kontoen.')
  }
  let warning = ''
  if (previousPath && previousPath !== path) {
    try {
      const { error } = await bucket.remove([previousPath])
      if (error) warning = 'Profilbilledet er opdateret. Det tidligere billede kunne ikke ryddes op.'
    } catch { warning = 'Profilbilledet er opdateret. Det tidligere billede kunne ikke ryddes op.' }
  }
  return { path, warning }
}

export async function removeCloudProfilePhoto(client, userId, previousPath) {
  if (!client || !userId) throw new Error('Profilbilledet kunne ikke knyttes til en konto.')
  let data, error
  try {
    ({ data, error } = await client.from('profiles').update({ avatar_path: null })
      .eq('id', userId).select('id,avatar_path').single())
  } catch { error = new Error('Profilbilledet kunne ikke fjernes fra kontoen.') }
  if (error || data?.id !== userId || data?.avatar_path !== null) {
    throw new Error('Profilbilledet kunne ikke fjernes fra kontoen.')
  }
  if (!previousPath) return { warning: '' }
  try {
    const { error: removeError } = await client.storage.from(PROFILE_PHOTO_BUCKET).remove([previousPath])
    return { warning: removeError ? 'Billedet er fjernet fra profilen, men den gamle fil skal ryddes op i Storage.' : '' }
  } catch {
    return { warning: 'Billedet er fjernet fra profilen, men den gamle fil skal ryddes op i Storage.' }
  }
}
