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

export async function encodeAudioBlobAsMp3(audioBlob) {
  if (typeof AudioContext === 'undefined') {
    throw new Error('MP3 export requires Web Audio support in this browser.')
  }

  const audioContext = new AudioContext()
  let audioBuffer
  try {
    audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer())
  } finally {
    await audioContext.close()
  }

  const lameModule = await import('@breezystack/lamejs')
  const lame = lameModule.default || lameModule
  const Mp3Encoder = lame.Mp3Encoder || lameModule.Mp3Encoder
  if (typeof Mp3Encoder !== 'function') {
    throw new Error('The MP3 encoder could not be loaded.')
  }

  const channels = audioBuffer.numberOfChannels > 1 ? 2 : 1
  const encoder = new Mp3Encoder(channels, audioBuffer.sampleRate, MP3_BITRATE_KBPS)
  const left = toInt16Samples(audioBuffer.getChannelData(0))
  const right = channels === 2 ? toInt16Samples(audioBuffer.getChannelData(1)) : null
  const chunks = []

  for (let i = 0; i < left.length; i += MP3_FRAME_SIZE) {
    const leftChunk = left.subarray(i, i + MP3_FRAME_SIZE)
    const rightChunk = right?.subarray(i, i + MP3_FRAME_SIZE)
    const encoded = channels === 2
      ? encoder.encodeBuffer(leftChunk, rightChunk)
      : encoder.encodeBuffer(leftChunk)
    if (encoded.length > 0) chunks.push(encoded)
  }

  const lastChunk = encoder.flush()
  if (lastChunk.length > 0) chunks.push(lastChunk)
  return new Blob(chunks, { type: 'audio/mpeg' })
}

export function recordMediaStream(stream, durationMs, onProgress = () => {}) {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Audio recording is not supported in this browser.')
  }

  const mimeType = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/webm',
  ].find((candidate) => MediaRecorder.isTypeSupported(candidate))
  if (!mimeType) {
    throw new Error('This browser cannot record audio for MP3 export.')
  }

  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks = []
  const startedAt = Date.now()

  return new Promise((resolve, reject) => {
    let stopTimer
    let progressTimer

    const cleanup = () => {
      clearTimeout(stopTimer)
      clearInterval(progressTimer)
    }

    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data)
    }
    recorder.onerror = () => {
      cleanup()
      if (recorder.state !== 'inactive') recorder.stop()
      reject(new Error('Audio recording failed before MP3 conversion.'))
    }
    recorder.onstop = () => {
      cleanup()
      onProgress(1)
      resolve(new Blob(chunks, { type: mimeType }))
    }

    try {
      recorder.start(250)
      onProgress(0)
      progressTimer = setInterval(() => {
        onProgress(Math.min(1, (Date.now() - startedAt) / durationMs))
      }, 250)
      stopTimer = setTimeout(() => recorder.stop(), durationMs)
    } catch (error) {
      cleanup()
      reject(error)
    }
  })
}
