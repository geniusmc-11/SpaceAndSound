import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { NASA_CATEGORIES, RARITY_CONFIG, NASA_CATALOG } from '@/game/NasaDatasetGenerator'

// Constantes configurables del sistema de juego y loot
export const KILLS_PER_DROP = 2
export const MAX_HEALTH = 2
export const MAX_ENERGY = 5
export const SHOOT_COST = 1
export const DASH_COST = 3
export const DASH_DISTANCE = 2

export { NASA_CATEGORIES, RARITY_CONFIG }

/**
 * Selección determinista/ponderada de rareza:
 * - comun: 50% (0.00 - 0.50)
 * - raro: 30% (0.50 - 0.80)
 * - epico: 15% (0.80 - 0.95)
 * - legendario: 5% (0.95 - 1.00)
 */
export function rollDiscRarity(rand = Math.random()) {
  if (rand < 0.5) return 'comun'
  if (rand < 0.8) return 'raro'
  if (rand < 0.95) return 'epico'
  return 'legendario'
}

export const useGameStore = defineStore('game', () => {
  // --- Estadísticas del Jugador (HUD 32-bits) ---
  const health = ref(MAX_HEALTH)
  const maxHealth = ref(MAX_HEALTH)
  const energy = ref(MAX_ENERGY)
  const maxEnergy = ref(MAX_ENERGY)
  const isGameOver = ref(false)

  // --- Posición en Grilla y Cámara (eficiente en Desktop y Móvil) ---
  const playerGrid = ref({
    x: 0,
    y: 0,
    z: 0,
    dirX: 0,
    dirZ: -1,
    yaw: 0, // Radianes (0 mira hacia -Z)
  })

  // --- Progreso de Combate y Loot ---
  const kills = ref(0)
  const killsSinceLastDrop = ref(0)
  const pendingDrops = ref([]) // Discos holográficos 3D activos en la escena
  const collectedDiscs = ref([]) // Bóveda de discos recolectados

  // --- Navegación y Layout Horizontal (Eje X) ---
  // Bloqueado inicialmente: solo se muestra la sección central (índice 1)
  const layoutUnlocked = ref(false)
  const activeSection = ref(1) // 0: Bóveda (Izq), 1: Juego 3D (Centro), 2: Reproductor NASA (Der)
  const navMode = ref(false) // Permite alternar foco de teclado A/D para el carrusel

  // --- Reproductor y Mini-Player Flotante ---
  const currentDisc = ref(null)
  const isPlayingAudio = ref(false)

  // --- Estado QTE (Acechador de Techo / Barra Espaciadora) ---
  const qteActive = ref(false)
  const qteProgress = ref(0)
  const qteTarget = ref(6)
  const trappingEnemyId = ref(null)

  // --- Mensajes de Telemetría HUD ---
  const statusMessage = ref('SISTEMA EN LÍNEA // RECOGE TU PRIMER DISCO NASA PARA DESBLOQUEAR LA NAVE')

  // --- Getters ---
  const canShoot = computed(
    () => energy.value >= SHOOT_COST && !isGameOver.value
  )
  const canDash = computed(
    () => energy.value >= DASH_COST && !isGameOver.value && !qteActive.value
  )
  const killsUntilNextDrop = computed(
    () => KILLS_PER_DROP - (killsSinceLastDrop.value % KILLS_PER_DROP)
  )

  // --- Acciones de Energía y Combate ---
  function shoot() {
    if (energy.value < SHOOT_COST || isGameOver.value) {
      statusMessage.value = 'ENERGÍA INSUFICIENTE PARA DISPARAR (REQUIERE 1⚡)'
      return false
    }
    energy.value = Math.max(0, energy.value - SHOOT_COST)
    return true
  }

  /**
   * Dash (Esquivar): Desplaza 2 bloques hacia atrás instantáneamente y consume 3 cuadritos de energía.
   * @param {Function} [isCellWalkable] Callback opcional (x, z) => boolean para validar colisiones del mapa
   */
  function dash(isCellWalkable) {
    if (energy.value < DASH_COST || isGameOver.value || qteActive.value) {
      statusMessage.value = 'ENERGÍA INSUFICIENTE PARA DASH (REQUIERE 3⚡)'
      return false
    }

    energy.value = Math.max(0, energy.value - DASH_COST)

    // Vector hacia atrás respecto a la dirección actual de la cámara
    const backX = -Math.round(-Math.sin(playerGrid.value.yaw))
    const backZ = -Math.round(-Math.cos(playerGrid.value.yaw))
    const stepX = backX !== 0 ? backX : -playerGrid.value.dirX
    const stepZ = backZ !== 0 ? backZ : -playerGrid.value.dirZ

    let targetX = playerGrid.value.x
    let targetZ = playerGrid.value.z
    let movedBlocks = 0

    for (let i = 1; i <= DASH_DISTANCE; i++) {
      const nextX = playerGrid.value.x + stepX * i
      const nextZ = playerGrid.value.z + stepZ * i
      if (typeof isCellWalkable === 'function' && !isCellWalkable(nextX, nextZ)) {
        break
      }
      targetX = nextX
      targetZ = nextZ
      movedBlocks = i
    }

    playerGrid.value.x = targetX
    playerGrid.value.z = targetZ
    statusMessage.value = `DASH RETROPROPULSADO (-${DASH_COST}⚡ // ${movedBlocks} BLOQUES ATRÁS)`

    return {
      success: true,
      newX: targetX,
      newZ: targetZ,
      distanceMoved: movedBlocks,
    }
  }

  function rechargeEnergy(amount = 1) {
    if (isGameOver.value) return energy.value
    energy.value = Math.min(maxEnergy.value, energy.value + amount)
    return energy.value
  }

  function takeDamage(amount = 1) {
    if (isGameOver.value) return health.value
    health.value = Math.max(0, health.value - amount)
    if (health.value === 0) {
      isGameOver.value = true
      qteActive.value = false
      statusMessage.value = 'TRAJE DESPRESURIZADO // PULSA REINICIAR MISIÓN'
    } else {
      statusMessage.value = `ALERTA DE IMPACTO: SALUD RESTANTE ${health.value}/${maxHealth.value} ♥`
    }
    return health.value
  }

  // --- Movimiento Eficiente de Personaje y Cámara (Desktop y Móvil) ---
  function rotateCamera(deltaYaw) {
    if (isGameOver.value || qteActive.value) return playerGrid.value.yaw
    const nextYaw = playerGrid.value.yaw + deltaYaw
    playerGrid.value.yaw = nextYaw
    // Actualizar vector discreto de grilla según orientación de la cámara
    const dx = -Math.sin(nextYaw)
    const dz = -Math.cos(nextYaw)
    if (Math.abs(dx) > Math.abs(dz)) {
      playerGrid.value.dirX = Math.sign(dx)
      playerGrid.value.dirZ = 0
    } else {
      playerGrid.value.dirX = 0
      playerGrid.value.dirZ = Math.sign(dz) || -1
    }
    return nextYaw
  }

  function movePlayer(forwardSteps = 0, strafeSteps = 0, isCellWalkable) {
    if (isGameOver.value || qteActive.value) return false

    const fwdX = playerGrid.value.dirX
    const fwdZ = playerGrid.value.dirZ
    // Vector lateral derecho: (-fwdZ, fwdX)
    const rightX = -fwdZ
    const rightZ = fwdX

    const nextX = playerGrid.value.x + fwdX * forwardSteps + rightX * strafeSteps
    const nextZ = playerGrid.value.z + fwdZ * forwardSteps + rightZ * strafeSteps

    if (typeof isCellWalkable === 'function' && !isCellWalkable(nextX, nextZ)) {
      return false
    }

    playerGrid.value.x = nextX
    playerGrid.value.z = nextZ
    return true
  }

  function setPlayerGridPosition(x, z) {
    playerGrid.value.x = x
    playerGrid.value.z = z
  }

  // --- Generación y Recolección de Discos NASA ---
  function generateDiscDrop(position = { x: 0, z: -2 }, rng = Math.random) {
    const categoryIndex = Math.floor(rng() * NASA_CATEGORIES.length)
    const category = NASA_CATEGORIES[categoryIndex] || 'espacial'
    const rarity = rollDiscRarity(rng())
    const rarityMeta = RARITY_CONFIG[rarity]
    const catalogPool = NASA_CATALOG[category] || NASA_CATALOG.espacial
    const template = catalogPool[Math.floor(rng() * catalogPool.length)]

    const disc = {
      id: `nasa-disc-${Date.now()}-${Math.floor(rng() * 100000)}`,
      title: template.title,
      instrument: template.instrument,
      date: template.date,
      narration: `${template.narration} Rareza ${rarityMeta.label}.`,
      category,
      rarity,
      colorHex: rarityMeta.hex,
      threeColor: rarityMeta.threeColor,
      seed: Math.floor(rng() * 900) + 100,
      position: {
        x: position?.x ?? playerGrid.value.x,
        y: 0.45,
        z: position?.z ?? playerGrid.value.z,
      },
      collectedAt: null,
    }

    pendingDrops.value.push(disc)
    statusMessage.value = `¡DROP HOLOGRÁFICO GENERADO! [${category.toUpperCase()} // ${rarityMeta.label.toUpperCase()}]`
    return disc
  }

  /**
   * Registra la baja de un enemigo y verifica la regla KILLS_PER_DROP (por defecto cada 2 bajas).
   */
  function registerEnemyKill(position = null, rng = Math.random) {
    kills.value += 1
    killsSinceLastDrop.value += 1

    if (killsSinceLastDrop.value >= KILLS_PER_DROP) {
      killsSinceLastDrop.value = 0
      return generateDiscDrop(
        position || { x: playerGrid.value.x, z: playerGrid.value.z },
        rng
      )
    }

    statusMessage.value = `ENEMIGO ELIMINADO (${killsSinceLastDrop.value}/${KILLS_PER_DROP} PARA DROP DE DISCO NASA)`
    return null
  }

  /**
   * Recoge un disco holográfico 3D:
   * - Lo añade a collectedDiscs
   * - Si es el PRIMER disco, desbloquea dinámicamente el layout horizontal (layoutUnlocked = true)
   * - Activa el Mini-Player flotante con el disco recogido
   */
  function collectDisc(discOrId) {
    let disc = null
    if (typeof discOrId === 'string') {
      const idx = pendingDrops.value.findIndex((d) => d.id === discOrId)
      if (idx !== -1) {
        disc = pendingDrops.value.splice(idx, 1)[0]
      }
    } else if (discOrId && typeof discOrId === 'object') {
      const idx = pendingDrops.value.findIndex((d) => d.id === discOrId.id)
      if (idx !== -1) {
        pendingDrops.value.splice(idx, 1)
      }
      disc = discOrId
    }

    if (!disc) return null

    disc.collectedAt = new Date().toISOString()
    if (!collectedDiscs.value.some((d) => d.id === disc.id)) {
      collectedDiscs.value.unshift(disc)
    }

    // Desbloqueo dinámico del carrusel al recoger el primer disco
    const wasLocked = !layoutUnlocked.value
    if (wasLocked) {
      layoutUnlocked.value = true
    }

    currentDisc.value = disc
    isPlayingAudio.value = true
    statusMessage.value = wasLocked
      ? `¡PRIMER DISCO RECOLECTADO! BÓVEDA (◄ A) Y REPRODUCTOR NASA (D ►) DESBLOQUEADOS`
      : `DISCO CARGADO: ${disc.title.toUpperCase()} (${disc.rarity.toUpperCase()})`

    return disc
  }

  function selectDiscForPlayer(disc) {
    if (!disc) return
    currentDisc.value = disc
    isPlayingAudio.value = true
    activeSection.value = 2
  }

  function toggleAudioPlayback() {
    if (!currentDisc.value) return false
    isPlayingAudio.value = !isPlayingAudio.value
    return isPlayingAudio.value
  }

  // --- Mecánica QTE de Acechador de Techo (Mash Spacebar) ---
  function startStalkerQTE(enemyId, requiredPresses = 6) {
    if (isGameOver.value) return
    qteActive.value = true
    qteProgress.value = 0
    qteTarget.value = requiredPresses
    trappingEnemyId.value = enemyId
    statusMessage.value = '¡ATRAPADO POR ACECHADOR DE TECHO! PRESIONA RÁPIDO [ESPACIO] PARA LIBERARTE'
  }

  function pressSpaceQTE(enemyPosition = null) {
    if (!qteActive.value) return { freed: false, defeatedEnemyId: null, drop: null }
    qteProgress.value += 1

    if (qteProgress.value >= qteTarget.value) {
      const defeatedId = trappingEnemyId.value
      qteActive.value = false
      qteProgress.value = 0
      trappingEnemyId.value = null
      const drop = registerEnemyKill(enemyPosition)
      statusMessage.value = '¡TE LIBERASTE! ACECHADOR DE TECHO DESTRUIDO'
      return { freed: true, defeatedEnemyId: defeatedId, drop }
    }

    return { freed: false, defeatedEnemyId: null, drop: null }
  }

  function failStalkerQTE() {
    if (!qteActive.value) return
    qteActive.value = false
    qteProgress.value = 0
    trappingEnemyId.value = null
    takeDamage(1)
  }

  function setActiveSection(index) {
    if (!layoutUnlocked.value) {
      activeSection.value = 1
      return
    }
    activeSection.value = Math.max(0, Math.min(2, index))
  }

  function resetGame() {
    health.value = MAX_HEALTH
    energy.value = MAX_ENERGY
    isGameOver.value = false
    qteActive.value = false
    qteProgress.value = 0
    trappingEnemyId.value = null
    playerGrid.value = { x: 0, y: 0, z: 0, dirX: 0, dirZ: -1, yaw: 0 }
    statusMessage.value = 'SISTEMAS REINICIADOS // EXPLORA LA NAVE AVERIADA'
  }

  return {
    // Estado
    health,
    maxHealth,
    energy,
    maxEnergy,
    isGameOver,
    playerGrid,
    kills,
    killsSinceLastDrop,
    pendingDrops,
    collectedDiscs,
    layoutUnlocked,
    activeSection,
    navMode,
    currentDisc,
    isPlayingAudio,
    qteActive,
    qteProgress,
    qteTarget,
    trappingEnemyId,
    statusMessage,
    // Getters
    canShoot,
    canDash,
    killsUntilNextDrop,
    // Acciones
    shoot,
    dash,
    rechargeEnergy,
    takeDamage,
    rotateCamera,
    movePlayer,
    setPlayerGridPosition,
    generateDiscDrop,
    registerEnemyKill,
    collectDisc,
    selectDiscForPlayer,
    toggleAudioPlayback,
    startStalkerQTE,
    pressSpaceQTE,
    failStalkerQTE,
    setActiveSection,
    resetGame,
  }
})
