/**
 * Catálogo Real de la NASA y Renderizador de Fotogramas (Opción B + Imágenes Directas)
 * Categoría NASA Space Apps: "The Earth Information Jukebox"
 * Lenguaje: JavaScript puro (ES6+)
 *
 * NOTA TÉCNICA (SVS #5153):
 * Obtenido mediante la API oficial de NASA SVS (https://svs.gsfc.nasa.gov/api/5153).
 * Dado que el servidor de SVS restringe CORS (access-control-allow-origin) a su propio dominio
 * autorizado, el video oficial de 31s (MC03_stage4_GMAO_CO_2048x1024_en.mp4) fue extraído en
 * 16 fotogramas locales (/public/nasa/svs-5153/frame_01.jpg .. frame_16.jpg) para permitir
 * la lectura directa de píxeles con ctx.getImageData() sin bloqueo CORS.
 */

export const NASA_CATEGORIES = ['espacial', 'maritimo', 'grafica', 'huracan']

export const RARITY_CONFIG = {
  comun: {
    id: 'comun',
    label: 'Común',
    probability: 0.5,
    hex: '#a3e635',
    threeColor: 0xa3e635,
    borderClass: 'border-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.45)]',
    badgeClass: 'bg-lime-950 text-lime-300 border-lime-500',
    description: '1 Voz Simple (Onda Cuadrada/Triangular 32-bits)',
  },
  raro: {
    id: 'raro',
    label: 'Raro',
    probability: 0.3,
    hex: '#38bdf8',
    threeColor: 0x38bdf8,
    borderClass: 'border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.55)]',
    badgeClass: 'bg-sky-950 text-sky-300 border-sky-400',
    description: 'Armonía Cuantizada + Reverberación Espacial',
  },
  epico: {
    id: 'epico',
    label: 'Épico',
    probability: 0.15,
    hex: '#c084fc',
    threeColor: 0xc084fc,
    borderClass: 'border-purple-400 shadow-[0_0_18px_rgba(192,132,252,0.65)]',
    badgeClass: 'bg-purple-950 text-purple-300 border-purple-400',
    description: 'Lectura Dual de Espectro + Filtros Dinámicos',
  },
  legendario: {
    id: 'legendario',
    label: 'Legendario',
    probability: 0.05,
    hex: '#facc15',
    threeColor: 0xfacc15,
    borderClass: 'border-yellow-400 shadow-[0_0_24px_rgba(250,204,21,0.85)]',
    badgeClass: 'bg-yellow-950 text-yellow-300 border-yellow-400',
    description: 'Capas Completas + Telemetría Narrada por Voz NASA',
  },
}

const SVS_5153_FRAMES = Array.from({ length: 16 }, (_, idx) => {
  const num = String(idx + 1).padStart(2, '0')
  return `/nasa/svs-5153/frame_${num}.jpg`
})

/**
 * Catálogo curado de discos NASA (Sin generación aleatoria/procedural).
 * Contiene únicamente NASA SVS #5153 como disco oficial inicial.
 */
export const CURATED_NASA_DISCS = [
  {
    id: 'nasa-svs-5153',
    svsId: 5153,
    svsUrl: 'https://svs.gsfc.nasa.gov/5153/',
    svsApiUrl: 'https://svs.gsfc.nasa.gov/api/5153',
    sourceVideoUrl:
      'https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005153/MC03_stage4_GMAO_CO_2048x1024_en.mp4',
    sourceMethod: 'api-frames',
    mediaType: 'frames',
    title: 'NASA SVS #5153: Carbon Monoxide (CO)',
    instrument: 'NASA GEOS-CF Model (GMAO)',
    date: '2023-09-26',
    narration:
      'Visualización científica NASA SVS 5153: Concentración global de monóxido de carbono cerca de la superficie estimada por el modelo GEOS-CF.',
    category: 'huracan',
    rarity: 'epico',
    durationSec: 31,
    frameIntervalMs: 1900,
    frames: SVS_5153_FRAMES,
    imageUrl: SVS_5153_FRAMES[0],
  },
]

// Caché de imágenes decodificadas fuera de la reactividad de Vue
const loadedImageCache = new Map()

/**
 * Carga una imagen (URL local o DataURL) con soporte CORS anónimo cuando es externa.
 */
export function loadImageElement(src) {
  if (!src || typeof Image === 'undefined') {
    return Promise.resolve(null)
  }

  const cached = loadedImageCache.get(src)
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached)
  }

  return new Promise((resolve) => {
    const img = new Image()
    if (/^https?:\/\//i.test(src)) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => {
      loadedImageCache.set(src, img)
      resolve(img)
    }
    img.onerror = () => {
      resolve(null)
    }
    img.src = src
  })
}

/**
 * Dibuja el fotograma indicado de un disco (secuencia Opción B o imagen directa)
 * en un <canvas> 2D.
 */
export async function renderDiscFrameToCanvas(canvas, disc, frameIndex = 0) {
  if (!canvas || !disc) return false
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return false

  const width = canvas.width || 256
  const height = canvas.height || 128

  const framesList =
    Array.isArray(disc.frames) && disc.frames.length > 0
      ? disc.frames
      : disc.imageUrl
        ? [disc.imageUrl]
        : []

  if (framesList.length === 0) {
    ctx.fillStyle = '#04070f'
    ctx.fillRect(0, 0, width, height)
    return false
  }

  const safeIdx = Math.max(0, Math.min(framesList.length - 1, frameIndex))
  const src = framesList[safeIdx]
  const img = await loadImageElement(src)

  if (!img) {
    ctx.fillStyle = '#04070f'
    ctx.fillRect(0, 0, width, height)
    return false
  }

  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  return true
}

// Alias retrocompatible
export const renderNasaDatasetToCanvas = renderDiscFrameToCanvas
