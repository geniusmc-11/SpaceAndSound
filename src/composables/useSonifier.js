/**
 * Motor de Sonificación Modular (useSonifier.js) — Opción B (Secuencia de Fotogramas + Imágenes Directas)
 * Categoría NASA Space Apps: "The Earth Information Jukebox"
 *
 * RENDIMIENTO CRÍTICO:
 * - El <canvas> oculto usa { willReadFrequently: true }.
 * - Los arreglos de píxeles por fotograma (frameBuffers / pixelBuffer), el puntero scanX,
 *   el índice de fotograma actual y todas las instancias de Tone.js viven FUERA de ref() y reactive().
 */

import { ref } from 'vue'
import * as Tone from 'tone'
import { loadImageElement } from '@/game/NasaDatasetGenerator'

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
let frameBuffers = [] // Array<Uint8ClampedArray> precargado para Opción B
let pixelBuffer = null // Apuntador al fotograma activo en reproducción
let currentFrameIndex = 0
let currentFrameIntervalMs = 1900
let loadedDiscId = null
let loadGeneration = 0

let canvasWidth = 256
let canvasHeight = 128
let scanX = 0
let scanTimerId = null
let frameTimerId = null
let audioInitialized = false

// Instancias de Tone.js (estrictamente fuera de Vue Reactivity)
let leadSynth = null
let harmonySynth = null
let bassDrone = null
let pluckSynth = null
let padPolySynth = null
let filterNode = null
let reverbNode = null

// Suscriptores de frame y barrido láser sin re-renderizar Vue
const scanListeners = new Set()
const frameListeners = new Set()

const isRunning = ref(false)
const activeMode = ref('huracan')
const activeRarity = ref('epico')

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
    return false
  }
}

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

function applyRarityScaling(rarity, primaryNote, harmonyNote, normLuminance, mirrorNote) {
  if (!audioInitialized || !leadSynth) return

  if (reverbNode) {
    reverbNode.wet.value = rarity === 'comun' ? 0.08 : rarity === 'raro' ? 0.42 : 0.58
  }

  if (filterNode && (rarity === 'epico' || rarity === 'legendario')) {
    const cutoff = 450 + Math.floor(normLuminance * 3800)
    filterNode.frequency.value = Math.max(300, Math.min(5000, cutoff))
  } else if (filterNode) {
    filterNode.frequency.value = 2400
  }

  if (primaryNote) {
    leadSynth.triggerAttackRelease(primaryNote, '16n')
  }

  if (
    (rarity === 'raro' || rarity === 'epico' || rarity === 'legendario') &&
    harmonyNote &&
    harmonySynth
  ) {
    harmonySynth.triggerAttackRelease(harmonyNote, '8n')
  }

  if ((rarity === 'epico' || rarity === 'legendario') && mirrorNote && pluckSynth) {
    pluckSynth.triggerAttackRelease(mirrorNote, '16n')
  }
}

const SONIFICATION_STRATEGIES = {
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

    const droneNorm = 1 - whiteLineY / canvasHeight
    const scale = SCALES.maritimo
    const bassNote = droneNorm > 0.52 ? 'D2' : 'A1'
    if (audioInitialized && bassDrone && colX % 2 === 0) {
      bassDrone.triggerAttackRelease(bassNote, '8n')
    }

    const seaNorm = 1 - highestBlueY / canvasHeight
    const noteIdx = Math.min(scale.length - 1, Math.max(0, Math.floor(seaNorm * scale.length)))
    const primaryNote = scale[noteIdx]
    const surpassesWhiteGuide = highestBlueY < whiteLineY
    const harmonyNote = surpassesWhiteGuide
      ? scale[Math.min(scale.length - 1, noteIdx + 4)]
      : scale[Math.min(scale.length - 1, noteIdx + 2)]

    if (audioInitialized && leadSynth) {
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

    if (starY !== -1) {
      const starNorm = 1 - starY / canvasHeight
      const idx = Math.min(highScale.length - 1, Math.floor(starNorm * highScale.length))
      primaryNote = highScale[idx]
      if (audioInitialized && pluckSynth) {
        pluckSynth.triggerAttackRelease(primaryNote, '16n')
      }
    }

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
    const warmRatio = warmCount / total
    const isHighTension = warmRatio > 0.52
    const activeScale = isHighTension ? SCALES.huracanTense : SCALES.huracanCalm

    const idx = Math.min(
      activeScale.length - 1,
      Math.floor(warmRatio * (activeScale.length - 1))
    )
    const primaryNote = activeScale[idx]
    const harmonyOffset = isHighTension ? 1 : 2
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

function speakLegendaryMetadata(disc) {
  if (!disc || disc.rarity !== 'legendario') return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(
      disc.narration ||
        `Archivo NASA: ${disc.title}. Instrumento ${disc.instrument}.`
    )
    utterance.lang = 'es-ES'
    utterance.rate = 1.02
    utterance.pitch = 0.92
    window.speechSynthesis.speak(utterance)
  } catch {
    // Ignorar si el navegador bloquea speechSynthesis sin interacción
  }
}

function notifyFrameListeners() {
  const total = frameBuffers.length || 1
  frameListeners.forEach((cb) => {
    cb({
      frameIndex: currentFrameIndex,
      frameCount: total,
    })
  })
}

export function useSonifier() {
  /**
   * Precarga todos los fotogramas de un disco (Opción B: secuencia de pocos fotogramas
   * o imagen directa de 1 fotograma) en buffers Uint8ClampedArray fuera de Vue reactivity.
   */
  async function loadDisc(disc) {
    if (!disc) return
    const ctx = ensureHiddenCanvas()
    activeMode.value = disc.category || 'huracan'
    activeRarity.value = disc.rarity || 'epico'
    currentFrameIntervalMs = disc.frameIntervalMs || 1900

    const isSameDisc = loadedDiscId === disc.id && frameBuffers.length > 0
    if (isSameDisc) {
      notifyFrameListeners()
      return
    }

    loadedDiscId = disc.id
    const myGen = ++loadGeneration
    scanX = 0
    currentFrameIndex = 0
    frameBuffers = []
    pixelBuffer = null

    const sources =
      Array.isArray(disc.frames) && disc.frames.length > 0
        ? disc.frames
        : disc.imageUrl
          ? [disc.imageUrl]
          : []

    if (!ctx || !hiddenCanvas || sources.length === 0) {
      notifyFrameListeners()
      return
    }

    // Cargar primer fotograma de inmediato para arrancar la sonificación sin espera
    const firstImg = await loadImageElement(sources[0])
    if (myGen !== loadGeneration) return
    if (firstImg) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      ctx.drawImage(firstImg, 0, 0, canvasWidth, canvasHeight)
      try {
        const firstData = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data
        frameBuffers[0] = firstData
        pixelBuffer = firstData
      } catch {
        // Canvas contaminado por CORS si se usó URL externa sin permiso
      }
    }
    notifyFrameListeners()

    // Decodificar el resto de fotogramas en segundo plano para Opción B
    for (let i = 1; i < sources.length; i++) {
      const img = await loadImageElement(sources[i])
      if (myGen !== loadGeneration) return
      if (img) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
        try {
          frameBuffers[i] = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data
        } catch {
          // Ignorar fotograma si falla lectura
        }
      }
    }
    notifyFrameListeners()
  }

  function setFrameIndex(idx) {
    if (frameBuffers.length === 0) return
    const safeIdx = ((idx % frameBuffers.length) + frameBuffers.length) % frameBuffers.length
    currentFrameIndex = safeIdx
    if (frameBuffers[safeIdx]) {
      pixelBuffer = frameBuffers[safeIdx]
    }
    notifyFrameListeners()
  }

  function setMode(mode) {
    if (SONIFICATION_STRATEGIES[mode]) {
      activeMode.value = mode
    }
  }

  function stepScan() {
    if (!pixelBuffer) return null
    const strategy =
      SONIFICATION_STRATEGIES[activeMode.value] || SONIFICATION_STRATEGIES.huracan
    const telemetry = strategy(scanX, activeRarity.value)
    const normalizedX = scanX / Math.max(1, canvasWidth - 1)

    scanListeners.forEach((listener) => {
      listener({
        scanX,
        canvasWidth,
        normalizedX,
        frameIndex: currentFrameIndex,
        frameCount: frameBuffers.length || 1,
        telemetry,
      })
    })

    scanX = (scanX + 2) % canvasWidth
    return telemetry
  }

  async function start(disc = null) {
    if (disc) {
      await loadDisc(disc)
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

      let intervalMs = 95
      if (activeMode.value === 'huracan' && result && typeof result.warmRatio === 'number') {
        intervalMs = Math.max(48, Math.floor(125 - result.warmRatio * 68))
      }

      scanTimerId = setTimeout(runLoop, intervalMs)
    }

    runLoop()

    // Avance automático de fotogramas para discos Opción B (> 1 fotograma)
    if (frameBuffers.length > 1 || (disc?.frames && disc.frames.length > 1)) {
      frameTimerId = setInterval(() => {
        if (!isRunning.value || frameBuffers.length <= 1) return
        setFrameIndex(currentFrameIndex + 1)
      }, currentFrameIntervalMs)
    }
  }

  function stop() {
    isRunning.value = false
    if (scanTimerId) {
      clearTimeout(scanTimerId)
      scanTimerId = null
    }
    if (frameTimerId) {
      clearInterval(frameTimerId)
      frameTimerId = null
    }
  }

  function setScanPosition(newX) {
    scanX = Math.max(0, Math.min(canvasWidth - 1, Math.floor(newX)))
  }

  function getScanX() {
    return scanX
  }

  function getFrameState() {
    return {
      frameIndex: currentFrameIndex,
      frameCount: frameBuffers.length || 1,
    }
  }

  function onScanStep(callback) {
    scanListeners.add(callback)
    return () => scanListeners.delete(callback)
  }

  function onFrameChange(callback) {
    frameListeners.add(callback)
    return () => frameListeners.delete(callback)
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
    setFrameIndex,
    setMode,
    getScanX,
    getFrameState,
    onScanStep,
    onFrameChange,
  }
}
