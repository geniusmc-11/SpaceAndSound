/**
 * Sistema de Audio Espacial 3D (Web Audio API PannerNode)
 * Guía al jugador en la niebla densa (THREE.FogExp2) mediante pistas acústicas direccionales:
 * 1. Acechador de Techo: Pasos metálicos 2 niveles arriba (y = +2).
 * 2. Francotirador Oculto: Disparo láser y zumbido Doppler de bala acercándose desde la oscuridad.
 * 3. Anomalía Gravitatoria: Pulso de tracción sub-grave cada 1.5s cuando estás a <= 3 bloques.
 */

let audioCtx = null

function getContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass()
    } catch {
      return null
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function createSpatialPanner(ctx, sourcePos, listenerPos, listenerYaw = 0) {
  const panner = ctx.createPanner()
  panner.panningModel = 'equalpower'
  panner.distanceModel = 'inverse'
  panner.refDistance = 1.2
  panner.maxDistance = 18
  panner.rolloffFactor = 1.4

  // Calcular posición relativa rotada según el yaw de la cámara del jugador
  const dx = (sourcePos.x || 0) - (listenerPos.x || 0)
  const dy = (sourcePos.y || 0) - (listenerPos.y || 0)
  const dz = (sourcePos.z || 0) - (listenerPos.z || 0)

  const cosY = Math.cos(listenerYaw)
  const sinY = Math.sin(listenerYaw)
  const relX = dx * cosY - dz * sinY
  const relZ = dx * sinY + dz * cosY

  if (panner.positionX) {
    panner.positionX.value = relX
    panner.positionY.value = dy
    panner.positionZ.value = relZ
  } else {
    panner.setPosition(relX, dy, relZ)
  }

  panner.connect(ctx.destination)
  return panner
}

export function useSpatialAudio() {
  /**
   * 1. Acechador de Techo: pasos metálicos resonando 2 niveles arriba (y = +2)
   */
  function playStalkerFootstep(enemyPos, playerPos, playerYaw) {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const panner = createSpatialPanner(
      ctx,
      { x: enemyPos.x, y: 2.0, z: enemyPos.z },
      { x: playerPos.x, y: 0, z: playerPos.z },
      playerYaw
    )

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(145, now)
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.11)

    gain.gain.setValueAtTime(0.32, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    osc.connect(gain)
    gain.connect(panner)
    osc.start(now)
    osc.stop(now + 0.13)
  }

  /**
   * 2. Francotirador Oculto: sonido direccional del disparo / proyectil acercándose desde la oscuridad
   */
  function playSniperShotApproaching(enemyPos, playerPos, playerYaw) {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const panner = createSpatialPanner(ctx, enemyPos, playerPos, playerYaw)

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    // Efecto Doppler de proyectil acercándose
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.35)

    gain.gain.setValueAtTime(0.28, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36)

    osc.connect(gain)
    gain.connect(panner)
    osc.start(now)
    osc.stop(now + 0.37)
  }

  /**
   * 3. Anomalía Gravitatoria: pulso magnético cuando atrae al jugador 1 bloque cada 1.5s
   */
  function playGravityPullPulse(enemyPos, playerPos, playerYaw) {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const panner = createSpatialPanner(ctx, enemyPos, playerPos, playerYaw)

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(65, now)
    osc.frequency.linearRampToValueAtTime(130, now + 0.28)

    gain.gain.setValueAtTime(0.38, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    osc.connect(gain)
    gain.connect(panner)
    osc.start(now)
    osc.stop(now + 0.31)
  }

  /**
   * Efectos del jugador: Disparo (-1⚡), Dash (-3⚡) y Explosión de enemigo
   */
  function playPlayerShoot() {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(620, now)
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.14)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.16)
  }

  function playPlayerDash() {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.18)
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.21)
  }

  function playEnemyExplosion() {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(160, now)
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.32)
    gain.gain.setValueAtTime(0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.35)
  }

  return {
    playStalkerFootstep,
    playSniperShotApproaching,
    playGravityPullPulse,
    playPlayerShoot,
    playPlayerDash,
    playEnemyExplosion,
  }
}
