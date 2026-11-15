/**
 * Arquitectura de Carga y Animación de Sprites .GIF en 2.5D (Three.js Billboards)
 * - Configura todas las texturas con THREE.NearestFilter (sin mipmaps) para pixelado 32-bits.
 * - Soporta decodificación de cuadros animados (.gif) mediante ImageDecoder / HTMLImageElement.
 * - Incluye placeholders transparentes / diseños retro 32-bits temporales mientras se reemplazan
 *   los archivos reales en /public/sprites/*.gif.
 */

import * as THREE from 'three'

export const GIF_SPRITE_PATHS = {
  stalker: '/sprites/nave.gif',
  shooter: '/sprites/naveenemy.gif',
  gravity: '/sprites/colisionenemy.gif',
  explosion: '/sprites/explotionenemy.gif',
  gravityArea: '/sprites/AreaExplotionEnemy.gif',
  bullet: '/sprites/bullet2.gif',
  bulletImpact: '/sprites/bullet1.gif',
  // Slots extensibles para llegar a 5 subtipos de enemigos
  crawler: '/sprites/nave.gif',
  phaser: '/sprites/naveenemy.gif',
}

/**
 * Dibuja un placeholder en blanco/transparente o con silueta pixel-art 32-bits temporal
 * sobre un canvas de 32x32 píxeles.
 */
export function drawEnemyPlaceholderFrame(ctx, type, frameIndex = 0, showVisualDesign = true) {
  const size = 32
  ctx.clearRect(0, 0, size, size)

  // Si se solicita placeholder estrictamente en blanco/transparente puro:
  if (!showVisualDesign) {
    // Deja el canvas transparente con un píxel central casi imperceptible para mantener el buffer activo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
    ctx.fillRect(15, 15, 2, 2)
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

  if (type === 'stalker') {
    // Acechador de Techo: Arácnido/trampa biomecánica colgante (Rojo/Ámbar)
    ctx.fillStyle = pulse ? '#ef4444' : '#f97316'
    ctx.fillRect(14, 0, 4, 8) // Cable/tendón al techo
    ctx.fillRect(9, 8, 14, 7) // Carapacho superior
    // Garras descendentes
    const clawOffset = pulse ? 2 : 0
    ctx.fillRect(6, 14 + clawOffset, 3, 9)
    ctx.fillRect(23, 14 + clawOffset, 3, 9)
    ctx.fillRect(11, 15, 3, 7)
    ctx.fillRect(18, 15, 3, 7)
    // Ojos brillantes
    ctx.fillStyle = '#fef08a'
    ctx.fillRect(11, 10, 3, 3)
    ctx.fillRect(18, 10, 3, 3)
  } else if (type === 'shooter') {
    // Francotirador Oculto: Centinela con visor láser (Cian/Esmeralda)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(10, 7, 12, 18)
    ctx.fillStyle = pulse ? '#38bdf8' : '#22d3ee'
    ctx.fillRect(9, 6, 14, 2)
    ctx.fillRect(8, 12, 16, 8)
    // Mirilla telescópica central brillante
    ctx.fillStyle = pulse ? '#f43f5e' : '#fb7185'
    ctx.fillRect(13, 9, 6, 4)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(15, 10, 2, 2)
    // Cañón de plasma
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(19, 15, 8, 3)
  } else if (type === 'gravity') {
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
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')

  let frameIndex = 0
  let decodedFrames = []
  let hasRealGifArtwork = false
  let showVisualPlaceholder = options.showVisualPlaceholder !== false

  // Dibujar frame inicial de placeholder (transparente / 32-bits)
  if (ctx) {
    drawEnemyPlaceholderFrame(ctx, type, 0, showVisualPlaceholder)
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
  })

  // Intentar cargar y decodificar el archivo .gif real si contiene frames > 4x4 px
  if (typeof window !== 'undefined' && gifUrl && typeof fetch === 'function') {
    fetch(gifUrl)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .then(async (buffer) => {
        if (!buffer) return
        if ('ImageDecoder' in window) {
          const decoder = new window.ImageDecoder({ data: buffer, type: 'image/gif' })
          await decoder.tracks.ready
          const track = decoder.tracks.selectedTrack
          const count = track?.frameCount || 1
          const frames = []
          for (let i = 0; i < count; i++) {
            const result = await decoder.decode({ frameIndex: i })
            if (result.image.displayWidth > 4 && result.image.displayHeight > 4) {
              frames.push(result.image)
            } else {
              result.image.close()
            }
          }
          if (frames.length > 0) {
            const w = Math.min(128, Math.max(16, frames[0].displayWidth || 32))
            const h = Math.min(128, Math.max(16, frames[0].displayHeight || 32))
            canvas.width = w
            canvas.height = h
            decodedFrames = frames
            hasRealGifArtwork = true
            stepAnimation()
            return
          }
        }

        // Fallback compatible si ImageDecoder no está disponible en el navegador
        const blob = new Blob([buffer], { type: 'image/gif' })
        const objectUrl = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
          if (img.naturalWidth > 4 && img.naturalHeight > 4) {
            canvas.width = Math.min(128, Math.max(16, img.naturalWidth))
            canvas.height = Math.min(128, Math.max(16, img.naturalHeight))
            decodedFrames = [img]
            hasRealGifArtwork = true
            stepAnimation()
          }
          URL.revokeObjectURL(objectUrl)
        }
        img.onerror = () => URL.revokeObjectURL(objectUrl)
        img.src = objectUrl
      })
      .catch(() => {
        // Mantiene el placeholder en blanco/32-bits si aún no existe el .gif artístico
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
    decodedFrames.forEach((f) => {
      if (typeof f.close === 'function') f.close()
    })
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
