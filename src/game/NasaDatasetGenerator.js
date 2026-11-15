/**
 * Generador de Metadatos y Visualizaciones Procedurales de la NASA
 * Categoría NASA Space Apps: "The Earth Information Jukebox"
 * Lenguaje: JavaScript puro (ES6+)
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

export const NASA_CATALOG = {
  espacial: [
    {
      title: 'JWST Carina Nebula IR-UV',
      instrument: 'NIRCam / MIRI Deep Field',
      date: '2025-07-12',
      narration:
        'Archivo NASA JWST: Pilares de gas infrarrojo y cúmulos estelares ultravioleta en la Nebulosa de Carina.',
    },
    {
      title: 'Hubble Vela Supernova Remnant',
      instrument: 'WFC3 Spectral Imager',
      date: '2024-11-03',
      narration:
        'Archivo NASA Hubble: Filamentos de choque ionizados y estrellas de neutrones de alta energía.',
    },
  ],
  maritimo: [
    {
      title: 'SWOT Global Sea Surface Height',
      instrument: 'KaRIn Radar Interferometer',
      date: '2026-02-19',
      narration:
        'Archivo NASA SWOT: Anomalías del nivel del mar y corrientes abisales del Atlántico Norte.',
    },
    {
      title: 'PACE Ocean Chlorophyll & Tide',
      instrument: 'OCI Hyperspectral Radiometer',
      date: '2025-09-28',
      narration:
        'Archivo NASA PACE: Elevación oceánica costera comparada con la línea base histórica global.',
    },
  ],
  grafica: [
    {
      title: 'GISS Global Temp Anomaly Series',
      instrument: 'GISTEMP v4 Telemetry',
      date: '2026-01-15',
      narration:
        'Archivo NASA GISS: Serie temporal de anomalías térmicas globales y radiación solar.',
    },
    {
      title: 'OCO-3 Atmospheric CO2 Curve',
      instrument: 'ISS Spectrophotometer',
      date: '2025-12-01',
      narration:
        'Archivo NASA OCO-3: Curva espectral de concentración de dióxido de carbono troposférico.',
    },
  ],
  huracan: [
    {
      title: 'GOES-18 Hurricane Milton Thermal Eye',
      instrument: 'ABI Band 13 Clean IR',
      date: '2024-10-08',
      narration:
        'Archivo NASA GOES: Mapa de calor infrarrojo del vórtice ciclónico y bandas convectivas extremas.',
    },
    {
      title: 'TROPICS Cyclone Rapid Intensification',
      instrument: 'CubeSat Microwave Radiometer',
      date: '2025-08-22',
      narration:
        'Archivo NASA TROPICS: Distribución térmica de núcleo cálido frente a frentes fríos periféricos.',
    },
  ],
}

/**
 * Dibuja en un <canvas> 2D el dataset científico de la NASA según la categoría y semilla del disco.
 * Cumple exactamente con los umbrales RGB que lee useSonifier.js:
 * - grafica: curva brillante en Y de izquierda a derecha.
 * - maritimo: línea guía blanca (R,G,B > 225) + masa de agua azul/cian que sube y baja.
 * - espacial: estrellas ultra brillantes (R+G+B > 690) + nubes difusas rojas (IR) y azules (UV).
 * - huracan: columnas con proporción variable de píxeles cálidos (rojos/naranjas) vs. fríos (azules).
 */
export function renderNasaDatasetToCanvas(canvas, disc) {
  if (!canvas || !disc) return
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  const width = canvas.width || 256
  const height = canvas.height || 128
  const seed = Number(disc.seed || 42)
  const category = disc.category || 'grafica'

  // Fondo oscuro profundo
  ctx.fillStyle = '#04070f'
  ctx.fillRect(0, 0, width, height)

  // Rejilla sutil de fondo
  ctx.strokeStyle = 'rgba(30, 58, 95, 0.22)'
  ctx.lineWidth = 1
  for (let gx = 0; gx < width; gx += 32) {
    ctx.beginPath()
    ctx.moveTo(gx, 0)
    ctx.lineTo(gx, height)
    ctx.stroke()
  }
  for (let gy = 0; gy < height; gy += 32) {
    ctx.beginPath()
    ctx.moveTo(0, gy)
    ctx.lineTo(width, gy)
    ctx.stroke()
  }

  if (category === 'grafica') {
    // Serie de tiempo brillante cuantizable en eje Y
    for (let x = 0; x < width; x++) {
      const t = x / width
      const wave1 = Math.sin(t * Math.PI * 4 + seed) * 0.28
      const wave2 = Math.cos(t * Math.PI * 9 - seed * 0.5) * 0.14
      const trend = (t - 0.5) * 0.25
      const normY = Math.max(0.1, Math.min(0.9, 0.5 - (wave1 + wave2 + trend)))
      const y = Math.floor(normY * (height - 1))

      // Estela inferior suave
      ctx.fillStyle = 'rgba(16, 185, 129, 0.18)'
      ctx.fillRect(x, y, 1, height - y)

      // Píxel brillante principal (alta luminancia para lectura de pitch en eje Y)
      ctx.fillStyle = 'rgb(245, 255, 180)'
      ctx.fillRect(x, Math.max(0, y - 1), 1, 3)
    }
  } else if (category === 'maritimo') {
    // Síntesis dual: Línea guía blanca (R,G,B > 225) + área azul/cian
    for (let x = 0; x < width; x++) {
      const t = x / width
      // Línea guía blanca de referencia (oscila suavemente en la mitad del canvas)
      const whiteY = Math.floor(
        height * 0.52 + Math.sin(t * Math.PI * 2 + seed) * (height * 0.1)
      )

      // Nivel del mar azul/cian (a veces supera la línea blanca: seaY < whiteY)
      const tideOffset =
        Math.sin(t * Math.PI * 5 + seed * 1.3) * (height * 0.24) +
        Math.cos(t * Math.PI * 11) * (height * 0.08)
      const seaY = Math.max(8, Math.min(height - 8, Math.floor(height * 0.5 - tideOffset)))

      // Rellenar columna de agua azul/cian desde seaY hasta el fondo
      for (let y = seaY; y < height; y++) {
        const isAboveGuide = y < whiteY
        ctx.fillStyle = isAboveGuide ? 'rgb(30, 220, 255)' : 'rgb(15, 135, 215)'
        ctx.fillRect(x, y, 1, 1)
      }

      // Dibujar la línea guía blanca encima (R,G,B > 225 garantizado: 250, 252, 255)
      ctx.fillStyle = 'rgb(250, 252, 255)'
      ctx.fillRect(x, Math.max(0, whiteY - 1), 1, 2)
    }
  } else if (category === 'espacial') {
    // Nubes difusas rojas (IR) y azules (UV) + estrellas ultra brillantes (R+G+B > 690)
    for (let x = 0; x < width; x++) {
      const t = x / width
      const redCloudCenter = height * (0.62 + 0.2 * Math.sin(t * Math.PI * 3 + seed))
      const blueCloudCenter = height * (0.35 + 0.2 * Math.cos(t * Math.PI * 4 - seed))

      for (let y = 0; y < height; y += 2) {
        const distRed = Math.abs(y - redCloudCenter)
        const distBlue = Math.abs(y - blueCloudCenter)

        if (distRed < 24) {
          const intensity = Math.floor(195 * (1 - distRed / 24))
          ctx.fillStyle = `rgb(${intensity}, ${Math.floor(intensity * 0.28)}, ${Math.floor(intensity * 0.2)})`
          ctx.fillRect(x, y, 1, 2)
        } else if (distBlue < 22) {
          const intensity = Math.floor(200 * (1 - distBlue / 22))
          ctx.fillStyle = `rgb(${Math.floor(intensity * 0.22)}, ${Math.floor(intensity * 0.55)}, ${intensity})`
          ctx.fillRect(x, y, 1, 2)
        }
      }
    }

    // Estrellas ultra brillantes (R+G+B > 690, ej. 250+250+245 = 745)
    const starCount = 38
    for (let i = 0; i < starCount; i++) {
      const sx = Math.floor(((i * 73 + seed * 19) % (width - 6)) + 3)
      const sy = Math.floor(((i * 41 + seed * 31) % (height - 6)) + 3)
      ctx.fillStyle = 'rgb(252, 250, 245)'
      ctx.fillRect(sx, sy, 2, 2)
    }
  } else if (category === 'huracan') {
    // Mapa de calor: proporción de píxeles cálidos vs. fríos por columna
    const centerX = width * 0.5 + Math.sin(seed) * (width * 0.12)
    const centerY = height * 0.5

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y += 2) {
        const dx = (x - centerX) / (width * 0.45)
        const dy = (y - centerY) / (height * 0.45)
        const radius = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)
        const spiral = Math.sin(radius * 10 - angle * 3 + seed)

        if (radius < 0.14) {
          // Ojo del huracán (frío/calmo)
          ctx.fillStyle = 'rgb(25, 165, 235)'
        } else if (radius < 0.58 && spiral > -0.25) {
          // Pared del ojo y bandas convectivas cálidas (R alto, B bajo)
          const heat = Math.min(255, Math.floor(200 + spiral * 55))
          ctx.fillStyle = `rgb(${heat}, ${Math.floor(heat * 0.42)}, 25)`
        } else if (spiral > 0.35) {
          // Bandas templadas/cálidas secundarias
          ctx.fillStyle = 'rgb(225, 120, 35)'
        } else {
          // Masa periférica fría (azul/violeta)
          ctx.fillStyle = 'rgb(30, 110, 220)'
        }
        ctx.fillRect(x, y, 1, 2)
      }
    }
  }
}
