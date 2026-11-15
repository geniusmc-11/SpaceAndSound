/**
 * Perfiles de Leyenda (Colorbars) y Normalización RGB -> HSL -> [0.0 .. 1.0]
 * Desacopla completamente la escala visual de mapas NASA del motor de síntesis de audio.
 * Lenguaje: JavaScript puro (ES6+)
 */

/**
 * Diccionario de perfiles de mapas NASA:
 * Cada ID de mapa contiene su escala ordenada de stops HSL asociados a un valor
 * normalizado entre 0.0 (mínimo) y 1.0 (máximo).
 */
export const COLORBAR_PROFILES = {
  '5147': {
    id: '5147',
    name: 'Anomalía de Temperatura Global (SVS #5147)',
    unit: '°C',
    stops: [
      { value: 0.0, hsl: { h: 225, s: 0.85, l: 0.42 } }, // Azul frío mínimo
      { value: 0.25, hsl: { h: 190, s: 0.80, l: 0.52 } }, // Cian
      { value: 0.5, hsl: { h: 55, s: 0.88, l: 0.68 } }, // Amarillo/blanco neutro
      { value: 0.75, hsl: { h: 26, s: 0.94, l: 0.54 } }, // Naranja cálido
      { value: 1.0, hsl: { h: 2, s: 0.92, l: 0.46 } }, // Rojo extremo máximo
    ],
  },
  '5151': {
    id: '5151',
    name: 'Concentración PM2.5 Atmosférico (SVS #5151)',
    unit: 'µg/m³',
    stops: [
      { value: 0.0, hsl: { h: 205, s: 0.72, l: 0.62 } }, // Aire limpio (azul cielo)
      { value: 0.25, hsl: { h: 145, s: 0.68, l: 0.48 } }, // Moderado bajo (verde)
      { value: 0.5, hsl: { h: 52, s: 0.94, l: 0.54 } }, // Moderado (amarillo)
      { value: 0.75, hsl: { h: 16, s: 0.92, l: 0.52 } }, // Alto (naranja/rojo)
      { value: 1.0, hsl: { h: 305, s: 0.82, l: 0.42 } }, // Crítico (magenta/púrpura)
    ],
  },
  '5153': {
    id: '5153',
    name: 'Monóxido de Carbono CO - GEOS-CF (SVS #5153)',
    unit: 'ppbv',
    stops: [
      { value: 0.0, hsl: { h: 225, s: 0.65, l: 0.22 } }, // Fondo limpio (azul marino)
      { value: 0.25, hsl: { h: 185, s: 0.78, l: 0.45 } }, // Bajo (cian)
      { value: 0.55, hsl: { h: 54, s: 0.94, l: 0.55 } }, // Medio (amarillo)
      { value: 0.8, hsl: { h: 24, s: 0.95, l: 0.52 } }, // Alto (naranja)
      { value: 1.0, hsl: { h: 355, s: 0.92, l: 0.48 } }, // Muy alto (rojo intenso)
    ],
  },
  '5154': {
    id: '5154',
    name: 'Óxidos de Nitrógeno NOx (SVS #5154)',
    unit: 'ppbv',
    stops: [
      { value: 0.0, hsl: { h: 230, s: 0.60, l: 0.18 } },
      { value: 0.25, hsl: { h: 195, s: 0.75, l: 0.42 } },
      { value: 0.55, hsl: { h: 55, s: 0.92, l: 0.56 } },
      { value: 0.8, hsl: { h: 22, s: 0.94, l: 0.52 } },
      { value: 1.0, hsl: { h: 350, s: 0.90, l: 0.50 } },
    ],
  },
  '5149': {
    id: '5149',
    name: 'Precipitación y Nubes GEOS-FP (SVS #5149)',
    unit: 'mm/hr',
    stops: [
      { value: 0.0, hsl: { h: 215, s: 0.35, l: 0.20 } },
      { value: 0.3, hsl: { h: 195, s: 0.70, l: 0.55 } },
      { value: 0.55, hsl: { h: 140, s: 0.78, l: 0.48 } },
      { value: 0.8, hsl: { h: 48, s: 0.94, l: 0.54 } },
      { value: 1.0, hsl: { h: 315, s: 0.88, l: 0.52 } },
    ],
  },
  '5152': {
    id: '5152',
    name: 'Ozono Cercano a la Superficie O3 (SVS #5152)',
    unit: 'ppbv',
    stops: [
      { value: 0.0, hsl: { h: 220, s: 0.70, l: 0.32 } },
      { value: 0.3, hsl: { h: 175, s: 0.75, l: 0.48 } },
      { value: 0.55, hsl: { h: 65, s: 0.90, l: 0.54 } },
      { value: 0.8, hsl: { h: 26, s: 0.94, l: 0.52 } },
      { value: 1.0, hsl: { h: 355, s: 0.92, l: 0.46 } },
    ],
  },
  '5150': {
    id: '5150',
    name: 'Humedad Cercana a la Superficie (SVS #5150)',
    unit: 'g/kg',
    stops: [
      { value: 0.0, hsl: { h: 35, s: 0.55, l: 0.38 } }, // Seco (ocre/marrón)
      { value: 0.3, hsl: { h: 55, s: 0.50, l: 0.60 } },
      { value: 0.6, hsl: { h: 175, s: 0.75, l: 0.48 } }, // Húmedo (turquesa)
      { value: 1.0, hsl: { h: 215, s: 0.88, l: 0.42 } }, // Muy húmedo (azul profundo)
    ],
  },
  '5148': {
    id: '5148',
    name: 'Velocidad del Viento en Superficie (SVS #5148)',
    unit: 'm/s',
    stops: [
      { value: 0.0, hsl: { h: 225, s: 0.55, l: 0.22 } },
      { value: 0.3, hsl: { h: 190, s: 0.82, l: 0.48 } },
      { value: 0.6, hsl: { h: 120, s: 0.78, l: 0.52 } },
      { value: 0.85, hsl: { h: 42, s: 0.95, l: 0.55 } },
      { value: 1.0, hsl: { h: 320, s: 0.88, l: 0.55 } },
    ],
  },
  '4095': {
    id: '4095',
    name: 'Evaporación Potencial Norteamérica (SVS #4095)',
    unit: 'mm',
    stops: [
      { value: 0.0, hsl: { h: 195, s: 0.75, l: 0.42 } },
      { value: 0.35, hsl: { h: 120, s: 0.65, l: 0.52 } },
      { value: 0.7, hsl: { h: 45, s: 0.92, l: 0.54 } },
      { value: 1.0, hsl: { h: 6, s: 0.90, l: 0.45 } },
    ],
  },
  '2900': {
    id: '2900',
    name: 'Monóxido de Carbono MOPITT 2000 (SVS #2900)',
    unit: 'ppbv',
    stops: [
      { value: 0.0, hsl: { h: 235, s: 0.78, l: 0.35 } },
      { value: 0.3, hsl: { h: 185, s: 0.82, l: 0.50 } },
      { value: 0.6, hsl: { h: 55, s: 0.95, l: 0.55 } },
      { value: 1.0, hsl: { h: 2, s: 0.94, l: 0.48 } },
    ],
  },
  default: {
    id: 'default',
    name: 'Escala Espectral Estándar',
    unit: 'norm',
    stops: [
      { value: 0.0, hsl: { h: 240, s: 0.80, l: 0.45 } },
      { value: 0.25, hsl: { h: 180, s: 0.80, l: 0.50 } },
      { value: 0.5, hsl: { h: 120, s: 0.80, l: 0.48 } },
      { value: 0.75, hsl: { h: 55, s: 0.90, l: 0.55 } },
      { value: 1.0, hsl: { h: 0, s: 0.90, l: 0.50 } },
    ],
  },
}

/**
 * Normalización RGB [0..255] a HSL:
 * h: [0..360), s: [0..1], l: [0..1]
 */
export function rgbToHsl(r, g, b) {
  const rn = Math.max(0, Math.min(255, r)) / 255
  const gn = Math.max(0, Math.min(255, g)) / 255
  const bn = Math.max(0, Math.min(255, b)) / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (delta > 0.00001) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    if (max === rn) {
      h = (gn - bn) / delta + (gn < bn ? 6 : 0)
    } else if (max === gn) {
      h = (bn - rn) / delta + 2
    } else {
      h = (rn - gn) / delta + 4
    }
    h *= 60
  }

  return {
    h: (h + 360) % 360,
    s: Math.max(0, Math.min(1, s)),
    l: Math.max(0, Math.min(1, l)),
  }
}

/**
 * Distancia perceptual en espacio HSL ponderando matiz circular cuando hay saturación.
 */
function hslDistance(a, b) {
  const rawHueDiff = Math.abs(a.h - b.h)
  const circularHueDiff = Math.min(rawHueDiff, 360 - rawHueDiff) / 180 // [0..1]
  const satDiff = Math.abs(a.s - b.s)
  const lightDiff = Math.abs(a.l - b.l)

  // Cuando la saturación es baja (grises/blancos/negros), el matiz pierde peso
  const avgSat = (a.s + b.s) * 0.5
  const hueWeight = 2.2 * Math.max(0.15, avgSat)
  return Math.sqrt(
    hueWeight * circularHueDiff * circularHueDiff +
      0.7 * satDiff * satDiff +
      1.1 * lightDiff * lightDiff
  )
}

/**
 * Compara un color HSL contra los stops del perfil de mapa activo
 * e interpola entre los dos stops más cercanos para devolver un flotante limpio en [0.0, 1.0].
 */
export function mapHslToNormalizedValue(hsl, mapId = 'default') {
  const profile = COLORBAR_PROFILES[String(mapId)] || COLORBAR_PROFILES.default
  const stops = profile.stops
  if (!stops || stops.length === 0) return 0

  let closestA = null
  let closestB = null
  let distA = Infinity
  let distB = Infinity

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i]
    const d = hslDistance(hsl, stop.hsl)
    if (d < distA) {
      distB = distA
      closestB = closestA
      distA = d
      closestA = stop
    } else if (d < distB) {
      distB = d
      closestB = stop
    }
  }

  if (!closestA) return 0
  if (distA < 0.0001 || !closestB) {
    return Math.max(0, Math.min(1, closestA.value))
  }

  // Interpolación lineal ponderada por cercanía entre los 2 stops más próximos
  const invSum = distA + distB
  const t = invSum > 0 ? distA / invSum : 0
  const interpolated = closestA.value + (closestB.value - closestA.value) * t

  return Math.max(0, Math.min(1, Number(interpolated.toFixed(4))))
}

/**
 * Convierte directamente un píxel RGB leído con getImageData() al valor normalizado [0.0 .. 1.0]
 * del perfil de mapa seleccionado (Salida limpia sin exponer canales RGB).
 */
export function mapRgbPixelToNormalizedValue(r, g, b, mapId = 'default') {
  const hsl = rgbToHsl(r, g, b)
  return mapHslToNormalizedValue(hsl, mapId)
}
