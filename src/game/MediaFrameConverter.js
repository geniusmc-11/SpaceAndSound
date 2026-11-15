/**
 * Conversor de Medios a Discos NASA (Opción B: Video -> Pocos Fotogramas, e Imágenes Directas)
 * Lenguaje: JavaScript puro (ES6+)
 */

import { RARITY_CONFIG } from './NasaDatasetGenerator'

const TARGET_WIDTH = 512
const TARGET_HEIGHT = 256

/**
 * Convierte un archivo de video (ej. MP4/WebM de ~30s) en una secuencia ligera
 * de pocos fotogramas (Opción B) usando un <video> oculto y un <canvas> 2D.
 *
 * @param {File|string} fileOrUrl Archivo File local o URL compatible con CORS
 * @param {object} options
 * @param {number} [options.frameCount=16] Cantidad de fotogramas clave a extraer
 * @param {number} [options.quality=0.82] Calidad JPEG (0..1)
 * @param {Function} [options.onProgress] Callback (current, total)
 * @returns {Promise<{frames: string[], frameCount: number, durationSec: number, frameIntervalMs: number}>}
 */
export async function convertVideoToOptionBFrames(fileOrUrl, options = {}) {
  const requestedFrames = Math.max(2, Math.min(30, Number(options.frameCount) || 16))
  const quality = options.quality ?? 0.82
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null

  const isFile = typeof File !== 'undefined' && fileOrUrl instanceof File
  const objectUrl = isFile ? URL.createObjectURL(fileOrUrl) : String(fileOrUrl)

  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  if (!isFile && /^https?:\/\//i.test(objectUrl)) {
    video.crossOrigin = 'anonymous'
  }

  const canvas = document.createElement('canvas')
  canvas.width = TARGET_WIDTH
  canvas.height = TARGET_HEIGHT
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () =>
        reject(new Error('No se pudo decodificar el video (formato no soportado o bloqueado por CORS).'))
      video.src = objectUrl
    })

    const durationSec = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10
    const frames = []

    // Extraer fotogramas distribuidos uniformemente a lo largo del video
    for (let i = 0; i < requestedFrames; i++) {
      const ratio = requestedFrames === 1 ? 0 : i / (requestedFrames - 1)
      const targetTime = Math.min(Math.max(0.05, ratio * Math.max(0.1, durationSec - 0.1)), durationSec)

      await new Promise((resolve, reject) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked)
          resolve()
        }
        const onError = () => {
          video.removeEventListener('error', onError)
          reject(new Error(`Error al extraer fotograma ${i + 1}`))
        }
        video.addEventListener('seeked', onSeeked, { once: true })
        video.addEventListener('error', onError, { once: true })
        video.currentTime = targetTime
      })

      if (ctx) {
        ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT)
        ctx.drawImage(video, 0, 0, TARGET_WIDTH, TARGET_HEIGHT)
        frames.push(canvas.toDataURL('image/jpeg', quality))
      }

      if (onProgress) {
        onProgress(i + 1, requestedFrames)
      }
    }

    const frameIntervalMs = Math.max(
      450,
      Math.round((durationSec * 1000) / Math.max(1, frames.length))
    )

    return {
      frames,
      frameCount: frames.length,
      durationSec: Number(durationSec.toFixed(1)),
      frameIntervalMs,
    }
  } finally {
    video.removeAttribute('src')
    video.load()
    if (isFile) {
      URL.revokeObjectURL(objectUrl)
    }
  }
}

/**
 * Convierte una imagen directa (File o URL) en DataURL normalizado (512x256)
 * para sonificación inmediata sin problemas de lectura de píxeles.
 */
export async function convertImageToDirectDiscMedia(fileOrUrl, quality = 0.9) {
  const isFile = typeof File !== 'undefined' && fileOrUrl instanceof File
  const objectUrl = isFile ? URL.createObjectURL(fileOrUrl) : String(fileOrUrl)

  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      if (!isFile && /^https?:\/\//i.test(objectUrl)) {
        el.crossOrigin = 'anonymous'
      }
      el.onload = () => resolve(el)
      el.onerror = () =>
        reject(new Error('No se pudo cargar la imagen (archivo inválido o bloqueado por CORS).'))
      el.src = objectUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = TARGET_WIDTH
    canvas.height = TARGET_HEIGHT
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT)
      ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT)
    }

    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    return {
      frames: [dataUrl],
      imageUrl: dataUrl,
    }
  } finally {
    if (isFile) {
      URL.revokeObjectURL(objectUrl)
    }
  }
}

/**
 * Construye un objeto Disco normalizado compatible con useGameStore y useSonifier.
 */
export function buildDiscRecord({
  id,
  title,
  instrument = 'Archivo Multimedia Usuario',
  date = new Date().toISOString().slice(0, 10),
  category = 'huracan',
  rarity = 'raro',
  mediaType = 'image',
  frames = [],
  imageUrl = null,
  durationSec = 0,
  frameIntervalMs = 1500,
  narration = '',
  sourceUrl = null,
}) {
  const rarityMeta = RARITY_CONFIG[rarity] || RARITY_CONFIG.raro
  const normalizedFrames =
    Array.isArray(frames) && frames.length > 0
      ? frames
      : imageUrl
        ? [imageUrl]
        : []

  return {
    id: id || `custom-disc-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    title: (title || 'Dataset Personalizado').trim(),
    instrument,
    date,
    narration:
      narration ||
      `Archivo ${mediaType === 'frames' ? 'de video por fotogramas' : 'de imagen'}: ${title}. Rareza ${rarityMeta.label}.`,
    category,
    rarity,
    colorHex: rarityMeta.hex,
    threeColor: rarityMeta.threeColor,
    mediaType: normalizedFrames.length > 1 ? 'frames' : 'image',
    frames: normalizedFrames,
    imageUrl: normalizedFrames[0] || null,
    durationSec,
    frameIntervalMs,
    sourceMethod: mediaType === 'frames' ? 'video-frames-option-b' : 'direct-image',
    sourceUrl,
    collectedAt: new Date().toISOString(),
  }
}
