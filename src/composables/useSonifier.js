/**
 * Motor de Sonificación Modular (useSonifier.js)
 * Categoría NASA Space Apps: "The Earth Information Jukebox"
 *
 * Incluye:
 * - Opción B: Secuencia de fotogramas precargados en Uint8ClampedArray fuera de Vue reactivity.
 * - Modo 'maps': Desacoplado vía ColorbarMapper (RGB -> HSL -> flotante [0.0..1.0]).
 * - Modo 'espacial': Timbre brillante/cristalino (FMSynth + filtro abierto + octavas luminosas).
 * - Modo Hover Legendario: Repasar los píxeles de la imagen/fotogramas con el cursor genera sonido en tiempo real.
 */

import { ref } from 'vue'
import * as Tone from 'tone'
import { loadImageElement } from '@/game/NasaDatasetGenerator'
import { mapRgbPixelToNormalizedValue } from '@/game/ColorbarMapper'

const SCALES = {
  grafica: ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5'],
  maritimo: ['D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5'],
  maps: ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5'],
  // Registros más altos y luminosos para estrellas/nebulosas (Lidio / Pentatónica aguda)
  espacialHigh: ['E5', 'F#5', 'G#5', 'B5', 'C#6', 'E6', 'F#6', 'G#6', 'B6', 'E7'],
  espacialIR: [
    ['C3', 'G3', 'D4', 'E4'],
    ['D3', 'A3', 'E4', 'F#4'],
    ['F3', 'C4', 'G4', 'A4'],
    ['G3', 'D4', 'A4', 'B4'],
  ],
  espacialUV: [
    ['E4', 'G#4', 'B4', 'D#5', 'F#5'],
    ['F#4', 'A#4', 'C#5', 'F5', 'G#5'],
    ['G#4', 'B4', 'D#5', 'F#5', 'A#5'],
    ['B4', 'D#5', 'F#5', 'A#5', 'C#6'],
  ],
  huracanCalm: ['C3', 'G3', 'D4', 'E4', 'G4', 'A4', 'C5'],
  huracanTense: ['C3', 'Db3', 'E3', 'F#3', 'G3', 'Ab3', 'B3', 'C4', 'Db4', 'E4', 'F#4', 'Bb4'],
}

// ============================================================================
// VARIABLES NO REACTIVAS (Fuera de ref() / reactive() por rendimiento crítico)
// ============================================================================
let hiddenCanvas = null
let hiddenCtx = null
let frameBuffers = []
let pixelBuffer = null
let currentFrameIndex = 0
let currentFrameIntervalMs = 1900
let activeMapProfileId = 'default'
let loadedDiscId = null
let loadGeneration = 0

let canvasWidth = 256
let canvasHeight = 128
let scanX = 0
let scanTimerId = null
let frameTimerId = null
let audioInitialized = false
let lastHoverSoundAt = 0
let hoverPausedAutoScan = false

// Instancias de Tone.js (estrictamente fuera de Vue Reactivity)
let leadSynth = null
let harmonySynth = null
let bassDrone = null
let pluckSynth = null
let shimmerSynth = null
let padPolySynth = null
let filterNode = null
let reverbNode = null

const scanListeners = new Set()
const frameListeners = new Set()

const isRunning = ref(false)
const activeMode = ref('maps')
const activeRarity = ref('legendario')

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
      frequency: 2800,
      type: 'lowpass',
      rolloff: -12,
    }).toDestination()

    reverbNode = new Tone.Reverb({
      decay: 3.0,
      wet: 0.35,
    }).connect(filterNode)

    leadSynth = new Tone.Synth({
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.008, decay: 0.14, sustain: 0.22, release: 0.28 },
      volume: -9,
    }).connect(reverbNode)

    harmonySynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.015, decay: 0.18, sustain: 0.25, release: 0.38 },
      volume: -13,
    }).connect(reverbNode)

    bassDrone = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.4 },
      volume: -16,
    }).connect(filterNode)

    pluckSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.002, decay: 0.22, sustain: 0.0, release: 0.25 },
      volume: -8,
    }).connect(reverbNode)

    // Sintetizador FM cristalino para destellos brillantes en estrellas/nebulosas y hover
    shimmerSynth = new Tone.FMSynth({
      harmonicity: 3.01,
      modulationIndex: 4.5,
      oscillator: { type: 'sine' },
      modulation: { type: 'triangle' },
      envelope: { attack: 0.003, decay: 0.25, sustain: 0.05, release: 0.45 },
      modulationEnvelope: { attack: 0.002, decay: 0.15, sustain: 0.1, release: 0.3 },
      volume: -11,
    }).connect(reverbNode)

    padPolySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.45, release: 0.7 },
      volume: -14,
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

function applyRarityScaling(rarity, primaryNote, harmonyNote, normValue, mirrorNote) {
  if (!audioInitialized || !leadSynth) return

  if (reverbNode) {
    reverbNode.wet.value = rarity === 'comun' ? 0.08 : rarity === 'raro' ? 0.38 : 0.54
  }

  if (filterNode) {
    if (activeMode.value === 'espacial') {
      // Filtro completamente abierto/brillante para estrellas y nebulosas
      filterNode.frequency.value = 9500
    } else if (rarity === 'epico' || rarity === 'legendario') {
      const cutoff = 480 + Math.floor(Math.max(0, Math.min(1, normValue)) * 4200)
      filterNode.frequency.value = Math.max(350, Math.min(5500, cutoff))
    } else {
      filterNode.frequency.value = 2600
    }
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

/**
 * SÍNTESIS PURA DESACOPLADA PARA TIPO 'maps':
 * Recibe ÚNICAMENTE un valor flotante limpio entre 0.0 y 1.0 (sin ninguna dependencia con RGB crudos).
 */
export function synthesizeNormalizedMapValue(normalizedValue, rarity = 'legendario') {
  const v = Math.max(0, Math.min(1, Number(normalizedValue) || 0))
  const scale = SCALES.maps
  const noteIdx = Math.min(scale.length - 1, Math.floor(v * scale.length))
  const primaryNote = scale[noteIdx]
  const harmonyNote = scale[Math.min(scale.length - 1, noteIdx + 2)]
  const mirrorNote = scale[Math.min(scale.length - 1, noteIdx + 4)]

  applyRarityScaling(rarity, primaryNote, harmonyNote, v, mirrorNote)

  if (audioInitialized && bassDrone && v > 0.72) {
    bassDrone.triggerAttackRelease('C2', '16n')
  }

  return {
    mode: 'maps',
    normalizedValue: Number(v.toFixed(3)),
    primaryNote,
    normValue: Number(v.toFixed(2)),
    detail: `COLORBAR ${activeMapProfileId}: ${(v * 100).toFixed(0)}% (${primaryNote})`,
  }
}

const SONIFICATION_STRATEGIES = {
  /**
   * Nuevo tipo 'maps':
   * Lee píxeles con getImageData() -> convierte RGB a HSL -> calcula posición [0.0..1.0]
   * en el perfil del mapa activo -> pasa únicamente ese flotante limpio al sintetizador.
   */
  maps(colX, rarity) {
    let sumNormalized = 0
    let maxNormalized = 0
    let sampleCount = 0

    for (let y = 0; y < canvasHeight; y += 4) {
      const { r, g, b } = getPixelAt(colX, y)
      const val = mapRgbPixelToNormalizedValue(r, g, b, activeMapProfileId)
      sumNormalized += val
      if (val > maxNormalized) maxNormalized = val
      sampleCount++
    }

    const avgNormalized = sampleCount > 0 ? sumNormalized / sampleCount : 0
    const cleanValue = Math.max(0, Math.min(1, avgNormalized * 0.45 + maxNormalized * 0.55))

    return synthesizeNormalizedMapValue(cleanValue, rarity)
  },

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

  /**
   * Estrellas / Nebulosas (Timbre más brillante, cristalino y agudo):
   * Usa FMSynth + filtro abierto (9.5kHz) + acordes Lidios/luminosos.
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
    let primaryNote = 'B5'

    if (filterNode) {
      filterNode.frequency.value = 9500
    }

    if (starY !== -1) {
      const starNorm = 1 - starY / canvasHeight
      const idx = Math.min(highScale.length - 1, Math.floor(starNorm * highScale.length))
      primaryNote = highScale[idx]
      const sparkleNote = highScale[Math.min(highScale.length - 1, idx + 2)]

      if (audioInitialized && shimmerSynth) {
        shimmerSynth.triggerAttackRelease(primaryNote, '16n')
      }
      if (audioInitialized && pluckSynth) {
        pluckSynth.triggerAttackRelease(sparkleNote, '16n')
      }
    }

    const isInfraredDominant = redEnergy > blueEnergy
    const chordPool = isInfraredDominant ? SCALES.espacialIR : SCALES.espacialUV
    const chord = chordPool[colX % chordPool.length]

    if (audioInitialized && padPolySynth && colX % 3 === 0) {
      padPolySynth.triggerAttackRelease(chord, '4n')
    }

    const normLuma = Math.min(1, (redEnergy + blueEnergy) / (canvasHeight * 120))
    const shimmerHigh = chord[chord.length - 1]
    if (rarity !== 'comun') {
      applyRarityScaling(rarity, chord[1] || chord[0], shimmerHigh, normLuma, primaryNote)
    } else if (starY === -1 && audioInitialized && shimmerSynth && colX % 4 === 0) {
      shimmerSynth.triggerAttackRelease(shimmerHigh, '16n')
    }

    return {
      mode: 'espacial',
      primaryNote: starY !== -1 ? primaryNote : chord.join('-'),
      normValue: Number(normLuma.toFixed(2)),
      detail:
        starY !== -1
          ? `DESTELLO ESTELAR CRISTALINO (${primaryNote})`
          : isInfraredDominant
            ? `NEBULOSA IR LUMINOSA (${chord.join(' ')})`
            : `NEBULOSA UV BRILLANTE (${chord.join(' ')})`,
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
        `Archivo Legendario NASA: ${disc.title}. Modo interactivo por hover activado.`
    )
    utterance.lang = 'es-ES'
    utterance.rate = 1.02
    utterance.pitch = 0.95
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
  async function loadDisc(disc) {
    if (!disc) return
    const ctx = ensureHiddenCanvas()
    activeMode.value = disc.category || 'maps'
    activeRarity.value = disc.rarity || 'legendario'
    activeMapProfileId = String(disc.mapProfileId || disc.svsId || 'default')
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
        // Ignorar si falla lectura
      }
    }
    notifyFrameListeners()

    for (let i = 1; i < sources.length; i++) {
      const img = await loadImageElement(sources[i])
      if (myGen !== loadGeneration) return
      if (img) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
        try {
          frameBuffers[i] = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data
        } catch {
          // Ignorar si falla lectura
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

  function setHoverActive(active) {
    hoverPausedAutoScan = Boolean(active)
  }

  /**
   * MODO HOVER PARA DISCOS LEGENDARIOS:
   * Lee el píxel exacto bajo el cursor (normX, normY en [0..1]) del fotograma actual
   * y sintetiza el sonido directamente según la estrategia del disco.
   */
  async function probeHoverPixel(normX, normY, disc = null) {
    if (disc) {
      if (disc.rarity !== 'legendario') return null
      if (loadedDiscId !== disc.id || !pixelBuffer) {
        await loadDisc(disc)
      }
    } else if (activeRarity.value !== 'legendario') {
      return null
    }

    if (!pixelBuffer) return null

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    if (now - lastHoverSoundAt < 58) {
      return null
    }
    lastHoverSoundAt = now

    await ensureAudioGraph()

    const clampedNX = Math.max(0, Math.min(1, Number(normX) || 0))
    const clampedNY = Math.max(0, Math.min(1, Number(normY) || 0))
    const px = Math.min(canvasWidth - 1, Math.floor(clampedNX * canvasWidth))
    const py = Math.min(canvasHeight - 1, Math.floor(clampedNY * canvasHeight))
    scanX = px

    const mode = disc?.category || activeMode.value
    const mapId = String(disc?.mapProfileId || disc?.svsId || activeMapProfileId || 'default')
    const { r, g, b } = getPixelAt(px, py)
    let telemetry = null

    if (mode === 'maps') {
      activeMapProfileId = mapId
      const cleanNormalized = mapRgbPixelToNormalizedValue(r, g, b, mapId)
      telemetry = synthesizeNormalizedMapValue(cleanNormalized, 'legendario')
    } else if (mode === 'espacial') {
      const sum = r + g + b
      const highScale = SCALES.espacialHigh
      const yNorm = 1 - py / Math.max(1, canvasHeight - 1)
      const noteIdx = Math.min(highScale.length - 1, Math.floor(yNorm * highScale.length))
      const primaryNote = highScale[noteIdx]
      if (filterNode) filterNode.frequency.value = 9500
      if (sum > 520 && audioInitialized && shimmerSynth) {
        shimmerSynth.triggerAttackRelease(primaryNote, '16n')
      } else {
        const chord = r > b ? SCALES.espacialIR[px % 4] : SCALES.espacialUV[px % 4]
        applyRarityScaling('legendario', primaryNote, chord[2], sum / 765, chord[3] || primaryNote)
      }
      telemetry = {
        mode: 'espacial',
        primaryNote,
        normValue: Number((sum / 765).toFixed(2)),
        detail: `HOVER ESTELAR (${px},${py}) -> ${primaryNote}`,
      }
    } else {
      const strategy = SONIFICATION_STRATEGIES[mode] || SONIFICATION_STRATEGIES.maps
      telemetry = strategy(px, 'legendario')
    }

    scanListeners.forEach((listener) => {
      listener({
        scanX: px,
        canvasWidth,
        normalizedX: clampedNX,
        normalizedY: clampedNY,
        frameIndex: currentFrameIndex,
        frameCount: frameBuffers.length || 1,
        isHover: true,
        telemetry,
      })
    })

    return telemetry
  }

  function stepScan() {
    if (!pixelBuffer) return null
    const strategy =
      SONIFICATION_STRATEGIES[activeMode.value] || SONIFICATION_STRATEGIES.maps
    const telemetry = strategy(scanX, activeRarity.value)
    const normalizedX = scanX / Math.max(1, canvasWidth - 1)

    scanListeners.forEach((listener) => {
      listener({
        scanX,
        canvasWidth,
        normalizedX,
        frameIndex: currentFrameIndex,
        frameCount: frameBuffers.length || 1,
        isHover: false,
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
      let result = null
      if (!hoverPausedAutoScan) {
        result = stepScan()
      }

      let intervalMs = 95
      if (activeMode.value === 'huracan' && result && typeof result.warmRatio === 'number') {
        intervalMs = Math.max(48, Math.floor(125 - result.warmRatio * 68))
      }

      scanTimerId = setTimeout(runLoop, intervalMs)
    }

    runLoop()

    if (frameBuffers.length > 1 || (disc?.frames && disc.frames.length > 1)) {
      frameTimerId = setInterval(() => {
        if (!isRunning.value || frameBuffers.length <= 1) return
        setFrameIndex(currentFrameIndex + 1)
      }, currentFrameIntervalMs)
    }
  }

  function stop() {
    isRunning.value = false
    hoverPausedAutoScan = false
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
    probeHoverPixel,
    setHoverActive,
    setScanPosition,
    setFrameIndex,
    setMode,
    getScanX,
    getFrameState,
    onScanStep,
    onFrameChange,
  }
}
