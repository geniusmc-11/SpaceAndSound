/**
 * Exportador MP3 de sonificaciones.
 * Captura el PCM crudo directamente del grafo Web Audio (sin MediaRecorder ni
 * decodificación Opus/WebM, que no es compatible en todos los navegadores) y lo
 * codifica a MP3 en el navegador con lamejs.
 */

const MP3_BITRATE_KBPS = 128
const MP3_FRAME_SIZE = 1152

function toInt16Samples(samples) {
  const pcm = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }
  return pcm
}

function concatFloat32(chunks, totalLength) {
  const out = new Float32Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

const RECORDER_PROCESSOR_NAME = 'sns-pcm-recorder'
const RECORDER_WORKLET_SOURCE = `
class SnsPcmRecorder extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (input && input.length > 0 && input[0].length > 0) {
      const left = input[0].slice()
      const right = (input[1] || input[0]).slice()
      this.port.postMessage([left, right], [left.buffer, right.buffer])
    }
    return true
  }
}
registerProcessor('${RECORDER_PROCESSOR_NAME}', SnsPcmRecorder)
`
const loadedWorkletContexts = new WeakSet()

async function ensureRecorderWorklet(rawContext) {
  if (loadedWorkletContexts.has(rawContext)) return
  if (!rawContext?.audioWorklet || typeof rawContext.audioWorklet.addModule !== 'function') {
    throw new Error(
      'Audio capture needs a secure context (https or localhost) with AudioWorklet support.'
    )
  }
  const url = URL.createObjectURL(
    new Blob([RECORDER_WORKLET_SOURCE], { type: 'application/javascript' })
  )
  try {
    await rawContext.audioWorklet.addModule(url)
    loadedWorkletContexts.add(rawContext)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Graba en tiempo real la salida de `sourceNode` como PCM estéreo mediante un AudioWorklet.
 * @param toneContext Contexto de Tone.js (Tone.getContext())
 * @returns {Promise<{ left: Float32Array, right: Float32Array, sampleRate: number }>}
 */
export async function capturePcm(toneContext, sourceNode, durationMs, onProgress = () => {}) {
  const rawContext = toneContext.rawContext
  await ensureRecorderWorklet(rawContext)

  const recorder = toneContext.createAudioWorkletNode(RECORDER_PROCESSOR_NAME, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
    channelCount: 2,
    channelCountMode: 'explicit',
  })
  const leftChunks = []
  const rightChunks = []
  const sampleRate = rawContext.sampleRate
  const targetSamples = Math.ceil((durationMs / 1000) * sampleRate)
  let captured = 0

  return new Promise((resolve, reject) => {
    let finished = false
    let safetyTimer

    const finish = () => {
      if (finished) return
      finished = true
      clearTimeout(safetyTimer)
      recorder.port.onmessage = null
      try {
        sourceNode.disconnect(recorder)
      } catch {
        // Ya desconectado
      }
      try {
        recorder.disconnect()
      } catch {
        // Ya desconectado
      }
      onProgress(1)
      if (captured === 0) {
        reject(new Error('No audio was captured. Press PLAY once and try again.'))
        return
      }
      resolve({
        left: concatFloat32(leftChunks, captured),
        right: concatFloat32(rightChunks, captured),
        sampleRate,
      })
    }

    recorder.port.onmessage = (event) => {
      if (finished) return
      const [left, right] = event.data
      const take = Math.min(targetSamples - captured, left.length)
      leftChunks.push(take === left.length ? left : left.subarray(0, take))
      rightChunks.push(take === right.length ? right : right.subarray(0, take))
      captured += take
      onProgress(Math.min(1, captured / targetSamples))
      if (captured >= targetSamples) finish()
    }

    try {
      sourceNode.connect(recorder)
      // Conectar al destino para que el grafo procese el nodo (su salida es silencio)
      recorder.connect(rawContext.destination)
      onProgress(0)
      safetyTimer = setTimeout(finish, durationMs + 5000)
    } catch (error) {
      finished = true
      reject(error)
    }
  })
}

/**
 * Codifica PCM estéreo (Float32) a un Blob MP3.
 */
export async function encodePcmAsMp3({ left, right, sampleRate }) {
  const lameModule = await import('@breezystack/lamejs')
  const Mp3Encoder = lameModule.Mp3Encoder || lameModule.default?.Mp3Encoder
  if (typeof Mp3Encoder !== 'function') {
    throw new Error('The MP3 encoder could not be loaded.')
  }

  const encoder = new Mp3Encoder(2, sampleRate, MP3_BITRATE_KBPS)
  const left16 = toInt16Samples(left)
  const right16 = toInt16Samples(right || left)
  const chunks = []

  for (let i = 0; i < left16.length; i += MP3_FRAME_SIZE) {
    const encoded = encoder.encodeBuffer(
      left16.subarray(i, i + MP3_FRAME_SIZE),
      right16.subarray(i, i + MP3_FRAME_SIZE)
    )
    if (encoded.length > 0) chunks.push(encoded)
  }

  const lastChunk = encoder.flush()
  if (lastChunk.length > 0) chunks.push(lastChunk)
  return new Blob(chunks, { type: 'audio/mpeg' })
}
