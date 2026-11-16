/**
 * Utilidades de seguridad para validación de URLs externas y archivos subidos en producción.
 */

const MAX_IMAGE_BYTES = 20 * 1024 * 1024 // 20 MB
const MAX_VIDEO_BYTES = 150 * 1024 * 1024 // 150 MB

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

const ALLOWED_VIDEO_MIME_PREFIX = 'video/'

/**
 * Valida y normaliza una URL externa permitiendo solo HTTPS (y opcionalmente HTTP).
 * Bloquea esquemas peligrosos como javascript:, data:, vbscript: o file:.
 */
export function sanitizeExternalUrl(rawUrl, { allowHttp = false } = {}) {
  if (typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const allowedProtocols = allowHttp ? ['https:', 'http:'] : ['https:']
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null
    }
    return parsed.href
  } catch {
    return null
  }
}

/**
 * Valida tamaño y tipo MIME de archivos locales antes de procesarlos en el navegador.
 * Bloquea SVG (puede contener scripts embebidos) y archivos excesivamente grandes.
 */
export function validateUploadedMediaFile(file, kind = 'image') {
  if (!file || typeof file.size !== 'number') {
    return { valid: false, error: 'Invalid file selected.' }
  }

  const mime = String(file.type || '').toLowerCase()

  if (kind === 'video') {
    if (mime && !mime.startsWith(ALLOWED_VIDEO_MIME_PREFIX)) {
      return { valid: false, error: 'Only standard video files (MP4, WebM, MOV) are allowed.' }
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return { valid: false, error: 'Video exceeds the 150 MB safety limit.' }
    }
    return { valid: true, error: '' }
  }

  if (mime === 'image/svg+xml') {
    return { valid: false, error: 'SVG files are disabled for security. Use PNG, JPEG, WebP or GIF.' }
  }
  if (mime && !ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
    return { valid: false, error: 'Only PNG, JPEG, WebP or GIF images are allowed.' }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: 'Image exceeds the 20 MB safety limit.' }
  }
  return { valid: true, error: '' }
}
