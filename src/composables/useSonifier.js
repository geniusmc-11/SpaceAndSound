/**
 * Motor de Sonificación Modular (useSonifier.js)
 * Categoría NASA Space Apps: "The Earth Information Jukebox"
 *
 * RENDIMIENTO CRÍTICO:
 * - El <canvas> oculto usa { willReadFrequently: true }.
 * - El arreglo de píxeles (pixelBuffer), el puntero scanX y todas las instancias
 *   de Tone.js / Web Audio viven FUERA de ref() y reactive() para jamás saturar
 *   el sistema de reactividad de Vue durante el barrido en tiempo real.
 */

import { ref } from 'vue'
import * as Tone from 'tone'
import { renderNasaDatasetToCanvas } from '@/game/NasaDatasetGenerator'

// Escalas musicales cuantizadas (notación científica para Tone.js)
const SCALES = {
  grafica: ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5'],
  maritimo: ['D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5'],
  espacialHigh: ['C5', 'D5', 'F#5', 'G5', 'A5', 'B5', 'D6', 'E6', 'F#6', 'G6'],
  espacialIR: [
    ['C2', 'G2', 'Eb3'],
    ['D2', 'A2', 'F3'],
    ['Eb2', 'Bb2', 'G3'],
    ['F2', 'C3', 'Ab3'],
  ],
  espacialUV: [
    ['C4', 'E4', 'G4', 'B4'],
    ['D4', 'F#4', 'A4', 'C#5'],
    ['E4', 'G#4', 'B4', 'D#5'],
    ['G4', 'B4', 'D5', 'F#5'],
  ],
  huracanCalm: ['C3', 'G3', 'D4', 'E4', 'G4', 'A4', 'C5'],
  huracanTense: ['C3', 'Db3', 'E3', 'F#3', 'G3', 'Ab3', 'B3', 'C4', 'Db4', 'E4', 'F#4', 'Bb4'],
}

// ============================================================================
// VARIABLES NO REACTIVAS (Fuera de ref() / reactive() por rendimiento crítico)
// ============================================================================
let hiddenCanvas = null
let hiddenCtx = null
let pixelBuffer = null // Uint8ClampedArray completo de la imagen
let canvasWidth = 256
let canvasHeight = 128
let scanX = 0 // Puntero horizontal actual (0 .. canvasWidth - 1)
let scanTimerId = null
let audioInitialized = false

// Instancias de Tone.js (estrictamente fuera de Vue Reactivity)
let leadSynth = null
let harmonySynth = null
let bassDrone = null
let pluckSynth = null
let padPolySynth = null
let filterNode = null
let reverbNode = null

// Suscriptores de frame para actualizar la línea láser vertical y telemetría DOM sin re-renderizar Vue
const scanListeners = new Set()

// Estado reactivo mínimo únicamente para botones de la UI (Play/Pause y modo activo)
const isRunning = ref(false)
const activeMode = ref('grafica')
const activeRarity = ref('comun')

function ensureHiddenCanvas() {
  if (!hiddenCanvas && typeof document !== 'undefined') {
    hiddenCanvas = document.createElement('canvas')
    hiddenCanvas.width = canvasWidth
    hiddenCanvas.height = canvasHeight
    hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true })
  }
  return hiddenCtx
}

async function ensureAudioGraph() {
  if (audioInitialized) return true
  try {
    await Tone.start()
    filterNode = new Tone.Filter({
      frequency: 1800,
      type: 'lowpass',
      rolloff: -12,
    }).toDestination()

    reverbNode = new Tone.Reverb({
      decay: 2.8,
      wet: 0.35,
    }).connect(filterNode)

    leadSynth = new Tone.Synth({
      oscillator: { type: 'square8' },
      envelope: { attack: 0.01, decay: 0.12, sustain: 0.2, release: 0.25 },
      volume: -10,
    }).connect(reverbNode)

    harmonySynth = new Tone.Synth({
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.25, release: 0.35 },
      volume: -14,
    }).connect(reverbNode)

    bassDrone = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.4 },
      volume: -15,
    }).connect(filterNode)

    pluckSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.002, decay: 0.18, sustain: 0.0, release: 0.2 },
      volume: -9,
    }).connect(reverbNode)

    padPolySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.08, decay: 0.3, sustain: 0.4, release: 0.6 },
      volume: -16,
    }).connect(reverbNode)

    audioInitialized = true
    return true
  } catch {
    // En entornos de test (JSDOM) o sin gesto de usuario previo, evitamos romper la ejecución
    return false
  }
}

/**
 * Lee un píxel del buffer plano no reactivo en la coordenada (x, y)
 */
function getPixelAt(x, y) {
  if (!pixelBuffer) return { r: 0, g: 0, b: 0 }
  const clampedX = Math.max(0, Math.min(canvasWidth - 1, x))
  const clampedY = Math.max(0, Math.min(canvasHeight - 1, y))
  const idx = (clampedY * canvasWidth + clampedX) * 4
  return {
    r: pixelBuffer[idx] || 0,
    g: pixelBuffer[idx + 1] || 0,
    b: pixelBuffer[idx + 2] || 0,
  }
}

/**
 * Escalamiento por Rareza:
 * - comun: 1 voz simple
 * - raro: Añade armonía + Reverb
 * - epico: Lectura dual + filtros dinámicos
 * - legendario: Todas las capas + síntesis de voz (window.speechSynthesis) al iniciar
 */
function applyRarityScaling(rarity, primaryNote, harmonyNote, normLuminance, mirrorNote) {
  if (!audioInitialized || !leadSynth) return

  // Ajustar Reverb y Filtro según rareza
  if (reverbNode) {
    reverbNode.wet.value = rarity === 'comun' ? 0.08 : rarity === 'raro' ? 0.42 : 0.58
  }

  if (filterNode && (rarity === 'epico' || rarity === 'legendario')) {
    const cutoff = 450 + Math.floor(normLuminance * 3800)
    filterNode.frequency.value = Math.max(300, Math.min(5000, cutoff))
  } else if (filterNode) {
    filterNode.frequency.value = 2400
  }

  // Voz 1 (Presente en todas las rarezas: comun, raro, epico, legendario)
  if (primaryNote) {
    leadSynth.triggerAttackRelease(primaryNote, '16n')
  }

  // Voz 2: Armonía + Reverb (raro, epico, legendario)
  if (
    (rarity === 'raro' || rarity === 'epico' || rarity === 'legendario') &&
    harmonyNote &&
    harmonySynth
  ) {
    harmonySynth.triggerAttackRelease(harmonyNote, '8n')
  }

  // Voz 3: Lectura espectral dual (epico, legendario)
  if ((rarity === 'epico' || rarity === 'legendario') && mirrorNote && pluckSynth) {
    pluckSynth.triggerAttackRelease(mirrorNote, '16n')
  }
}

/**
 * PATRÓN ESTRATEGIA: 4 Modos Cuantizados a Escalas Musicales
 */
const SONIFICATION_STRATEGIES = {
  /**
   * 1. grafica (Series de tiempo):
   * Barrido de izquierda a derecha; el eje Y con píxeles brillantes controla el pitch.
   */
  grafica(colX, rarity) {
    let brightestY = Math.floor(canvasHeight / 2)
    let maxLuma = -1

    for (let y = 0; y < canvasHeight; y += 2) {
      const { r, g, b } = getPixelAt(colX, y)
      const luma = r + g + b
      if (luma > maxLuma) {
        maxLuma = luma
        brightestY = y
      }
    }

    const normHeight = 1 - brightestY / Math.max(1, canvasHeight - 1)
    const scale = SCALES.grafica
    const noteIdx = Math.min(scale.length - 1, Math.max(0, Math.floor(normHeight * scale.length)))
    const primaryNote = scale[noteIdx]
    const harmonyNote = scale[Math.min(scale.length - 1, noteIdx + 2)]

    // Lectura dual (columna espejo para épico/legendario)
    const mirrorX = canvasWidth - 1 - colX
    const { g: mg, b: mb } = getPixelAt(mirrorX, brightestY)
    const mirrorIdx = Math.min(scale.length - 1, Math.floor(((mg + mb) / 510) * scale.length))
    const mirrorNote = scale[mirrorIdx]

    applyRarityScaling(rarity, primaryNote, harmonyNote, maxLuma / 765, mirrorNote)

    return {
      mode: 'grafica',
      primaryNote,
      normValue: Number(normHeight.toFixed(2)),
      detail: `Pitch Y: ${Math.round(normHeight * 100)}% (${primaryNote})`,
    }
  },

  /**
   * 2. maritimo (Nivel del mar):
   * Síntesis dual; detecta la línea guía blanca (R,G,B > 225) para controlar un bajo/drone continuo,
   * y el área azul/cian para disparar notas melódicas (mayor intensidad si supera la línea blanca).
   */
  maritimo(colX, rarity) {
    let whiteLineY = Math.floor(canvasHeight * 0.5)
    let highestBlueY = canvasHeight
    let bluePixelCount = 0

    for (let y = 0; y < canvasHeight; y += 2) {
      const { r, g, b } = getPixelAt(colX, y)
      if (r > 225 && g > 225 && b > 225) {
        whiteLineY = y
      } else if (b > 130 && g > 90 && b > r * 1.2) {
        bluePixelCount++
        if (y < highestBlueY) {
          highestBlueY = y
        }
      }
    }

    // Bajo/drone continuo controlado por la altura de la línea guía blanca
    const droneNorm = 1 - whiteLineY / canvasHeight
    const scale = SCALES.maritimo
    const bassNote = droneNorm > 0.52 ? 'D2' : 'A1'
    if (audioInitialized && bassDrone && colX % 2 === 0) {
      bassDrone.triggerAttackRelease(bassNote, '8n')
    }

    // Nota melódica del nivel del mar azul/cian
    const seaNorm = 1 - highestBlueY / canvasHeight
    const noteIdx = Math.min(scale.length - 1, Math.max(0, Math.floor(seaNorm * scale.length)))
    const primaryNote = scale[noteIdx]
    const surpassesWhiteGuide = highestBlueY < whiteLineY
    const harmonyNote = surpassesWhiteGuide
      ? scale[Math.min(scale.length - 1, noteIdx + 4)]
      : scale[Math.min(scale.length - 1, noteIdx + 2)]

    if (audioInitialized && leadSynth) {
      // Mayor intensidad (+4dB) cuando el área azul/cian supera la línea blanca
      leadSynth.volume.value = surpassesWhiteGuide ? -6 : -12
    }

    const mirrorNote = scale[(noteIdx + 5) % scale.length]
    applyRarityScaling(
      rarity,
      primaryNote,
      harmonyNote,
      bluePixelCount / (canvasHeight * 0.5),
      mirrorNote
    )

    return {
      mode: 'maritimo',
      primaryNote,
      normValue: Number(seaNorm.toFixed(2)),
      detail: surpassesWhiteGuide
        ? `MAREA ALTA > GUÍA BLANCA (${primaryNote} + DRONE ${bassNote})`
        : `NIVEL MARÍTIMO NOMINAL (${primaryNote} / DRONE ${bassNote})`,
    }
  },

  /**
   * 3. espacial (Nebulosas/Estrellas):
   * Puntos ultra brillantes (R+G+B > 690) disparan notas agudas tipo pluck/arpa;
   * nubes difusas disparan acordes con Reverb (graves para gases rojos/IR, agudos para azules/UV).
   */
  espacial(colX, rarity) {
    let starY = -1
    let redEnergy = 0
    let blueEnergy = 0

    for (let y = 0; y < canvasHeight; y += 2) {
      const { r, g, b } = getPixelAt(colX, y)
      const sum = r + g + b
      if (sum > 690 && starY === -1) {
        starY = y
      } else if (sum > 90) {
        if (r > b * 1.25) redEnergy += r
        if (b >= r) blueEnergy += b
      }
    }

    const highScale = SCALES.espacialHigh
    let primaryNote = 'G5'

    // Si hay punto ultra brillante (R+G+B > 690) -> Pluck/arpa aguda
    if (starY !== -1) {
      const starNorm = 1 - starY / canvasHeight
      const idx = Math.min(highScale.length - 1, Math.floor(starNorm * highScale.length))
      primaryNote = highScale[idx]
      if (audioInitialized && pluckSynth) {
        pluckSynth.triggerAttackRelease(primaryNote, '16n')
      }
    }

    // Nubes difusas -> Acordes con Reverb (Graves para rojo/IR, Agudos para azul/UV)
    const isInfraredDominant = redEnergy > blueEnergy
    const chordPool = isInfraredDominant ? SCALES.espacialIR : SCALES.espacialUV
    const chord = chordPool[colX % chordPool.length]

    if (audioInitialized && padPolySynth && colX % 3 === 0) {
      padPolySynth.triggerAttackRelease(chord, '4n')
    }

    const normLuma = Math.min(1, (redEnergy + blueEnergy) / (canvasHeight * 120))
    if (rarity !== 'comun') {
      applyRarityScaling(rarity, chord[0], chord[1], normLuma, primaryNote)
    }

    return {
      mode: 'espacial',
      primaryNote: starY !== -1 ? primaryNote : chord.join('-'),
      normValue: Number(normLuma.toFixed(2)),
      detail:
        starY !== -1
          ? `ESTRELLA >690 RGB PLUCK (${primaryNote})`
          : isInfraredDominant
            ? `NEBULOSA IR GRAVE (${chord.join(' ')})`
            : `NEBULOSA UV AGUDA (${chord.join(' ')})`,
    }
  },

  /**
   * 4. huracan (Mapas de calor):
   * Evalúa la proporción de colores cálidos vs. fríos en la columna escaneada
   * para modular la tensión armónica y el ritmo.
   */
  huracan(colX, rarity) {
    let warmCount = 0
    let coldCount = 0

    for (let y = 0; y < canvasHeight; y += 2) {
      const { r, b } = getPixelAt(colX, y)
      if (r > 150 && r > b * 1.35) {
        warmCount++
      } else if (b > 130 && b > r * 1.15) {
        coldCount++
      }
    }

    const total = Math.max(1, warmCount + coldCount)
    const warmRatio = warmCount / total // 0.0 (frío) .. 1.0 (cálido extremo)
    const isHighTension = warmRatio > 0.52
    const activeScale = isHighTension ? SCALES.huracanTense : SCALES.huracanCalm

    const idx = Math.min(
      activeScale.length - 1,
      Math.floor(warmRatio * (activeScale.length - 1))
    )
    const primaryNote = activeScale[idx]
    const harmonyOffset = isHighTension ? 1 : 2 // Segunda menor tensa vs tercera/quinta consonante
    const harmonyNote =
      activeScale[Math.min(activeScale.length - 1, idx + harmonyOffset)]
    const mirrorNote = activeScale[(idx + 4) % activeScale.length]

    applyRarityScaling(rarity, primaryNote, harmonyNote, warmRatio, mirrorNote)

    return {
      mode: 'huracan',
      primaryNote,
      warmRatio,
      normValue: Number(warmRatio.toFixed(2)),
      detail: `CALOR ${Math.round(warmRatio * 100)}% // ${
        isHighTension ? 'TENSIÓN CICLÓNICA ALTA' : 'FRENTE FRÍO ESTABLE'
      } (${primaryNote})`,
    }
  },
}

/**
 * Narración por síntesis de voz para discos de rareza Legendaria
 */
function speakLegendaryMetadata(disc) {
  if (!disc || disc.rarity !== 'legendario') return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(
      disc.narration ||
        `Archivo Legendario de la NASA: ${disc.title}. Instrumento ${disc.instrument}.`
    )
    utterance.lang = 'es-ES'
    utterance.rate = 1.02
    utterance.pitch = 0.92
    window.speechSynthesis.speak(utterance)
  } catch {
    // Ignorar si el navegador bloquea speechSynthesis sin interacción
  }
}

export function useSonifier() {
  /**
   * Carga un disco NASA en el canvas oculto ({ willReadFrequently: true })
   * y extrae su arreglo de píxeles fuera de la reactividad de Vue.
   */
  function loadDisc(disc) {
    if (!disc) return
    const ctx = ensureHiddenCanvas()
    activeMode.value = disc.category || 'grafica'
    activeRarity.value = disc.rarity || 'comun'
    scanX = 0

    if (ctx && hiddenCanvas) {
      renderNasaDatasetToCanvas(hiddenCanvas, disc)
      const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
      pixelBuffer = imageData.data
    }
  }

  /**
   * Ejecuta un paso de escaneo en la columna actual scanX y avanza el láser.
   */
  function stepScan() {
    if (!pixelBuffer) return null
    const strategy =
      SONIFICATION_STRATEGIES[activeMode.value] || SONIFICATION_STRATEGIES.grafica
    const telemetry = strategy(scanX, activeRarity.value)
    const normalizedX = scanX / Math.max(1, canvasWidth - 1)

    // Notificar a suscriptores DOM (ej. línea láser en NasaPlayer.vue) sin usar refs reactivos
    scanListeners.forEach((listener) => {
      listener({
        scanX,
        canvasWidth,
        normalizedX,
        telemetry,
      })
    })

    scanX = (scanX + 2) % canvasWidth
    return telemetry
  }

  async function start(disc = null) {
    if (disc) {
      loadDisc(disc)
      if (disc.rarity === 'legendario') {
        speakLegendaryMetadata(disc)
      }
    }

    await ensureAudioGraph()
    stop()
    isRunning.value = true

    const runLoop = () => {
      if (!isRunning.value) return
      const result = stepScan()

      // En modo 'huracan', el ritmo se acelera dinámicamente con el calor de la columna
      let intervalMs = 95
      if (activeMode.value === 'huracan' && result && typeof result.warmRatio === 'number') {
        intervalMs = Math.max(48, Math.floor(125 - result.warmRatio * 68))
      }

      scanTimerId = setTimeout(runLoop, intervalMs)
    }

    runLoop()
  }

  function stop() {
    isRunning.value = false
    if (scanTimerId) {
      clearTimeout(scanTimerId)
      scanTimerId = null
    }
  }

  function setScanPosition(newX) {
    scanX = Math.max(0, Math.min(canvasWidth - 1, Math.floor(newX)))
  }

  function getScanX() {
    return scanX
  }

  function onScanStep(callback) {
    scanListeners.add(callback)
    return () => scanListeners.delete(callback)
  }

  return {
    isRunning,
    activeMode,
    activeRarity,
    loadDisc,
    start,
    stop,
    stepScan,
    setScanPosition,
    getScanX,
    onScanStep,
  }
}
