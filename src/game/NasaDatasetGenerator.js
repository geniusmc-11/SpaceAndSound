/**
 * Catálogo Real de la NASA, Cliente API SVS y Renderizador de Fotogramas
 * Categoría NASA Space Apps: "The Earth Information Jukebox"
 * Lenguaje: JavaScript puro (ES6+)
 */

import { EXTRA_SVS_DISCS } from './NasaSvsCatalog'

export const NASA_CATEGORIES = [
  'espacial',
  'maritimo',
  'grafica',
  'huracan',
  'maps',
  'planetario',
]

export const RARITY_CONFIG = {
  comun: {
    id: 'comun',
    label: 'Common',
    probability: 0.5,
    hex: '#a3e635',
    threeColor: 0xa3e635,
    borderClass: 'border-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.45)]',
    badgeClass: 'bg-lime-950 text-lime-300 border-lime-500',
    description: '1 Simple Voice (32-bit Square/Triangle Wave)',
  },
  raro: {
    id: 'raro',
    label: 'Rare',
    probability: 0.3,
    hex: '#38bdf8',
    threeColor: 0x38bdf8,
    borderClass: 'border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.55)]',
    badgeClass: 'bg-sky-950 text-sky-300 border-sky-400',
    description: 'Quantized Harmony + Spatial Reverb',
  },
  epico: {
    id: 'epico',
    label: 'Epic',
    probability: 0.15,
    hex: '#c084fc',
    threeColor: 0x31515a,
    borderClass: 'border-purple-400 shadow-[0_0_18px_rgba(192,132,252,0.65)]',
    badgeClass: 'bg-purple-950 text-purple-300 border-purple-400',
    description: 'Dual Spectrum Scan + Dynamic Filters',
  },
  legendario: {
    id: 'legendario',
    label: 'Legendary',
    probability: 0.05,
    hex: '#D18C39',
    threeColor: 0xd18c39,
    borderClass: 'border-[#D18C39] shadow-[0_0_24px_rgba(209,140,57,0.85)]',
    badgeClass: 'bg-[#1D303B] text-[#E7D5AC] border-[#D18C39]',
    description: 'Full Harmonic Layers + Interactive Pixel Hover + NASA Voice Telemetry',
  },
}

const SVS_5153_FRAMES = Array.from({ length: 16 }, (_, idx) => {
  const num = String(idx + 1).padStart(2, '0')
  return `/nasa/svs-5153/frame_${num}.jpg`
})

const SVS_5153_FALLBACK_TOPIC = {
  svsId: 5153,
  source: 'cache',
  title: 'Carbon Monoxide (CO)',
  summary:
    'Near-surface concentration of carbon monoxide (CO) estimated by NASA’s GEOS-CF model.',
  releaseDate: '2023-09-26',
  credits: ['Joseph V. Ardizzone (NASA/GSFC)'],
  keywords: ['Atmospheric Composition', 'Earth Information Center', 'GMAO', 'Hyperwall'],
  paragraphs: [
    'Air pollution forecasts are created using complex models that combine meteorological data with emissions, chemical transformation, and transport of chemical species and particulate matter. The Goddard Earth Observing System Composition Forecasting (GEOS-CF) system is a research model maintained by NASA’s Global Modeling and Assimilation Office (GMAO) to understand the causes and impacts of air pollution.',
    'GEOS-CF tracks concentrations of hundreds of gas-phase chemical species and dozens of particle types based on their composition and size. It is used globally to improve local air quality forecasts, study human health impacts, and calibrate NASA satellite datasets.',
    'Carbon monoxide (CO), consisting of one carbon and one oxygen atom, arises from incomplete combustion in vehicles, industry, residential wood burning, and wildfires. At very high concentrations it interferes with oxygen transport in the bloodstream; with an atmospheric lifetime of roughly two months, CO travels long distances driven by global weather patterns.',
  ],
  moreInfoUrl: 'https://gmao.gsfc.nasa.gov/gmao-products/geos-cf/',
  svsUrl: 'https://svs.gsfc.nasa.gov/5153/',
}

/**
 * Curated catalog of NASA discs (no random/procedural generation).
 * Contains the 20 real NASA SVS datasets (#5153 + 19 additional).
 */
export const CURATED_NASA_DISCS = [
  {
    id: 'nasa-svs-5153',
    svsId: 5153,
    svsUrl: 'https://svs.gsfc.nasa.gov/5153/',
    svsApiUrl: 'https://svs.gsfc.nasa.gov/api/5153',
    sourceVideoUrl:
      'https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005153/MC03_stage4_GMAO_CO_2048x1024_en.mp4',
    colorbarUrl: '/nasa/svs-5153/colorbar.png',
    sourceMethod: 'api-frames',
    mediaType: 'frames',
    title: 'NASA SVS #5153: Carbon Monoxide (CO)',
    instrument: 'NASA GEOS-CF Model (GMAO)',
    date: '2023-09-26',
    narration:
      'NASA SVS 5153 scientific visualization: Near-surface global carbon monoxide concentration estimated by the GEOS-CF model.',
    category: 'maps',
    mapProfileId: '5153',
    ambientStyle: 'maritimo',
    rarity: 'legendario',
    durationSec: 31,
    frameIntervalMs: 1900,
    frames: SVS_5153_FRAMES,
    imageUrl: SVS_5153_FRAMES[0],
    topicInfo: SVS_5153_FALLBACK_TOPIC,
  },
  ...EXTRA_SVS_DISCS,
]

function stripHtmlToParagraphs(html) {
  if (!html || typeof html !== 'string') return []
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function extractFirstUrl(text) {
  if (!text || typeof text !== 'string') return null
  const match = text.match(/https?:\/\/[^\s)\]]+/i)
  return match ? match[0] : null
}

/**
 * Consulta la API de NASA SVS (/svs-api/:id en desarrollo con proxy Vite)
 * para integrar información científica en tiempo real acerca del tema.
 * Si no hay red o CORS en build estático, devuelve el snapshot curado de la API.
 */
export async function fetchSvsTopicInfo(svsId) {
  if (!svsId) return null

  const fallback =
    CURATED_NASA_DISCS.find((d) => d.svsId === Number(svsId))?.topicInfo || null

  if (typeof fetch !== 'function') {
    return fallback
  }

  try {
    const response = await fetch(`/svs-api/${svsId}`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return fallback
    const data = await response.json()

    const creditsList = []
    if (data.main_credits && typeof data.main_credits === 'object') {
      Object.values(data.main_credits).forEach((entries) => {
        if (Array.isArray(entries)) {
          entries.forEach((entry) => {
            if (entry?.name) {
              creditsList.push(
                entry.employer ? `${entry.name} (${entry.employer})` : entry.name
              )
            }
          })
        }
      })
    }

    const htmlGroup = Array.isArray(data.media_groups)
      ? data.media_groups.find((g) => g.widget === 'Basic text with HTML')
      : null
    const infoGroup = Array.isArray(data.media_groups)
      ? data.media_groups.find(
          (g) => g.widget === 'Basic text' && /more information/i.test(g.title || '')
        )
      : null

    const apiParagraphs = stripHtmlToParagraphs(htmlGroup?.description || '')
    const moreInfoUrl =
      extractFirstUrl(infoGroup?.description || '') || fallback?.moreInfoUrl || null

    return {
      svsId: Number(svsId),
      source: 'api-live',
      title: data.title || fallback?.title || `NASA SVS #${svsId}`,
      summary: data.description || fallback?.summary || '',
      releaseDate: (data.release_date || '').slice(0, 10) || fallback?.releaseDate || '',
      credits: creditsList.length > 0 ? creditsList : fallback?.credits || [],
      keywords: Array.isArray(data.keywords) ? data.keywords : fallback?.keywords || [],
      // Conservamos los párrafos de la API o los traducidos si coincide con SVS #5153
      paragraphs:
        Number(svsId) === 5153 && fallback?.paragraphs?.length
          ? fallback.paragraphs
          : apiParagraphs,
      rawApiParagraphs: apiParagraphs,
      moreInfoUrl,
      svsUrl: `https://svs.gsfc.nasa.gov/${svsId}/`,
    }
  } catch {
    return fallback
  }
}

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

export const renderNasaDatasetToCanvas = renderDiscFrameToCanvas
