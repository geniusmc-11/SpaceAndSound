/**
 * Motor de Sonificación Modular (useSonifier.js)
 * Categoría NASA Space Apps: "The Earth Information Jukebox"
 *
 * Incluye:
 * - Opción B: Secuencia de fotogramas precargados en Uint8ClampedArray fuera de Vue reactivity.
 * - Modo 'maps': Desacoplado vía ColorbarMapper (RGB -> HSL -> flotante [0.0..1.0]).
 * - Modo 'espacial' 8D: Audio orbital 360° con Tone.Panner3D (HRTF), PingPongDelay y FM Shimmer brillante.
 * - Modo 'planetario': Sonificación planetaria con silencio estricto en píxeles negros.
 * - 2 Melodías en paralelo: Melodía Principal + Bajo tipo Theremin con portamento y LFO vibrato para profundidad.
 * - Ruido de fondo en TODOS los discos + Segundo Sonido de Fondo temático ('maritimo'/'espacial') desde 'raro'.
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
  planetario: ['C3', 'D3', 'E3', 'F#3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'C5'],
}

const THEREMIN_BASS_SCALE = ['C2', 'D2', 'E2', 'G2', 'A2', 'C3', 'D3', 'E3']

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
let activeAmbientStyle = 'maritimo'
let loadedDiscId = null
let loadGeneration = 0

let canvasWidth = 256
let canvasHeight = 128
let scanX = 0
let scanTimerId = null
let frameTimerId = null
let orbitTimerId = null
let orbitAngle = 0
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
let pingPongDelay = null
let spatial8DPanner = null

// Segundo sonido de fondo (cama base en TODOS los discos + capa temática en 'raro'+)
let baseAmbientNoise = null
let baseAmbientFilter = null
let baseAmbientGain = null
let oceanNoise = null
let oceanAutoFilter = null
let oceanGain = null
let spaceBgDrone = null
let spaceBgActive = false

// Melodía 2: Bajo tipo Theremin con portamento continuo y vibrato LFO
let thereminBass = null
let thereminFilter = null
let thereminVibratoLFO = null
let thereminActive = false
let lastThereminNote = 'C2'

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

function update8DOrbitPosition(angleRad) {
  if (!spatial8DPanner) return
  const radius = 2.6
  const x = Math.cos(angleRad) * radius
  const y = Math.sin(angleRad * 0.5) * 0.85
  const z = Math.sin(angleRad) * radius
  try {
    spatial8DPanner.positionX.value = x
    spatial8DPanner.positionY.value = y
    spatial8DPanner.positionZ.value = z
  } catch {
    // Fallback si el entorno mock no expone AudioParam .value
  }
}

async function ensureAudioGraph() {
  if (audioInitialized) return true
  try {
    await Tone.start()

    // Nodo 8D HRTF orbital conectado a destino
    spatial8DPanner = new Tone.Panner3D({
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1.0,
      rolloffFactor: 0.9,
      positionX: 0,
      positionY: 0,
      positionZ: -2,
    }).toDestination()

    filterNode = new Tone.Filter({
      frequency: 2800,
      type: 'lowpass',
      rolloff: -12,
    }).toDestination()

    reverbNode = new Tone.Reverb({
      decay: 3.2,
      wet: 0.36,
    }).connect(filterNode)

    // Eco estéreo PingPong conectado al Panner 8D para envolvente espacial
    pingPongDelay = new Tone.PingPongDelay({
      delayTime: '8n',
      feedback: 0.32,
      wet: 0.28,
    }).connect(spatial8DPanner)

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
    }).connect(pingPongDelay)

    // Sintetizador FM cristalino conectado al Panner 8D
    shimmerSynth = new Tone.FMSynth({
      harmonicity: 3.01,
      modulationIndex: 4.8,
      oscillator: { type: 'sine' },
      modulation: { type: 'triangle' },
      envelope: { attack: 0.003, decay: 0.25, sustain: 0.05, release: 0.45 },
      modulationEnvelope: { attack: 0.002, decay: 0.15, sustain: 0.1, release: 0.3 },
      volume: -10,
    }).connect(pingPongDelay)

    padPolySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.06, decay: 0.32, sustain: 0.45, release: 0.75 },
      volume: -14,
    }).connect(spatial8DPanner)

    // --- Melodía 2: Bajo tipo Theremin con portamento y vibrato LFO para profundidad ---
    thereminFilter = new Tone.Filter({
      frequency: 420,
      type: 'lowpass',
      rolloff: -12,
    }).connect(reverbNode)

    thereminBass = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.14, decay: 0.2, sustain: 0.78, release: 0.45 },
      portamento: 0.24,
      volume: -13,
    }).connect(thereminFilter)

    thereminVibratoLFO = new Tone.LFO({
      frequency: 5.2,
      min: -16,
      max: 16,
    })
      .connect(thereminBass.detune)
      .start()

    // --- Ruido de fondo base para TODOS los discos ---
    baseAmbientGain = new Tone.Gain(0.0).toDestination()
    baseAmbientFilter = new Tone.AutoFilter({
      frequency: 0.08,
      baseFrequency: 110,
      octaves: 1.8,
      depth: 0.6,
    })
      .connect(baseAmbientGain)
      .start()

    baseAmbientNoise = new Tone.Noise('brown').connect(baseAmbientFilter)
    baseAmbientNoise.volume.value = -24

    // --- Segundo Sonido de Fondo temático (para discos 'raro', 'epico', 'legendario') ---
    oceanGain = new Tone.Gain(0.0).toDestination()
    oceanAutoFilter = new Tone.AutoFilter({
      frequency: 0.14,
      baseFrequency: 170,
      octaves: 2.3,
      depth: 0.85,
    })
      .connect(oceanGain)
      .start()

    oceanNoise = new Tone.Noise('pink').connect(oceanAutoFilter)
    oceanNoise.volume.value = -22

    spaceBgDrone = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 1.2, decay: 0.5, sustain: 0.85, release: 1.8 },
      volume: -23,
    }).connect(spatial8DPanner)

    audioInitialized = true
    return true
  } catch {
    return false
  }
}

function resolveAmbientStyle(disc) {
  if (disc?.ambientStyle === 'maritimo' || disc?.ambientStyle === 'espacial') {
    return disc.ambientStyle
  }
  const cat = disc?.category || activeMode.value
  if (cat === 'espacial' || cat === 'grafica' || cat === 'planetario') return 'espacial'
  return 'maritimo'
}

function startSecondaryAmbientBed(rarity, style) {
  stopSecondaryAmbientBed()
  if (!audioInitialized) return

  // Ruido de fondo atmosférico presente en TODOS los discos (incluyendo 'comun')
  if (baseAmbientNoise && baseAmbientGain) {
    try {
      if (baseAmbientNoise.state !== 'started') {
        baseAmbientNoise.start()
      }
      baseAmbientGain.gain.rampTo(0.24, 0.7)
    } catch {
      // Ignorar en entornos sin Web Audio completo
    }
  }

  // Capa adicional temática desde 'raro' en adelante
  if (rarity !== 'raro' && rarity !== 'epico' && rarity !== 'legendario') return

  if (style === 'maritimo' && oceanNoise && oceanGain) {
    try {
      if (oceanNoise.state !== 'started') {
        oceanNoise.start()
      }
      oceanGain.gain.rampTo(0.28, 0.8)
    } catch {
      // Ignorar en entornos sin Web Audio completo
    }
  } else if (style === 'espacial' && spaceBgDrone) {
    try {
      spaceBgDrone.triggerAttack(['C2', 'G2', 'D3'])
      spaceBgActive = true
    } catch {
      // Ignorar en entornos sin Web Audio completo
    }
  }
}

function stopSecondaryAmbientBed() {
  if (baseAmbientGain) {
    try {
      baseAmbientGain.gain.rampTo(0.0, 0.25)
    } catch {
      // noop
    }
  }
  if (baseAmbientNoise) {
    try {
      if (baseAmbientNoise.state === 'started') baseAmbientNoise.stop()
    } catch {
      // noop
    }
  }
  if (oceanGain) {
    try {
      oceanGain.gain.rampTo(0.0, 0.25)
    } catch {
      // noop
    }
  }
  if (oceanNoise) {
    try {
      if (oceanNoise.state === 'started') oceanNoise.stop()
    } catch {
      // noop
    }
  }
  if (spaceBgDrone && spaceBgActive) {
    try {
      spaceBgDrone.releaseAll()
    } catch {
      // noop
    }
    spaceBgActive = false
  }
}

function triggerThereminBass(normValue = 0.5) {
  const clamped = Math.max(0, Math.min(1, Number(normValue) || 0))
  const bassIdx = Math.min(
    THEREMIN_BASS_SCALE.length - 1,
    Math.floor(clamped * THEREMIN_BASS_SCALE.length)
  )
  const bassNote = THEREMIN_BASS_SCALE[bassIdx]
  lastThereminNote = bassNote

  if (audioInitialized && thereminBass) {
    try {
      if (!thereminActive) {
        thereminBass.triggerAttack(bassNote)
        thereminActive = true
      } else {
        thereminBass.setNote(bassNote)
      }
    } catch {
      // Fallback si la versión de Tone/mock requiere triggerAttackRelease
      try {
        thereminBass.triggerAttackRelease(bassNote, '8n')
      } catch {
        // noop
      }
    }
  }
  return bassNote
}

function silenceThereminBass() {
  if (audioInitialized && thereminBass && thereminActive) {
    try {
      thereminBass.triggerRelease()
    } catch {
      // noop
    }
    thereminActive = false
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
  // Melodía 2: Bajo tipo Theremin con portamento continuo para dar profundidad armónica
  const thereminNote = triggerThereminBass(normValue)

  if (!audioInitialized || !leadSynth) {
    return thereminNote
  }

  if (reverbNode) {
    reverbNode.wet.value = rarity === 'comun' ? 0.08 : rarity === 'raro' ? 0.38 : 0.56
  }

  if (filterNode) {
    if (activeMode.value === 'espacial' || activeMode.value === 'planetario') {
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

  return thereminNote
}

/**
 * Detecta píxeles negros / espacio vacío (para modo 'planetario', donde NO deben sonar)
 */
export function isBlackPixel(r, g, b) {
  const rr = Number(r) || 0
  const gg = Number(g) || 0
  const bb = Number(b) || 0
  return rr + gg + bb <= 45 || (rr <= 18 && gg <= 18 && bb <= 18)
}

/**
 * Síntesis pura para una columna o muestra de píxeles del modo 'planetario'.
 * Silencio absoluto si todos los píxeles son negros; si hay luz planetaria, emite
 * Melodía 1 (cristalina/planetaria) + Melodía 2 (bajo tipo Theremin).
 */
export function synthesizePlanetarySamples(samples, rarity = 'comun') {
  const litPixels = Array.isArray(samples)
    ? samples.filter((p) => p && !isBlackPixel(p.r, p.g, p.b))
    : []

  if (litPixels.length === 0) {
    silenceThereminBass()
    return {
      mode: 'planetario',
      silent: true,
      primaryNote: 'SILENCE',
      thereminNote: null,
      normValue: 0,
      detail: 'BLACK SPACE (SILENT)',
    }
  }

  let brightest = litPixels[0]
  let maxLuma = -1
  let totalLuma = 0

  for (const px of litPixels) {
    const luma = (Number(px.r) || 0) + (Number(px.g) || 0) + (Number(px.b) || 0)
    totalLuma += luma
    if (luma > maxLuma) {
      maxLuma = luma
      brightest = px
    }
  }

  const avgLumaNorm = Math.min(1, totalLuma / (litPixels.length * 765))
  const heightNorm = Math.max(0, Math.min(1, Number(brightest.yNorm ?? 0.5)))
  const scale = SCALES.planetario
  const noteIdx = Math.min(scale.length - 1, Math.floor(heightNorm * scale.length))
  const primaryNote = scale[noteIdx]
  const harmonyNote = scale[Math.min(scale.length - 1, noteIdx + 2)]
  const mirrorNote = scale[Math.min(scale.length - 1, noteIdx + 4)]

  const thereminNote = applyRarityScaling(
    rarity,
    primaryNote,
    harmonyNote,
    avgLumaNorm,
    mirrorNote
  )

  return {
    mode: 'planetario',
    silent: false,
    primaryNote,
    thereminNote,
    normValue: Number(avgLumaNorm.toFixed(2)),
    detail: `PLANETARY ${primaryNote} + THEREMIN ${thereminNote}`,
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

  const thereminNote = applyRarityScaling(rarity, primaryNote, harmonyNote, v, mirrorNote)

  if (audioInitialized && bassDrone && v > 0.72) {
    bassDrone.triggerAttackRelease('C2', '16n')
  }

  return {
    mode: 'maps',
    normalizedValue: Number(v.toFixed(3)),
    primaryNote,
    thereminNote,
    normValue: Number(v.toFixed(2)),
    detail: `COLORBAR ${activeMapProfileId}: ${(v * 100).toFixed(0)}% (${primaryNote} + ${thereminNote})`,
  }
}

const SONIFICATION_STRATEGIES = {
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
        ? `HIGH TIDE > WHITE GUIDE (${primaryNote} + DRONE ${bassNote})`
        : `NOMINAL MARITIME LEVEL (${primaryNote} / DRONE ${bassNote})`,
    }
  },

  /**
   * Stars / Nebulae 8D (Orbital HRTF audio + crystalline FMSynth + PingPongDelay):
   */
  espacial(colX, rarity) {
    let starY = -1
    let redEnergy = 0
    let blueEnergy = 0

    for (let y = 0; y < canvasHeight; y += 2) {
      const { r, g, b } = getPixelAt(colX, y)
      const sum = r + g + b
      if (sum > 660 && starY === -1) {
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
    let thereminNote
    if (rarity !== 'comun') {
      thereminNote = applyRarityScaling(
        rarity,
        chord[1] || chord[0],
        shimmerHigh,
        normLuma,
        primaryNote
      )
    } else {
      thereminNote = triggerThereminBass(normLuma)
      if (starY === -1 && audioInitialized && shimmerSynth && colX % 4 === 0) {
        shimmerSynth.triggerAttackRelease(shimmerHigh, '16n')
      }
    }

    return {
      mode: 'espacial',
      primaryNote: starY !== -1 ? primaryNote : chord.join('-'),
      thereminNote,
      normValue: Number(normLuma.toFixed(2)),
      detail:
        starY !== -1
          ? `8D STELLAR FLASH (${primaryNote} + THEREMIN ${thereminNote})`
          : isInfraredDominant
            ? `8D IR NEBULA (${chord.join(' ')} + ${thereminNote})`
            : `8D UV NEBULA (${chord.join(' ')} + ${thereminNote})`,
    }
  },

  planetario(colX, rarity) {
    const samples = []
    for (let y = 0; y < canvasHeight; y += 2) {
      const { r, g, b } = getPixelAt(colX, y)
      samples.push({
        yNorm: 1 - y / Math.max(1, canvasHeight - 1),
        r,
        g,
        b,
      })
    }
    return synthesizePlanetarySamples(samples, rarity)
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
      detail: `HEAT ${Math.round(warmRatio * 100)}% // ${
        isHighTension ? 'HIGH CYCLONIC TENSION' : 'STABLE COLD FRONT'
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
        `NASA Legendary Archive: ${disc.title}. Interactive hover mode enabled.`
    )
    utterance.lang = 'en-US'
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
    activeAmbientStyle = resolveAmbientStyle(disc)
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

  function setHoverActive(active) {
    hoverPausedAutoScan = Boolean(active)
  }

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
    orbitAngle = (orbitAngle + 0.22) % (Math.PI * 2)
    update8DOrbitPosition(orbitAngle)

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
    } else if (mode === 'planetario') {
      const yNorm = 1 - py / Math.max(1, canvasHeight - 1)
      telemetry = synthesizePlanetarySamples([{ yNorm, r, g, b }], 'legendario')
    } else if (mode === 'espacial') {
      const sum = r + g + b
      const highScale = SCALES.espacialHigh
      const yNorm = 1 - py / Math.max(1, canvasHeight - 1)
      const noteIdx = Math.min(highScale.length - 1, Math.floor(yNorm * highScale.length))
      const primaryNote = highScale[noteIdx]
      let thereminNote = lastThereminNote
      if (filterNode) filterNode.frequency.value = 9500
      if (sum > 480 && audioInitialized && shimmerSynth) {
        shimmerSynth.triggerAttackRelease(primaryNote, '16n')
        thereminNote = triggerThereminBass(sum / 765)
      } else {
        const chord = r > b ? SCALES.espacialIR[px % 4] : SCALES.espacialUV[px % 4]
        thereminNote = applyRarityScaling(
          'legendario',
          primaryNote,
          chord[2],
          sum / 765,
          chord[3] || primaryNote
        )
      }
      telemetry = {
        mode: 'espacial',
        primaryNote,
        thereminNote,
        normValue: Number((sum / 765).toFixed(2)),
        detail: `8D STELLAR HOVER (${px},${py}) -> ${primaryNote} + ${thereminNote}`,
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

    // Activar órbita 8D continua (rotación suave de 360° alrededor del oyente)
    orbitTimerId = setInterval(() => {
      if (!isRunning.value) return
      orbitAngle = (orbitAngle + 0.08) % (Math.PI * 2)
      update8DOrbitPosition(orbitAngle)
    }, 50)

    // Activar segundo sonido de fondo ('maritimo' o 'espacial') desde rareza 'raro' en adelante
    startSecondaryAmbientBed(activeRarity.value, activeAmbientStyle)

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
    if (orbitTimerId) {
      clearInterval(orbitTimerId)
      orbitTimerId = null
    }
    silenceThereminBass()
    stopSecondaryAmbientBed()
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
