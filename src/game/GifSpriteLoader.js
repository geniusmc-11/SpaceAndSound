/**
 * Arquitectura de Carga y Animación de Sprites .GIF en 2.5D (Three.js Billboards)
 * - Configura todas las texturas con THREE.NearestFilter (sin mipmaps) para pixelado 32-bits.
 * - Soporta decodificación de cuadros animados (.gif) mediante ImageDecoder / HTMLImageElement.
 * - Incluye placeholders transparentes / diseños retro 32-bits temporales mientras se reemplazan
 *   los archivos reales en /public/sprites/*.gif.
 */

import * as THREE from 'three'

export const GIF_SPRITE_PATHS = {
  stalker: '/sprites/SpyderEnemy.gif',
  shooter: '/sprites/r1.gif',
  gravity: '/sprites/colisionenemy.gif',
  explosion: '/sprites/explotionenemy.gif',
  gravityArea: '/sprites/AreaExplotionEnemy.gif',
  bullet: '/sprites/bullet2.gif',
  bulletImpact: '/sprites/bullet2.gif',
  // Slots extensibles para llegar a 5 subtipos de enemigos
  crawler: '/sprites/SpyderEnemy.gif',
  phaser: '/sprites/r1.gif',
}

const CANVAS_SIZE = 128

/**
 * Tipos que usan EXCLUSIVAMENTE su .gif real: nunca dibujan arte placeholder
 * (mock) ni variantes; mientras el .gif carga permanecen transparentes.
 */
export const REAL_ARTWORK_ONLY_TYPES = new Set(['stalker', 'shooter', 'bullet', 'bulletImpact'])

/**
 * Dibuja un placeholder en blanco/transparente o con silueta pixel-art 32-bits temporal
 * sobre el canvas fijo de 128x128 (escalado desde 32x32 píxeles).
 */
export function drawEnemyPlaceholderFrame(ctx, type, frameIndex = 0, showVisualDesign = true) {
  const size = 32
  const w = ctx.canvas?.width || CANVAS_SIZE
  const h = ctx.canvas?.height || CANVAS_SIZE
  ctx.clearRect(0, 0, w, h)

  // Ceiling Stalker / Hidden Sniper / Balas: sin mocks, solo su textura .gif real
  if (REAL_ARTWORK_ONLY_TYPES.has(type)) {
    return
  }

  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.scale(w / size, h / size)

  // Si se solicita placeholder estrictamente en blanco/transparente puro:
  if (!showVisualDesign) {
    // Deja el canvas transparente con un píxel central casi imperceptible para mantener el buffer activo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
    ctx.fillRect(15, 15, 2, 2)
    ctx.restore()
    return
  }

  const pulse = frameIndex % 2 === 0

  // Marco de esquina estilo visor 32-bits transparente
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
  ctx.fillRect(2, 2, 5, 1)
  ctx.fillRect(2, 2, 1, 5)
  ctx.fillRect(25, 2, 5, 1)
  ctx.fillRect(29, 2, 1, 5)
  ctx.fillRect(2, 29, 5, 1)
  ctx.fillRect(2, 25, 1, 5)
  ctx.fillRect(25, 29, 5, 1)
  ctx.fillRect(29, 25, 1, 5)

  if (type === 'gravity') {
    // Anomalía Gravitatoria: Singularidad con anillos orbitales (Violeta/Magenta)
    ctx.fillStyle = pulse ? '#a855f7' : '#d946ef'
    ctx.fillRect(10, 10, 12, 12)
    ctx.fillStyle = '#030712'
    ctx.fillRect(12, 12, 8, 8)
    // Núcleo blanco de horizonte de sucesos
    ctx.fillStyle = '#f5d0fe'
    ctx.fillRect(14, 14, 4, 4)
    // Anillos de atracción gravitatoria
    ctx.fillStyle = pulse ? '#38bdf8' : '#c084fc'
    ctx.fillRect(5, 15, 4, 2)
    ctx.fillRect(23, 15, 4, 2)
    ctx.fillRect(15, 5, 2, 4)
    ctx.fillRect(15, 23, 2, 4)
  } else if (type === 'explosion') {
    // Explosión de muerte (death_explosion.gif placeholder)
    const radii = [5, 9, 13, 10]
    const r = radii[frameIndex % radii.length]
    ctx.fillStyle = frameIndex % 2 === 0 ? '#facc15' : '#f97316'
    ctx.fillRect(16 - r, 16 - r, r * 2, r * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(12, 12, 8, 8)
  } else {
    // Subtipos extensibles (4 y 5)
    ctx.fillStyle = '#2dd4bf'
    ctx.fillRect(10, 8, 12, 16)
  }
  ctx.restore()
}

// Caché compartida de cuadros ya decodificados (como canvas) para que los enemigos
// y balas aparezcan al instante sin ventanas invisibles ni cierres prematuros al hacer dispose()
const decodedGifCache = new Map()
const resolvedGifCache = new Map()

function rasterizeFrameToCanvas(frame, width, height) {
  const frameCanvas = document.createElement('canvas')
  frameCanvas.width = width
  frameCanvas.height = height
  const frameCtx = frameCanvas.getContext('2d')
  if (frameCtx) {
    frameCtx.imageSmoothingEnabled = false
    frameCtx.drawImage(frame, 0, 0, width, height)
  }
  return frameCanvas
}

async function loadDecodedGifEntry(gifUrl) {
  if (decodedGifCache.has(gifUrl)) {
    return decodedGifCache.get(gifUrl)
  }

  const promise = (async () => {
    try {
      const res = await fetch(gifUrl)
      if (!res.ok) return null
      const buffer = await res.arrayBuffer()
      if (!buffer) return null

      if ('ImageDecoder' in window) {
        const decoder = new window.ImageDecoder({ data: buffer, type: 'image/gif' })
        await decoder.tracks.ready
        const track = decoder.tracks.selectedTrack
        const count = track?.frameCount || 1
        const frames = []
        let targetW = 32
        let targetH = 32
        for (let i = 0; i < count; i++) {
          const result = await decoder.decode({ frameIndex: i })
          if (result.image.displayWidth > 4 && result.image.displayHeight > 4) {
            if (frames.length === 0) {
              targetW = Math.min(128, Math.max(16, result.image.displayWidth || 32))
              targetH = Math.min(128, Math.max(16, result.image.displayHeight || 32))
            }
            frames.push(rasterizeFrameToCanvas(result.image, targetW, targetH))
          }
          result.image.close()
        }
        if (frames.length > 0) {
          const entry = { width: targetW, height: targetH, frames }
          resolvedGifCache.set(gifUrl, entry)
          return entry
        }
      }

      // Fallback compatible si ImageDecoder no está disponible en el navegador
      const blob = new Blob([buffer], { type: 'image/gif' })
      const objectUrl = URL.createObjectURL(blob)
      return await new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          URL.revokeObjectURL(objectUrl)
          if (img.naturalWidth > 4 && img.naturalHeight > 4) {
            const w = Math.min(128, Math.max(16, img.naturalWidth))
            const h = Math.min(128, Math.max(16, img.naturalHeight))
            const entry = { width: w, height: h, frames: [rasterizeFrameToCanvas(img, w, h)] }
            resolvedGifCache.set(gifUrl, entry)
            resolve(entry)
          } else {
            resolve(null)
          }
        }
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl)
          resolve(null)
        }
        img.src = objectUrl
      })
    } catch {
      return null
    }
  })()

  decodedGifCache.set(gifUrl, promise)
  return promise
}

export function preloadGifSprites() {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return Promise.resolve()
  const uniqueUrls = new Set(Object.values(GIF_SPRITE_PATHS))
  return Promise.all(Array.from(uniqueUrls, (url) => loadDecodedGifEntry(url)))
}

/**
 * Crea un controlador de textura animada .GIF para THREE.Sprite con NearestFilter
 */
export function createAnimatedGifSpriteMaterial(
  type = 'shooter',
  gifUrl = GIF_SPRITE_PATHS[type],
  options = { showVisualPlaceholder: true }
) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')

  let frameIndex = 0
  let decodedFrames = []
  let hasRealGifArtwork = false
  let showVisualPlaceholder = options.showVisualPlaceholder !== false

  const cachedEntry = gifUrl ? resolvedGifCache.get(gifUrl) : null
  if (cachedEntry && cachedEntry.frames.length > 0) {
    decodedFrames = cachedEntry.frames
    hasRealGifArtwork = true
  }

  // Dibujar frame inicial (real si ya está en caché, o placeholder)
  if (ctx) {
    ctx.imageSmoothingEnabled = false
    if (hasRealGifArtwork && decodedFrames.length > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(decodedFrames[0], 0, 0, canvas.width, canvas.height)
    } else {
      drawEnemyPlaceholderFrame(ctx, type, 0, showVisualPlaceholder)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  // Restricción estricta 32-bits: NearestFilter sin interpolación borrosa
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
    fog: true,
  })

  // Cargar y decodificar (con caché compartida) el archivo .gif real si aún no estaba listo
  if (!hasRealGifArtwork && typeof window !== 'undefined' && gifUrl && typeof fetch === 'function') {
    loadDecodedGifEntry(gifUrl).then((entry) => {
      if (!entry || entry.frames.length === 0) return
      decodedFrames = entry.frames
      hasRealGifArtwork = true
      stepAnimation()
    })
  }

  function stepAnimation() {
    frameIndex = (frameIndex + 1) % 64
    if (!ctx) return

    ctx.imageSmoothingEnabled = false
    if (hasRealGifArtwork && decodedFrames.length > 0) {
      const frame = decodedFrames[frameIndex % decodedFrames.length]
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
    } else {
      drawEnemyPlaceholderFrame(ctx, type, frameIndex, showVisualPlaceholder)
    }
    texture.needsUpdate = true
  }

  function setPlaceholderMode(showVisual) {
    showVisualPlaceholder = Boolean(showVisual)
    stepAnimation()
  }

  function dispose() {
    decodedFrames = []
    texture.dispose()
    material.dispose()
  }

  return {
    material,
    texture,
    stepAnimation,
    setPlaceholderMode,
    dispose,
    gifUrl,
  }
}
