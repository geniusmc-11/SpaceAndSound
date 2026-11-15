<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import {
  useGameStore,
  KILLS_PER_DROP,
  SHOOT_COST,
  DASH_COST,
  RARITY_CONFIG,
} from '@/stores/useGameStore'
import { EnemyFactory } from '@/game/EnemyFactory'
import { createAnimatedGifSpriteMaterial, GIF_SPRITE_PATHS } from '@/game/GifSpriteLoader'
import {
  CONTROL_STATION_GRID,
  PLAYER_BULLET_SPEED,
  ENEMY_BULLET_SPEED,
  SHIP_FOG_DENSITY,
  SHIP_CAMERA_FAR,
  isControlConsoleCell,
  findBulletHitEnemy,
  createSpaceshipFloorTileTexture,
  buildControlConsoleObject,
  buildIntelligentWindows,
} from '@/game/SpaceshipEnvironment'
import { useSpatialAudio } from '@/composables/useSpatialAudio'
import MiniPlayer from './MiniPlayer.vue'

const emit = defineEmits(['navigate-left', 'navigate-right'])
const gameStore = useGameStore()
const spatialAudio = useSpatialAudio()

const canvasRef = ref(null)
const showVisualPlaceholders = ref(true)
const muzzleFlash = ref(false)
const damageFlash = ref(false)
const gravityWarning = ref(false)
const audioCueBanner = ref('ESCUCHA EN LA NIEBLA: PASOS EN EL TECHO Y DISPAROS A DISTANCIA')

// Límites del corredor espacial en grilla (cada celda = 2 unidades en 3D)
const GRID_MIN_X = -4
const GRID_MAX_X = 4
const GRID_MIN_Z = -8
const GRID_MAX_Z = 4
const CELL_SIZE = 2.0

// Variables Three.js fuera de Vue ref() para máximo rendimiento 60fps
let renderer = null
let scene = null
let camera = null
let animFrameId = null
let rechargeIntervalId = null
let spriteAnimIntervalId = null
let lastFrameTime = 0

// Posición visual interpolada de la cámara (movimiento suave y eficiente)
const smoothCam = {
  x: 0,
  y: 0.85,
  z: 0,
  yaw: 0,
  pitch: 0,
}

// Entidades activas en la escena 3D
const activeEnemies = []
const activeExplosions = []
const activeProjectiles = []
const activePlayerBullets = []
const discMeshesById = new Map()
let consoleLightRef = null

// Control táctil eficiente para móviles (Touch Look + D-Pad)
let touchLookId = null
let lastTouchX = 0
let lastTouchY = 0

function isCellWalkable(gx, gz) {
  if (isControlConsoleCell(gx, gz)) return false
  return gx >= GRID_MIN_X && gx <= GRID_MAX_X && gz >= GRID_MIN_Z && gz <= GRID_MAX_Z
}

/**
 * Crea texturas pixeladas procedurales 32-bits con THREE.NearestFilter
 */
function createPixelWallTexture(baseHex, accentHex) {
  const c = document.createElement('canvas')
  c.width = 32
  c.height = 32
  const ctx = c.getContext('2d')
  if (ctx) {
    ctx.fillStyle = baseHex
    ctx.fillRect(0, 0, 32, 32)
    ctx.fillStyle = accentHex
    ctx.fillRect(0, 0, 32, 2)
    ctx.fillRect(0, 15, 32, 2)
    ctx.fillRect(0, 30, 32, 2)
    ctx.fillRect(15, 0, 2, 32)
    // Remaches estilo Doom/PS1
    ctx.fillStyle = '#38bdf8'
    ctx.fillRect(3, 4, 2, 2)
    ctx.fillRect(27, 4, 2, 2)
    ctx.fillRect(3, 20, 2, 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

function buildSpaceshipEnvironment() {
  // Niebla exponencial muy densa para visibilidad reducida (atmósfera de nave averiada)
  scene.fog = new THREE.FogExp2(0x04070e, SHIP_FOG_DENSITY)
  scene.background = new THREE.Color(0x04070e)

  const ambientLight = new THREE.AmbientLight(0x283548, 0.38)
  scene.add(ambientLight)

  const playerTorch = new THREE.PointLight(0x38bdf8, 1.65, 8.5, 1.8)
  playerTorch.position.set(0, 1.15, 0)
  camera.add(playerTorch)
  scene.add(camera)

  const wallTex = createPixelWallTexture('#0b1324', '#1e293b')
  const floorTex = createSpaceshipFloorTileTexture(THREE)
  const ceilingTex = createPixelWallTexture('#090d1a', '#1e1b4b')

  const cellsWide = GRID_MAX_X - GRID_MIN_X + 2
  const cellsDeep = GRID_MAX_Z - GRID_MIN_Z + 2
  const widthWorld = cellsWide * CELL_SIZE
  const depthWorld = cellsDeep * CELL_SIZE
  const centerZ = ((GRID_MIN_Z + GRID_MAX_Z) / 2) * CELL_SIZE

  // Losas alineadas 1:1 con cada bloque de la nave
  floorTex.repeat.set(cellsWide, cellsDeep)
  ceilingTex.repeat.set(widthWorld / 2, depthWorld / 2)

  // Suelo de losas metálicas estilo nave espacial
  const floorGeo = new THREE.PlaneGeometry(widthWorld, depthWorld)
  const floorMat = new THREE.MeshLambertMaterial({ map: floorTex })
  const floorMesh = new THREE.Mesh(floorGeo, floorMat)
  floorMesh.rotation.x = -Math.PI / 2
  floorMesh.position.set(0, 0, centerZ)
  scene.add(floorMesh)

  // Techo a 2 niveles de altura (donde patrulla el Acechador de Techo)
  const ceilMesh = new THREE.Mesh(
    floorGeo,
    new THREE.MeshLambertMaterial({ map: ceilingTex })
  )
  ceilMesh.rotation.x = Math.PI / 2
  ceilMesh.position.set(0, 2.6, centerZ)
  scene.add(ceilMesh)

  // Paredes perimetrales de la nave averiada
  const wallMat = new THREE.MeshLambertMaterial({ map: wallTex })
  const sideWallGeo = new THREE.BoxGeometry(0.4, 2.8, depthWorld)
  const leftWall = new THREE.Mesh(sideWallGeo, wallMat)
  leftWall.position.set((GRID_MIN_X - 0.8) * CELL_SIZE, 1.4, centerZ)
  scene.add(leftWall)

  const rightWall = new THREE.Mesh(sideWallGeo, wallMat)
  rightWall.position.set((GRID_MAX_X + 0.8) * CELL_SIZE, 1.4, centerZ)
  scene.add(rightWall)

  const backWallGeo = new THREE.BoxGeometry(widthWorld, 2.8, 0.4)
  const northWall = new THREE.Mesh(backWallGeo, wallMat)
  northWall.position.set(0, 1.4, (GRID_MIN_Z - 0.8) * CELL_SIZE)
  scene.add(northWall)

  const southWall = new THREE.Mesh(backWallGeo, wallMat)
  southWall.position.set(0, 1.4, (GRID_MAX_Z + 0.8) * CELL_SIZE)
  scene.add(southWall)

  // Punto de controles de la nave como objeto 3D sólido en (0, -6)
  const consoleObj = buildControlConsoleObject(THREE, CELL_SIZE)
  consoleLightRef = consoleObj.light
  scene.add(consoleObj.group)

  // Ventanas espaciales ubicadas inteligentemente en casco lateral y puente norte
  buildIntelligentWindows(THREE, scene, GRID_MIN_X, GRID_MAX_X, GRID_MIN_Z, CELL_SIZE)
}

/**
 * Genera una oleada balanceada con los 3 tipos de enemigos guiados por audio espacial
 */
function spawnInitialWave() {
  if (!scene) return
  activeEnemies.forEach((e) => {
    scene.remove(e.sprite)
    e.spriteCtrl.dispose()
  })
  activeEnemies.length = 0

  const initialSpawns = [
    { type: 'shooter', gx: 0, gz: -3 }, // Francotirador frente al jugador para prueba rápida
    { type: 'stalker', gx: -1, gz: -2 }, // Acechador de techo 2 niveles arriba
    { type: 'gravity', gx: 1, gz: -4 }, // Anomalía gravitatoria
    { type: 'shooter', gx: -2, gz: -5 },
    { type: 'stalker', gx: 2, gz: -3 },
  ]

  initialSpawns.forEach((cfg) => {
    const enemy = EnemyFactory.createEnemy(cfg.type, cfg.gx, cfg.gz, {
      showVisualPlaceholder: showVisualPlaceholders.value,
    })
    scene.add(enemy.sprite)
    activeEnemies.push(enemy)
  })
}

function respawnReplacementEnemy() {
  if (!scene) return
  const types = ['stalker', 'shooter', 'gravity']
  const randomType = types[Math.floor(Math.random() * types.length)]
  let gx = Math.floor(Math.random() * (GRID_MAX_X - GRID_MIN_X + 1)) + GRID_MIN_X
  let gz = Math.floor(Math.random() * (GRID_MAX_Z - GRID_MIN_Z + 1)) + GRID_MIN_Z
  if (
    isControlConsoleCell(gx, gz) ||
    (Math.abs(gx - gameStore.playerGrid.x) <= 1 && Math.abs(gz - gameStore.playerGrid.z) <= 1)
  ) {
    gz = gz === CONTROL_STATION_GRID.z ? GRID_MIN_Z : Math.max(GRID_MIN_Z, gz - 3)
  }
  const enemy = EnemyFactory.createEnemy(randomType, gx, gz, {
    showVisualPlaceholder: showVisualPlaceholders.value,
  })
  scene.add(enemy.sprite)
  activeEnemies.push(enemy)
}

/**
 * Dispara el GIF de explosión (death_explosion.gif con NearestFilter) al derrotar a un enemigo
 */
function triggerDeathExplosionGif(worldPos) {
  if (!scene) return
  spatialAudio.playEnemyExplosion()
  const explosionCtrl = createAnimatedGifSpriteMaterial(
    'explosion',
    GIF_SPRITE_PATHS.explosion,
    { showVisualPlaceholder: showVisualPlaceholders.value }
  )
  const sprite = new THREE.Sprite(explosionCtrl.material)
  sprite.position.copy(worldPos)
  sprite.scale.set(1.9, 1.9, 1)
  scene.add(sprite)

  activeExplosions.push({
    sprite,
    ctrl: explosionCtrl,
    ttlMs: 550,
  })
}

/**
 * Renderiza en 3D los Discos Holográficos NASA generados cada KILLS_PER_DROP bajas
 */
function syncDiscMeshesWithStore() {
  if (!scene) return
  const currentIds = new Set(gameStore.pendingDrops.map((d) => d.id))

  // Eliminar mallas de discos ya recogidos
  discMeshesById.forEach((meshGroup, id) => {
    if (!currentIds.has(id)) {
      scene.remove(meshGroup)
      discMeshesById.delete(id)
    }
  })

  // Crear malla 3D para nuevos drops holográficos con aura según rareza
  gameStore.pendingDrops.forEach((disc) => {
    if (discMeshesById.has(disc.id)) return

    const group = new THREE.Group()
    group.position.set(
      disc.position.x * CELL_SIZE,
      0.65,
      disc.position.z * CELL_SIZE
    )

    const color = disc.threeColor || 0x38bdf8

    // Toro holográfico principal (Disco NASA)
    const torusGeo = new THREE.TorusGeometry(0.42, 0.1, 8, 16)
    const torusMat = new THREE.MeshBasicMaterial({
      color,
      wireframe: false,
    })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    group.add(torus)

    // Aura octogonal de rareza alrededor del disco
    const auraGeo = new THREE.OctahedronGeometry(0.65, 0)
    const auraMat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    })
    const aura = new THREE.Mesh(auraGeo, auraMat)
    group.add(aura)

    scene.add(group)
    discMeshesById.set(disc.id, group)
  })
}

watch(
  () => gameStore.pendingDrops.length,
  () => {
    syncDiscMeshesWithStore()
    checkAutoCollectNearbyDiscs()
  }
)

function checkAutoCollectNearbyDiscs() {
  const px = gameStore.playerGrid.x
  const pz = gameStore.playerGrid.z

  for (const disc of [...gameStore.pendingDrops]) {
    const dist = Math.hypot(disc.position.x - px, disc.position.z - pz)
    if (dist <= 1.25) {
      gameStore.collectDisc(disc)
      syncDiscMeshesWithStore()
    }
  }
}

/**
 * Acción de Disparo (-1 cuadrito de energía)
 * Dispara un proyectil físico lento siguiendo exactamente la dirección de mira 3D (yaw + pitch).
 */
function handleShootAction() {
  if (!gameStore.shoot()) return
  spatialAudio.playPlayerShoot()
  muzzleFlash.value = true
  setTimeout(() => {
    muzzleFlash.value = false
  }, 90)

  if (!scene) return

  const cosPitch = Math.cos(smoothCam.pitch)
  const dirX = -Math.sin(smoothCam.yaw) * cosPitch
  const dirY = Math.sin(smoothCam.pitch)
  const dirZ = -Math.cos(smoothCam.yaw) * cosPitch

  const bulletGeo = new THREE.SphereGeometry(0.11, 6, 6)
  const bulletMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat)
  bulletMesh.position.set(
    smoothCam.x + dirX * 0.45,
    smoothCam.y - 0.08 + dirY * 0.45,
    smoothCam.z + dirZ * 0.45
  )
  scene.add(bulletMesh)

  activePlayerBullets.push({
    mesh: bulletMesh,
    vx: dirX * PLAYER_BULLET_SPEED,
    vy: dirY * PLAYER_BULLET_SPEED,
    vz: dirZ * PLAYER_BULLET_SPEED,
    traveled: 0,
    maxDist: 16,
  })
}

function defeatEnemyEntity(enemy) {
  if (!enemy || !enemy.alive) return
  enemy.alive = false
  if (scene) {
    scene.remove(enemy.sprite)
  }
  triggerDeathExplosionGif(enemy.sprite.position.clone())

  // Generar el disco en la posición del enemigo derrotado para verlo flotar en 3D
  const dropPos = {
    x: enemy.gridX,
    z: enemy.gridZ,
  }
  const spawnedDisc = gameStore.registerEnemyKill(dropPos)
  syncDiscMeshesWithStore()

  // Recoger automáticamente si el jugador ya está junto al disco
  if (spawnedDisc) {
    checkAutoCollectNearbyDiscs()
  }

  // Reponer enemigo tras unos segundos para mantener el loop de juego activo
  setTimeout(() => {
    respawnReplacementEnemy()
  }, 1800)
}

/**
 * Acción de Dash (-3 cuadritos de energía, retrocede 2 bloques instantáneamente)
 */
function handleDashAction() {
  const result = gameStore.dash(isCellWalkable)
  if (!result) return
  spatialAudio.playPlayerDash()
  gravityWarning.value = false
  checkAutoCollectNearbyDiscs()
}

/**
 * Acción de Barra Espaciadora (QTE cuando te atrapa el Acechador de Techo)
 */
function handleSpaceQTEAction() {
  if (!gameStore.qteActive) {
    handleShootAction()
    return
  }

  const trappingEnemy = activeEnemies.find(
    (e) => e.id === gameStore.trappingEnemyId && e.alive
  )
  const dropPos = {
    x: gameStore.playerGrid.x,
    z: gameStore.playerGrid.z,
  }
  const res = gameStore.pressSpaceQTE(dropPos)
  if (res.freed) {
    if (trappingEnemy) {
      trappingEnemy.alive = false
      trappingEnemy.isTrappingPlayer = false
      if (scene) scene.remove(trappingEnemy.sprite)
      triggerDeathExplosionGif(trappingEnemy.sprite.position.clone())
    }
    syncDiscMeshesWithStore()
    checkAutoCollectNearbyDiscs()
    setTimeout(() => respawnReplacementEnemy(), 1800)
  }
}

/**
 * Actualización de IA y Audio Espacial de los 3 Tipos de Enemigos
 */
function updateEnemiesAndSpatialAudio(dtMs) {
  if (gameStore.isGameOver) return

  const px = gameStore.playerGrid.x
  const pz = gameStore.playerGrid.z
  const pyaw = gameStore.playerGrid.yaw
  let anyGravityPulling = false

  for (const enemy of activeEnemies) {
    if (!enemy.alive) continue
    enemy.timerMs += dtMs

    const distBlocks = Math.hypot(enemy.gridX - px, enemy.gridZ - pz)

    // ------------------------------------------------------------------------
    // 1. ACECHADOR DE TECHO (Trampa Superior - Nivel Y = +2)
    // ------------------------------------------------------------------------
    if (enemy.type === 'stalker') {
      if (enemy.isTrappingPlayer) {
        enemy.qteTimerMs += dtMs
        // Si no reaccionas presionando Espacio a tiempo, pierdes 1 corazón
        if (enemy.qteTimerMs >= 4500) {
          enemy.isTrappingPlayer = false
          enemy.qteTimerMs = 0
          gameStore.failStalkerQTE()
          triggerDamageFlash()
          // Se desplaza 1 bloque tras atacar
          enemy.gridZ = Math.max(GRID_MIN_Z, enemy.gridZ - 2)
          enemy.sprite.position.set(enemy.gridX * CELL_SIZE, 2.0, enemy.gridZ * CELL_SIZE)
        }
        continue
      }

      // Patrulla por el techo emitiendo pasos espaciales arriba del jugador
      if (enemy.timerMs >= enemy.blueprint.stepIntervalMs) {
        enemy.timerMs = 0
        const stepX = Math.sign(px - enemy.gridX)
        const stepZ = Math.sign(pz - enemy.gridZ)
        if (Math.random() < 0.65) {
          if (Math.abs(px - enemy.gridX) >= Math.abs(pz - enemy.gridZ)) {
            enemy.gridX += stepX
          } else {
            enemy.gridZ += stepZ
          }
        }
        enemy.sprite.position.set(enemy.gridX * CELL_SIZE, 2.0, enemy.gridZ * CELL_SIZE)

        if (distBlocks <= 5) {
          spatialAudio.playStalkerFootstep(
            { x: enemy.gridX, z: enemy.gridZ },
            { x: px, z: pz },
            pyaw
          )
          audioCueBanner.value = `🔊 PASOS EN EL TECHO DETECTADOS A ${Math.round(distBlocks)} BLOQUES ARRIBA`
        }
      }

      // Si te colocas en la casilla exactamente debajo de él -> Te atrapa y activa QTE
      if (enemy.gridX === px && enemy.gridZ === pz && !gameStore.qteActive) {
        enemy.isTrappingPlayer = true
        enemy.qteTimerMs = 0
        // Desciende sobre el jugador
        enemy.sprite.position.set(px * CELL_SIZE, 0.9, pz * CELL_SIZE)
        gameStore.startStalkerQTE(enemy.id, 6)
      }
    }

    // ------------------------------------------------------------------------
    // 2. FRANCOTIRADOR OCULTO (Tirador en la oscuridad)
    // ------------------------------------------------------------------------
    else if (enemy.type === 'shooter') {
      if (enemy.timerMs >= enemy.blueprint.attackIntervalMs) {
        enemy.timerMs = 0
        if (distBlocks <= 7) {
          spatialAudio.playSniperShotApproaching(
            { x: enemy.gridX, y: 0.8, z: enemy.gridZ },
            { x: px, y: 0.8, z: pz },
            pyaw
          )
          audioCueBanner.value = `🔊 ¡DISPARO DE FRANCOTIRADOR ACERCÁNDOSE DESDE (${enemy.gridX}, ${enemy.gridZ})!`

          // Crear proyectil luminoso acercándose desde la niebla
          if (scene) {
            const projGeo = new THREE.SphereGeometry(0.14, 6, 6)
            const projMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e })
            const projMesh = new THREE.Mesh(projGeo, projMat)
            projMesh.position.set(enemy.gridX * CELL_SIZE, 0.8, enemy.gridZ * CELL_SIZE)
            scene.add(projMesh)

            const startX = enemy.gridX * CELL_SIZE
            const startZ = enemy.gridZ * CELL_SIZE
            const endX = px * CELL_SIZE
            const endZ = pz * CELL_SIZE
            const distWorld = Math.max(1.0, Math.hypot(endX - startX, endZ - startZ))
            const durationMs = (distWorld / ENEMY_BULLET_SPEED) * 1000

            activeProjectiles.push({
              mesh: projMesh,
              targetGridX: px,
              targetGridZ: pz,
              progress: 0,
              durationMs,
              startX,
              startZ,
              endX,
              endZ,
            })
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // 3. ANOMALÍA GRAVITATORIA (Atracción cada 1.5s a <= 3 bloques)
    // ------------------------------------------------------------------------
    else if (enemy.type === 'gravity') {
      if (distBlocks <= enemy.blueprint.pullRadiusBlocks) {
        anyGravityPulling = true
        enemy.pullAccumulatorMs += dtMs

        // Cada 1.5 segundos (1500ms) te atrae 1 bloque hacia ella
        if (enemy.pullAccumulatorMs >= enemy.blueprint.pullIntervalMs) {
          enemy.pullAccumulatorMs -= enemy.blueprint.pullIntervalMs

          const pullStepX = Math.sign(enemy.gridX - px)
          const pullStepZ = Math.sign(enemy.gridZ - pz)
          let nextX = px
          let nextZ = pz

          if (Math.abs(enemy.gridX - px) >= Math.abs(enemy.gridZ - pz) && pullStepX !== 0) {
            nextX += pullStepX
          } else if (pullStepZ !== 0) {
            nextZ += pullStepZ
          }

          gameStore.setPlayerGridPosition(nextX, nextZ)
          spatialAudio.playGravityPullPulse(
            { x: enemy.gridX, y: 0.8, z: enemy.gridZ },
            { x: nextX, y: 0.8, z: nextZ },
            pyaw
          )
          audioCueBanner.value =
            '⚠️ CAMPO GRAVITATORIO: ATRAÍDO 1 BLOQUE // ¡USA DASH (-3⚡) PARA ESCAPAR!'

          // Si llegas a tocarlo, explota quitándote vida
          if (nextX === enemy.gridX && nextZ === enemy.gridZ) {
            gameStore.takeDamage(1)
            triggerDamageFlash()
            defeatEnemyEntity(enemy)
          }
        }
      } else {
        enemy.pullAccumulatorMs = 0
      }
    }
  }

  gravityWarning.value = anyGravityPulling
}

function updateProjectilesAndExplosions(dtMs) {
  const dtSec = dtMs / 1000
  const minWorldX = (GRID_MIN_X - 0.65) * CELL_SIZE
  const maxWorldX = (GRID_MAX_X + 0.65) * CELL_SIZE
  const minWorldZ = (GRID_MIN_Z - 0.65) * CELL_SIZE
  const maxWorldZ = (GRID_MAX_Z + 0.65) * CELL_SIZE
  const consoleWorldX = CONTROL_STATION_GRID.x * CELL_SIZE
  const consoleWorldZ = CONTROL_STATION_GRID.z * CELL_SIZE

  // Actualizar balas lentas del jugador y verificar colisión estricta 3D
  for (let i = activePlayerBullets.length - 1; i >= 0; i--) {
    const b = activePlayerBullets[i]
    const stepX = b.vx * dtSec
    const stepY = b.vy * dtSec
    const stepZ = b.vz * dtSec

    b.mesh.position.x += stepX
    b.mesh.position.y += stepY
    b.mesh.position.z += stepZ
    b.traveled += Math.hypot(stepX, stepY, stepZ)

    const pos = b.mesh.position
    const hitConsole =
      Math.abs(pos.x - consoleWorldX) <= 0.88 &&
      Math.abs(pos.z - consoleWorldZ) <= 0.62 &&
      pos.y <= 1.38
    const outOfBounds =
      pos.x < minWorldX ||
      pos.x > maxWorldX ||
      pos.z < minWorldZ ||
      pos.z > maxWorldZ ||
      pos.y <= 0.05 ||
      pos.y >= 2.55 ||
      b.traveled >= b.maxDist

    if (hitConsole || outOfBounds) {
      if (scene) scene.remove(b.mesh)
      activePlayerBullets.splice(i, 1)
      continue
    }

    const hitEnemy = findBulletHitEnemy(pos, activeEnemies)
    if (hitEnemy) {
      if (scene) scene.remove(b.mesh)
      activePlayerBullets.splice(i, 1)
      defeatEnemyEntity(hitEnemy)
    }
  }

  // Actualizar proyectiles lentos de francotirador
  for (let i = activeProjectiles.length - 1; i >= 0; i--) {
    const p = activeProjectiles[i]
    p.progress += dtMs / (p.durationMs || 1800)
    if (p.progress >= 1) {
      if (scene) scene.remove(p.mesh)
      activeProjectiles.splice(i, 1)
      // Si el jugador no esquivó de esa casilla, recibe daño
      if (
        gameStore.playerGrid.x === p.targetGridX &&
        gameStore.playerGrid.z === p.targetGridZ &&
        !gameStore.isGameOver
      ) {
        gameStore.takeDamage(1)
        triggerDamageFlash()
      }
    } else {
      p.mesh.position.x = p.startX + (p.endX - p.startX) * p.progress
      p.mesh.position.z = p.startZ + (p.endZ - p.startZ) * p.progress
    }
  }

  // Actualizar explosiones .GIF
  for (let i = activeExplosions.length - 1; i >= 0; i--) {
    const exp = activeExplosions[i]
    exp.ttlMs -= dtMs
    if (exp.ttlMs <= 0) {
      if (scene) scene.remove(exp.sprite)
      exp.ctrl.dispose()
      activeExplosions.splice(i, 1)
    }
  }
}

function triggerDamageFlash() {
  damageFlash.value = true
  setTimeout(() => {
    damageFlash.value = false
  }, 220)
}

function togglePlaceholderStyle() {
  showVisualPlaceholders.value = !showVisualPlaceholders.value
  activeEnemies.forEach((e) => {
    e.spriteCtrl.setPlaceholderMode(showVisualPlaceholders.value)
  })
}

// ============================================================================
// CONTROLES EFICIENTES EN COMPUTADORA (TECLADO / RATÓN) Y MÓVILES (TOUCH)
// ============================================================================
function handleMoveStep(forward, strafe = 0) {
  const moved = gameStore.movePlayer(forward, strafe, isCellWalkable)
  if (moved) {
    checkAutoCollectNearbyDiscs()
    const distConsole = Math.hypot(
      gameStore.playerGrid.x - CONTROL_STATION_GRID.x,
      gameStore.playerGrid.z - CONTROL_STATION_GRID.z
    )
    if (distConsole <= 1.5) {
      audioCueBanner.value =
        '🛰️ PUNTO DE CONTROL DE LA NAVE: TELEMETRÍA ACTIVA // RECUPERA ENERGÍA JUNTO AL PUENTE'
      gameStore.rechargeEnergy(1)
    }
  }
}

function handleRotateStep(deltaYaw) {
  gameStore.rotateCamera(deltaYaw)
}

function handleKeyDown(e) {
  // Solo procesar controles de juego cuando estamos en la sección central (índice 1)
  if (gameStore.activeSection !== 1) return

  if (e.code === 'Space') {
    e.preventDefault()
    handleSpaceQTEAction()
    return
  }

  // Si el modo menú de carrusel está activo, dejar que App.vue maneje A/D
  if (gameStore.navMode && (e.code === 'KeyA' || e.code === 'KeyD')) {
    return
  }

  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      e.preventDefault()
      handleMoveStep(1, 0)
      break
    case 'KeyS':
    case 'ArrowDown':
      e.preventDefault()
      handleMoveStep(-1, 0)
      break
    case 'KeyQ':
    case 'ArrowLeft':
      e.preventDefault()
      handleRotateStep(Math.PI / 2)
      break
    case 'KeyE':
    case 'ArrowRight':
      e.preventDefault()
      handleRotateStep(-Math.PI / 2)
      break
    case 'KeyA':
      handleMoveStep(0, -1)
      break
    case 'KeyD':
      handleMoveStep(0, 1)
      break
    case 'ShiftLeft':
    case 'ShiftRight':
    case 'KeyX':
      e.preventDefault()
      handleDashAction()
      break
    case 'KeyF':
    case 'Enter':
      e.preventDefault()
      handleShootAction()
      break
  }
}

// Giro táctil suave al deslizar el dedo sobre el visor 3D en dispositivos móviles
function onCanvasTouchStart(e) {
  if (e.touches.length === 1) {
    const t = e.touches[0]
    touchLookId = t.identifier
    lastTouchX = t.clientX
    lastTouchY = t.clientY
  }
}

function onCanvasTouchMove(e) {
  if (touchLookId === null) return
  for (let i = 0; i < e.touches.length; i++) {
    const t = e.touches[i]
    if (t.identifier === touchLookId) {
      const dx = t.clientX - lastTouchX
      const dy = t.clientY - lastTouchY
      lastTouchX = t.clientX
      lastTouchY = t.clientY
      gameStore.rotateCamera(-dx * 0.008)
      smoothCam.pitch = Math.max(-0.35, Math.min(0.45, smoothCam.pitch - dy * 0.004))
      break
    }
  }
}

function onCanvasTouchEnd() {
  touchLookId = null
}

// Giro con ratón al arrastrar sobre el canvas en escritorio
let isMouseDragging = false
function onCanvasMouseDown(e) {
  if (e.button === 0) {
    isMouseDragging = true
    lastTouchX = e.clientX
    lastTouchY = e.clientY
  }
}

function onCanvasMouseMove(e) {
  if (!isMouseDragging) return
  const dx = e.clientX - lastTouchX
  const dy = e.clientY - lastTouchY
  lastTouchX = e.clientX
  lastTouchY = e.clientY
  gameStore.rotateCamera(-dx * 0.006)
  smoothCam.pitch = Math.max(-0.35, Math.min(0.45, smoothCam.pitch - dy * 0.003))
}

function onCanvasMouseUp() {
  isMouseDragging = false
}

const nearbyEnemySummary = computed(() => {
  const px = gameStore.playerGrid.x
  const pz = gameStore.playerGrid.z
  return activeEnemies
    .filter((e) => e.alive)
    .map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      dist: Math.round(Math.hypot(e.gridX - px, e.gridZ - pz)),
    }))
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)

  // Recarga pasiva lenta de energía (1 cuadrito cada 2.2 segundos)
  rechargeIntervalId = setInterval(() => {
    gameStore.rechargeEnergy(1)
  }, 2200)

  // Animación de frames .GIF (con NearestFilter) cada 220ms
  spriteAnimIntervalId = setInterval(() => {
    activeEnemies.forEach((e) => {
      if (e.alive) e.spriteCtrl.stepAnimation()
    })
    activeExplosions.forEach((ex) => ex.ctrl.stepAnimation())
  }, 220)

  if (!canvasRef.value) return

  try {
    // Resolución interna baja estilo PS1/Doom (320x200) escalada con image-rendering: pixelated
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(70, 320 / 200, 0.1, SHIP_CAMERA_FAR)
    camera.rotation.order = 'YXZ'

    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: false, // Desactivado para mantener bordes pixelados 32-bits puros
      powerPreference: 'high-performance',
    })
    renderer.setSize(320, 200, false)
    renderer.setPixelRatio(1)

    buildSpaceshipEnvironment()
    spawnInitialWave()
    syncDiscMeshesWithStore()

    lastFrameTime = performance.now()
    const animate = (now) => {
      animFrameId = requestAnimationFrame(animate)
      const dtMs = Math.min(100, now - lastFrameTime)
      lastFrameTime = now

      // Interpolación suave de posición y cámara (60fps en PC y Móvil)
      const targetX = gameStore.playerGrid.x * CELL_SIZE
      const targetZ = gameStore.playerGrid.z * CELL_SIZE
      const lerpFactor = Math.min(1, dtMs * 0.014)

      smoothCam.x += (targetX - smoothCam.x) * lerpFactor
      smoothCam.z += (targetZ - smoothCam.z) * lerpFactor
      smoothCam.yaw += (gameStore.playerGrid.yaw - smoothCam.yaw) * Math.min(1, dtMs * 0.018)

      camera.position.set(smoothCam.x, smoothCam.y, smoothCam.z)
      camera.rotation.y = smoothCam.yaw
      camera.rotation.x = smoothCam.pitch

      // Rotar discos holográficos 3D coleccionables
      discMeshesById.forEach((group) => {
        group.rotation.y += dtMs * 0.0025
        group.position.y = 0.65 + Math.sin(now * 0.004) * 0.12
      })

      // Parpadeo tenue del monitor de control de la nave en la niebla
      if (consoleLightRef) {
        consoleLightRef.intensity = 1.05 + Math.sin(now * 0.006) * 0.25
      }

      updateEnemiesAndSpatialAudio(dtMs)
      updateProjectilesAndExplosions(dtMs)

      renderer.render(scene, camera)
    }

    animFrameId = requestAnimationFrame(animate)
  } catch {
    // Fallback seguro para entornos de pruebas unitarias sin contexto WebGL
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (rechargeIntervalId) clearInterval(rechargeIntervalId)
  if (spriteAnimIntervalId) clearInterval(spriteAnimIntervalId)
  if (renderer) renderer.dispose()
})
</script>

<template>
  <section
    class="relative flex h-dvh w-screen shrink-0 snap-center flex-col justify-between overflow-hidden bg-[#050811] select-none"
  >
    <!-- Lienzo 3D (Baja resolución 320x200 con escalado pixelado PS1 / Doom 2.5D) -->
    <canvas
      ref="canvasRef"
      width="320"
      height="200"
      class="pixelated absolute inset-0 h-full w-full cursor-crosshair object-cover"
      @mousedown="onCanvasMouseDown"
      @mousemove="onCanvasMouseMove"
      @mouseup="onCanvasMouseUp"
      @mouseleave="onCanvasMouseUp"
      @touchstart.passive="onCanvasTouchStart"
      @touchmove.passive="onCanvasTouchMove"
      @touchend.passive="onCanvasTouchEnd"
    ></canvas>

    <!-- Efectos Visuales CRT Scanlines + Flash de Disparo / Daño / Gravedad -->
    <div class="crt-scanlines pointer-events-none absolute inset-0 opacity-40"></div>
    <div
      v-if="muzzleFlash"
      class="pointer-events-none absolute inset-0 bg-sky-400/20"
    ></div>
    <div
      v-if="damageFlash"
      class="pointer-events-none absolute inset-0 bg-rose-600/40"
    ></div>
    <div
      v-if="gravityWarning"
      class="pointer-events-none absolute inset-0 border-4 border-purple-500/70 shadow-[inset_0_0_50px_rgba(168,85,247,0.45)]"
    ></div>

    <!-- Retícula Central 32-bits -->
    <div
      class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div class="relative flex h-7 w-7 items-center justify-center">
        <div class="h-1.5 w-1.5 bg-sky-400 shadow-[0_0_6px_#38bdf8]"></div>
        <div class="absolute inset-0 border border-sky-400/50"></div>
      </div>
    </div>

    <!-- ================================================================== -->
    <!-- HUD SUPERIOR ESTILO 32-BITS (Salud: 2 Corazones, Energía: 5 Cuadritos) -->
    <!-- ================================================================== -->
    <header class="relative z-10 flex flex-wrap items-start justify-between gap-2 p-3 md:p-4">
      <!-- Estadísticas del Jugador: 2 Corazones + 5 Cuadritos de Energía -->
      <div class="retro-panel flex flex-col gap-2 px-3 py-2">
        <div class="flex items-center gap-4">
          <!-- Salud: 2 Corazones -->
          <div class="flex items-center gap-1.5" data-testid="hud-health">
            <span class="text-[11px] font-bold uppercase text-slate-300">SALUD:</span>
            <span
              v-for="idx in gameStore.maxHealth"
              :key="`heart-${idx}`"
              class="text-base leading-none transition-transform"
              :class="
                idx <= gameStore.health
                  ? 'text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                  : 'text-slate-700'
              "
            >
              ♥
            </span>
          </div>

          <!-- Arma y Energía: 5 Cuadritos (Recarga pasiva) -->
          <div class="flex items-center gap-1" data-testid="hud-energy">
            <span class="text-[11px] font-bold uppercase text-slate-300">ENERGÍA:</span>
            <div class="flex gap-1">
              <div
                v-for="sq in gameStore.maxEnergy"
                :key="`energy-${sq}`"
                class="h-3.5 w-3.5 border transition-colors"
                :class="
                  sq <= gameStore.energy
                    ? 'border-sky-200 bg-sky-400 shadow-[0_0_8px_#38bdf8]'
                    : 'border-slate-700 bg-slate-900'
                "
              ></div>
            </div>
            <span class="ml-1 text-[10px] font-bold text-sky-300">
              {{ gameStore.energy }}/{{ gameStore.maxEnergy }}
            </span>
          </div>
        </div>

        <!-- Telemetría de Bajas y Regla de Drop (Cada 2 bajas) -->
        <div class="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-1.5 text-[10px]">
          <span class="font-bold text-amber-300">
            BAJAS: {{ gameStore.kills }} (DROP CADA {{ KILLS_PER_DROP }})
          </span>
          <span class="text-emerald-300">
            DISCOS: {{ gameStore.collectedOfficialCount }}/{{ gameStore.totalCatalogDiscs }}
          </span>
          <span class="text-slate-400">
            POS: ({{ gameStore.playerGrid.x }}, {{ gameStore.playerGrid.z }})
          </span>
        </div>
      </div>

      <!-- Radar Acústico Espacial y Selector de Placeholders .GIF -->
      <div class="retro-panel flex flex-col items-end gap-1.5 px-3 py-2 text-right">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="border border-purple-400/70 bg-purple-950/70 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-200 hover:bg-purple-800"
            @click="togglePlaceholderStyle"
          >
            GIF SPRITES: {{ showVisualPlaceholders ? 'DISEÑO PLACEHOLDER 32-BIT' : 'EN BLANCO / TRANSPARENTE' }}
          </button>

          <button
            type="button"
            class="border px-2 py-0.5 text-[10px] font-bold uppercase"
            :class="
              gameStore.navMode
                ? 'border-amber-400 bg-amber-950 text-amber-200'
                : 'border-slate-600 bg-slate-900 text-slate-300'
            "
            @click="gameStore.navMode = !gameStore.navMode"
          >
            TECLAS A/D: {{ gameStore.navMode ? 'MENÚ CARRUSEL' : 'STRAFE JUEGO' }}
          </button>
        </div>

        <p class="max-w-xs truncate text-[10px] font-bold text-sky-300">
          {{ audioCueBanner }}
        </p>
        <p class="max-w-xs truncate text-[10px] text-amber-200">
          {{ gameStore.statusMessage }}
        </p>
      </div>
    </header>

    <!-- ================================================================== -->
    <!-- MODAL QTE: ATRAPADO POR ACECHADOR DE TECHO (MASH SPACEBAR)          -->
    <!-- ================================================================== -->
    <div
      v-if="gameStore.qteActive"
      class="relative z-20 mx-auto my-auto flex max-w-md flex-col items-center border-4 border-rose-500 bg-black/95 p-5 text-center shadow-[0_0_40px_rgba(244,63,94,0.8)]"
      data-testid="qte-modal"
    >
      <p class="animate-pulse text-sm font-black uppercase tracking-widest text-rose-400">
        ⚠️ ¡ATRAPADO POR ACECHADOR DE TECHO! ⚠️
      </p>
      <p class="mt-1 text-xs text-slate-200">
        Presiona rápidamente <kbd class="border border-white px-1.5 py-0.5">ESPACIO</kbd> o el botón inferior para liberarte y detonar su explosión:
      </p>

      <div class="mt-3 h-4 w-full border-2 border-rose-400 bg-rose-950 p-0.5">
        <div
          class="h-full bg-rose-400 transition-all duration-75"
          :style="{ width: `${(gameStore.qteProgress / gameStore.qteTarget) * 100}%` }"
        ></div>
      </div>
      <p class="mt-1 text-[11px] font-bold text-amber-300">
        PROGRESO QTE: {{ gameStore.qteProgress }} / {{ gameStore.qteTarget }}
      </p>

      <button
        type="button"
        class="mt-3 w-full border-2 border-amber-300 bg-rose-700 py-2.5 text-sm font-black uppercase text-white active:scale-95"
        @click="handleSpaceQTEAction"
      >
        ¡PULSAR RÁPIDO [BARRA ESPACIADORA]!
      </button>
    </div>

    <!-- Modal Game Over -->
    <div
      v-if="gameStore.isGameOver"
      class="relative z-20 mx-auto my-auto flex max-w-sm flex-col items-center border-4 border-rose-500 bg-black/95 p-6 text-center"
    >
      <h2 class="text-xl font-black uppercase text-rose-500">
        MISIÓN INTERRUMPIDA
      </h2>
      <p class="mt-1 text-xs text-slate-300">
        Tu traje espacial perdió sus 2 corazones de integridad.
      </p>
      <button
        type="button"
        class="mt-4 border-2 border-emerald-400 bg-emerald-950 px-5 py-2 text-xs font-black uppercase text-emerald-200 hover:bg-emerald-800"
        @click="gameStore.resetGame()"
      >
        REINICIAR SISTEMAS
      </button>
    </div>

    <!-- Botón de Recolección Directa cuando hay un Disco Holográfico en la escena -->
    <div
      v-if="gameStore.pendingDrops.length > 0 && !gameStore.qteActive"
      class="relative z-10 mx-auto my-auto flex flex-col items-center gap-2"
    >
      <button
        v-for="drop in gameStore.pendingDrops"
        :key="drop.id"
        type="button"
        class="animate-bounce border-2 bg-[#071022]/95 px-4 py-2 text-xs font-black uppercase shadow-[4px_4px_0px_#000]"
        :class="RARITY_CONFIG[drop.rarity]?.borderClass"
        data-testid="collect-disc-btn"
        @click="gameStore.collectDisc(drop)"
      >
        ◉ RECOGER DISCO HOLOGRÁFICO [{{ drop.category.toUpperCase() }} // {{ drop.rarity.toUpperCase() }}]
      </button>
    </div>

    <!-- ================================================================== -->
    <!-- CONTROLES TÁCTILES Y DE ESCRITORIO + MINI-PLAYER FLOTANTE          -->
    <!-- ================================================================== -->
    <footer class="relative z-10 flex flex-col gap-2.5 p-3 md:p-4">
      <!-- Mini-Player Flotante (aparece al recoger un disco) -->
      <MiniPlayer
        @toggle-play="gameStore.toggleAudioPlayback()"
        @open-player="emit('navigate-right')"
      />

      <!-- Controles Ergonómicos Híbridos (D-Pad Izquierdo + Acciones Derecha) -->
      <div class="flex items-end justify-between gap-2">
        <!-- D-Pad de Movimiento y Cámara (Eficiente en Móvil y PC) -->
        <div class="retro-panel grid grid-cols-3 gap-1 p-1.5">
          <button
            type="button"
            class="border border-slate-600 bg-slate-900 px-2.5 py-2 text-xs font-bold text-sky-300 active:bg-sky-900"
            title="Girar Cámara Izquierda (Q / Flecha Izq)"
            @click="handleRotateStep(Math.PI / 2)"
          >
            ↺ Q
          </button>
          <button
            type="button"
            class="border border-sky-500/60 bg-sky-950/80 px-2.5 py-2 text-xs font-black text-white active:bg-sky-700"
            title="Avanzar 1 Bloque (W / Flecha Arriba)"
            @click="handleMoveStep(1, 0)"
          >
            ▲ W
          </button>
          <button
            type="button"
            class="border border-slate-600 bg-slate-900 px-2.5 py-2 text-xs font-bold text-sky-300 active:bg-sky-900"
            title="Girar Cámara Derecha (E / Flecha Der)"
            @click="handleRotateStep(-Math.PI / 2)"
          >
            E ↻
          </button>

          <button
            type="button"
            class="border border-slate-600 bg-slate-900 px-2.5 py-2 text-xs font-bold text-slate-200 active:bg-slate-700"
            title="Paso Lateral Izquierdo (A)"
            @click="handleMoveStep(0, -1)"
          >
            ◄ A
          </button>
          <button
            type="button"
            class="border border-sky-500/60 bg-sky-950/80 px-2.5 py-2 text-xs font-black text-white active:bg-sky-700"
            title="Retroceder 1 Bloque (S / Flecha Abajo)"
            @click="handleMoveStep(-1, 0)"
          >
            ▼ S
          </button>
          <button
            type="button"
            class="border border-slate-600 bg-slate-900 px-2.5 py-2 text-xs font-bold text-slate-200 active:bg-slate-700"
            title="Paso Lateral Derecho (D)"
            @click="handleMoveStep(0, 1)"
          >
            D ►
          </button>
        </div>

        <!-- Resumen de Enemigos Detectados en la Niebla (Oculto en pantallas muy pequeñas) -->
        <div
          class="retro-panel hidden max-w-xs flex-col gap-1 px-3 py-2 text-[10px] md:flex"
        >
          <span class="font-bold uppercase text-slate-400">
            SENSORES DE AUDIO ESPACIAL ({{ nearbyEnemySummary.length }} ACTIVOS):
          </span>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="e in nearbyEnemySummary"
              :key="e.id"
              class="border border-slate-700 bg-black/70 px-1.5 py-0.5 text-slate-300"
            >
              {{ e.name }}: {{ e.dist }}m
            </span>
          </div>
        </div>

        <!-- Botones de Acción: Disparar (-1⚡) y Dash 2 Bloques Atrás (-3⚡) -->
        <div class="retro-panel flex flex-col gap-1.5 p-1.5 sm:flex-row">
          <button
            type="button"
            data-testid="btn-dash"
            :disabled="!gameStore.canDash"
            class="border-2 px-3 py-2.5 text-xs font-black uppercase tracking-wider transition-all"
            :class="
              gameStore.canDash
                ? 'border-purple-400 bg-purple-950 text-purple-200 hover:bg-purple-800 active:translate-y-0.5'
                : 'cursor-not-allowed border-slate-700 bg-slate-900 text-slate-600'
            "
            @click="handleDashAction"
          >
            ⚡ DASH -2 BLOQUES (-{{ DASH_COST }}⚡)
          </button>

          <button
            type="button"
            data-testid="btn-shoot"
            :disabled="!gameStore.canShoot"
            class="border-2 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider transition-all"
            :class="
              gameStore.canShoot
                ? 'border-sky-400 bg-sky-950 text-sky-200 hover:bg-sky-800 active:translate-y-0.5'
                : 'cursor-not-allowed border-slate-700 bg-slate-900 text-slate-600'
            "
            @click="handleShootAction"
          >
            🔥 DISPARAR (-{{ SHOOT_COST }}⚡)
          </button>
        </div>
      </div>
    </footer>
  </section>
</template>
