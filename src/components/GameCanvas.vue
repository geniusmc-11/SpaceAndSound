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
import {
  useSpatialAudio,
  computeEnemyProximityIntensity,
} from '@/composables/useSpatialAudio'
import MiniPlayer from './MiniPlayer.vue'

const emit = defineEmits(['navigate-left', 'navigate-right'])
const gameStore = useGameStore()
const spatialAudio = useSpatialAudio()

const canvasRef = ref(null)
const showVisualPlaceholders = ref(true)
const muzzleFlash = ref(false)
const damageFlash = ref(false)
const gravityWarning = ref(false)
const isPointerLocked = ref(false)
const audioCueBanner = ref('LISTEN IN THE FOG: CEILING FOOTSTEPS AND DISTANT SHOTS')

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

function attachGravityAreaAura(enemy) {
  if (!scene || !enemy || enemy.type !== 'gravity') return
  const areaCtrl = createAnimatedGifSpriteMaterial(
    'gravityArea',
    GIF_SPRITE_PATHS.gravityArea,
    { showVisualPlaceholder: showVisualPlaceholders.value }
  )
  const areaMat = new THREE.MeshBasicMaterial({
    map: areaCtrl.texture,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  // Textura visible exactamente en un rango de 3x3 bloques (3 * CELL_SIZE = 6x6 unidades)
  const areaGeo = new THREE.PlaneGeometry(CELL_SIZE * 3, CELL_SIZE * 3)
  const areaMesh = new THREE.Mesh(areaGeo, areaMat)
  areaMesh.rotation.x = -Math.PI / 2
  areaMesh.position.set(enemy.gridX * CELL_SIZE, 0.03, enemy.gridZ * CELL_SIZE)
  scene.add(areaMesh)

  enemy.areaAura = {
    mesh: areaMesh,
    mat: areaMat,
    geo: areaGeo,
    ctrl: areaCtrl,
  }
}

/**
 * Genera una oleada balanceada con los 3 tipos de enemigos guiados por audio espacial
 */
function spawnInitialWave() {
  if (!scene) return
  activeEnemies.forEach((e) => {
    scene.remove(e.sprite)
    e.spriteCtrl.dispose()
    if (e.areaAura) {
      scene.remove(e.areaAura.mesh)
      e.areaAura.geo.dispose()
      e.areaAura.mat.dispose()
      e.areaAura.ctrl.dispose()
    }
  })
  activeEnemies.length = 0

  const initialSpawns = [
    { type: 'shooter', gx: 0, gz: -3 }, // Francotirador frente al jugador para prueba rápida
    { type: 'stalker', gx: -1, gz: -2 }, // Acechador de techo 2 niveles arriba
    { type: 'gravity', gx: 1, gz: -4 }, // Anomalía gravitatoria explosiva (rango 3x3)
    { type: 'shooter', gx: -2, gz: -5 },
    { type: 'stalker', gx: 2, gz: -3 },
  ]

  initialSpawns.forEach((cfg) => {
    const enemy = EnemyFactory.createEnemy(cfg.type, cfg.gx, cfg.gz, {
      showVisualPlaceholder: showVisualPlaceholders.value,
    })
    scene.add(enemy.sprite)
    attachGravityAreaAura(enemy)
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
  attachGravityAreaAura(enemy)
  activeEnemies.push(enemy)
}

/**
 * Crea un sprite animado temporal (.gif con NearestFilter) para explosiones, estelas o impactos de bala
 */
function spawnAnimatedEffectSprite(typeKey, worldPos, scaleSize = 1.6, ttlMs = 500) {
  if (!scene) return
  const ctrl = createAnimatedGifSpriteMaterial(
    typeKey,
    GIF_SPRITE_PATHS[typeKey] || GIF_SPRITE_PATHS.explosion,
    { showVisualPlaceholder: showVisualPlaceholders.value }
  )
  const sprite = new THREE.Sprite(ctrl.material)
  sprite.position.copy(worldPos)
  sprite.scale.set(scaleSize, scaleSize, 1)
  scene.add(sprite)

  activeExplosions.push({
    sprite,
    ctrl,
    ttlMs,
  })
}

/**
 * Dispara el GIF de explosión (explotionenemy.gif con NearestFilter) al derrotar a un enemigo
 */
function triggerDeathExplosionGif(worldPos) {
  if (!scene) return
  spatialAudio.playEnemyExplosion()
  spawnAnimatedEffectSprite('explosion', worldPos, 1.9, 580)
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
 * Dispara un proyectil lento con sprite bullet2.gif siguiendo exactamente la dirección de mira 3D.
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

  const bulletCtrl = createAnimatedGifSpriteMaterial('bullet', GIF_SPRITE_PATHS.bullet, {
    showVisualPlaceholder: showVisualPlaceholders.value,
  })
  const bulletMesh = new THREE.Sprite(bulletCtrl.material)
  bulletMesh.scale.set(0.55, 0.55, 1)
  bulletMesh.position.set(
    smoothCam.x + dirX * 0.45,
    smoothCam.y - 0.08 + dirY * 0.45,
    smoothCam.z + dirZ * 0.45
  )
  scene.add(bulletMesh)

  activePlayerBullets.push({
    mesh: bulletMesh,
    ctrl: bulletCtrl,
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
    if (enemy.areaAura) {
      scene.remove(enemy.areaAura.mesh)
      enemy.areaAura.geo.dispose()
      enemy.areaAura.mat.dispose()
      enemy.areaAura.ctrl.dispose()
    }
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

    // Sonido único por enemigo en rango 3x3 que se intensifica al acercarse
    const prox = computeEnemyProximityIntensity(
      { x: enemy.gridX, z: enemy.gridZ },
      { x: px, z: pz },
      3
    )
    if (prox.inRange) {
      enemy.proximityTimerMs = (enemy.proximityTimerMs || 0) + dtMs
      if (enemy.proximityTimerMs >= prox.intervalMs) {
        enemy.proximityTimerMs = 0
        spatialAudio.playEnemyProximityCue(
          enemy.type,
          { x: enemy.gridX * CELL_SIZE, y: enemy.worldY, z: enemy.gridZ * CELL_SIZE },
          { x: px * CELL_SIZE, y: 0.85, z: pz * CELL_SIZE },
          pyaw,
          prox.intensity
        )
      }
    } else {
      enemy.proximityTimerMs = 0
    }

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
          audioCueBanner.value = `🔊 CEILING FOOTSTEPS DETECTED ${Math.round(distBlocks)} BLOCKS ABOVE`
        }
      }

      // If you stand on the exact cell below it -> Traps you and triggers QTE
      if (enemy.gridX === px && enemy.gridZ === pz && !gameStore.qteActive) {
        enemy.isTrappingPlayer = true
        enemy.qteTimerMs = 0
        // Descends onto the player
        enemy.sprite.position.set(px * CELL_SIZE, 0.9, pz * CELL_SIZE)
        gameStore.startStalkerQTE(enemy.id, 6)
      }
    }

    // ------------------------------------------------------------------------
    // 2. HIDDEN SNIPER (Shooter in the dark)
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
          audioCueBanner.value = `🔊 SNIPER SHOT APPROACHING FROM (${enemy.gridX}, ${enemy.gridZ})!`

          // Crear proyectil luminoso acercándose desde la niebla usando bullet2.gif
          if (scene) {
            const projCtrl = createAnimatedGifSpriteMaterial('bullet', GIF_SPRITE_PATHS.bullet, {
              showVisualPlaceholder: showVisualPlaceholders.value,
            })
            projCtrl.material.color.setHex(0xfb7185)
            const projMesh = new THREE.Sprite(projCtrl.material)
            projMesh.scale.set(0.65, 0.65, 1)
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
              ctrl: projCtrl,
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
          // Estela visual explotionenemy.gif cuando colisionenemy te atrae hacia sí
          spawnAnimatedEffectSprite(
            'explosion',
            new THREE.Vector3(
              ((enemy.gridX + nextX) * 0.5) * CELL_SIZE,
              0.55,
              ((enemy.gridZ + nextZ) * 0.5) * CELL_SIZE
            ),
            1.25,
            520
          )
          spatialAudio.playGravityPullPulse(
            { x: enemy.gridX, y: 0.8, z: enemy.gridZ },
            { x: nextX, y: 0.8, z: nextZ },
            pyaw
          )
          audioCueBanner.value =
            '⚠️ GRAVITY FIELD: PULLED 1 BLOCK // USE DASH (-3⚡) TO ESCAPE!'

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
      // Al chocar con una pared o el punto de control, dispara bullet1.gif
      if (hitConsole || b.traveled < b.maxDist) {
        spawnAnimatedEffectSprite('bulletImpact', pos.clone(), 1.15, 380)
      }
      if (scene) scene.remove(b.mesh)
      b.ctrl?.dispose()
      activePlayerBullets.splice(i, 1)
      continue
    }

    const hitEnemy = findBulletHitEnemy(pos, activeEnemies)
    if (hitEnemy) {
      spawnAnimatedEffectSprite('bulletImpact', pos.clone(), 1.15, 340)
      if (scene) scene.remove(b.mesh)
      b.ctrl?.dispose()
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
      p.ctrl?.dispose()
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
        '🛰️ SHIP CONTROL STATION: TELEMETRY ACTIVE // RECHARGING ENERGY NEAR BRIDGE'
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

// Bloqueo del mouse (Pointer Lock) en el juego + giro de cámara sin arrastrar clic
let lastMouseX = null
let lastMouseY = null
let mouseEdgeTurnVelocity = 0

function lockPointerInGame() {
  if (
    gameStore.activeSection !== 1 ||
    gameStore.qteActive ||
    gameStore.isGameOver ||
    !canvasRef.value
  ) {
    return
  }
  try {
    if (document.pointerLockElement !== canvasRef.value) {
      canvasRef.value.requestPointerLock?.()
    }
  } catch {
    // Ignorar en entornos sin soporte PointerLock
  }
}

function releasePointerLock() {
  try {
    if (typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock?.()
    }
  } catch {
    // noop
  }
}

function onPointerLockChange() {
  isPointerLocked.value =
    typeof document !== 'undefined' && document.pointerLockElement === canvasRef.value
  if (isPointerLocked.value) {
    mouseEdgeTurnVelocity = 0
  }
}

function onCanvasMouseEnter(e) {
  lastMouseX = e.clientX
  lastMouseY = e.clientY
}

function onCanvasMouseMove(e) {
  if (gameStore.activeSection !== 1 || gameStore.qteActive || gameStore.isGameOver) return

  const locked =
    typeof document !== 'undefined' && document.pointerLockElement === canvasRef.value

  if (locked) {
    const dx = e.movementX || 0
    const dy = e.movementY || 0
    gameStore.rotateCamera(-dx * 0.0042)
    smoothCam.pitch = Math.max(-0.42, Math.min(0.48, smoothCam.pitch - dy * 0.0028))
    mouseEdgeTurnVelocity = 0
    return
  }

  if (lastMouseX === null || lastMouseY === null) {
    lastMouseX = e.clientX
    lastMouseY = e.clientY
    return
  }

  const dx = e.clientX - lastMouseX
  const dy = e.clientY - lastMouseY
  lastMouseX = e.clientX
  lastMouseY = e.clientY

  gameStore.rotateCamera(-dx * 0.0055)
  smoothCam.pitch = Math.max(-0.42, Math.min(0.48, smoothCam.pitch - dy * 0.0032))

  // Giro continuo suave si acercas el cursor al borde izquierdo/derecho de la pantalla
  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / Math.max(1, rect.width)
    if (relX < 0.08) {
      mouseEdgeTurnVelocity = 0.0018
    } else if (relX > 0.92) {
      mouseEdgeTurnVelocity = -0.0018
    } else {
      mouseEdgeTurnVelocity = 0
    }
  }
}

function onCanvasMouseLeave() {
  lastMouseX = null
  lastMouseY = null
  mouseEdgeTurnVelocity = 0
}

watch(
  () => [gameStore.qteActive, gameStore.isGameOver, gameStore.activeSection],
  ([qte, over, sec]) => {
    if (qte || over || sec !== 1) {
      releasePointerLock()
    }
  }
)

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
  document.addEventListener('pointerlockchange', onPointerLockChange)

  // Recarga pasiva lenta de energía (1 cuadrito cada 2.2 segundos)
  rechargeIntervalId = setInterval(() => {
    gameStore.rechargeEnergy(1)
  }, 2200)

  // Animación de frames .GIF (con NearestFilter) cada 220ms
  spriteAnimIntervalId = setInterval(() => {
    activeEnemies.forEach((e) => {
      if (e.alive) {
        e.spriteCtrl.stepAnimation()
        if (e.areaAura) e.areaAura.ctrl.stepAnimation()
      }
    })
    activeExplosions.forEach((ex) => ex.ctrl.stepAnimation())
    activePlayerBullets.forEach((b) => b.ctrl?.stepAnimation())
    activeProjectiles.forEach((p) => p.ctrl?.stepAnimation())
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

      // Giro continuo suave en los bordes con el cursor sin requerir clic
      if (mouseEdgeTurnVelocity !== 0 && gameStore.activeSection === 1) {
        gameStore.rotateCamera(mouseEdgeTurnVelocity * dtMs)
      }

      // Interpolación suave de posición y cámara (60fps en PC y Móvil)
      const targetX = gameStore.playerGrid.x * CELL_SIZE
      const targetZ = gameStore.playerGrid.z * CELL_SIZE
      const lerpFactor = Math.min(1, dtMs * 0.014)

      smoothCam.x += (targetX - smoothCam.x) * lerpFactor
      smoothCam.z += (targetZ - smoothCam.z) * lerpFactor
      smoothCam.yaw += (gameStore.playerGrid.yaw - smoothCam.yaw) * Math.min(1, dtMs * 0.026)

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
  document.removeEventListener('pointerlockchange', onPointerLockChange)
  releasePointerLock()
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (rechargeIntervalId) clearInterval(rechargeIntervalId)
  if (spriteAnimIntervalId) clearInterval(spriteAnimIntervalId)
  if (renderer) renderer.dispose()
})
</script>

<template>
  <section
    class="relative flex h-full w-full shrink-0 snap-center flex-col justify-between overflow-hidden bg-[#101820] text-[#E7D5AC] select-none"
  >
    <!-- 3D Canvas (Low resolution 320x200 with pixelated scaling PS1 / Doom 2.5D) -->
    <canvas
      ref="canvasRef"
      width="320"
      height="200"
      class="pixelated absolute inset-0 h-full w-full object-cover"
      :class="isPointerLocked ? 'cursor-none' : 'cursor-crosshair'"
      @click="lockPointerInGame"
      @mouseenter="onCanvasMouseEnter"
      @mousemove="onCanvasMouseMove"
      @mouseleave="onCanvasMouseLeave"
      @touchstart.passive="onCanvasTouchStart"
      @touchmove.passive="onCanvasTouchMove"
      @touchend.passive="onCanvasTouchEnd"
    ></canvas>

    <!-- Visual Effects: CRT Scanlines + Muzzle / Damage / Gravity Flash -->
    <div class="crt-scanlines pointer-events-none absolute inset-0 opacity-40"></div>
    <div
      v-if="muzzleFlash"
      class="pointer-events-none absolute inset-0 bg-[#D18C39]/25"
    ></div>
    <div
      v-if="damageFlash"
      class="pointer-events-none absolute inset-0 bg-rose-600/40"
    ></div>
    <div
      v-if="gravityWarning"
      class="pointer-events-none absolute inset-0 border-4 border-[#D18C39]/80 shadow-[inset_0_0_50px_rgba(209,140,57,0.45)]"
    ></div>

    <!-- Center 32-bit Crosshair Reticle (Fallout Pip-Boy Amber) -->
    <div
      class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div class="relative flex h-7 w-7 items-center justify-center">
        <div class="h-1.5 w-1.5 bg-[#D18C39] shadow-[0_0_6px_#D18C39]"></div>
        <div class="absolute inset-0 border border-[#E7D5AC]/60"></div>
      </div>
    </div>

    <!-- ================================================================== -->
    <!-- TOP 32-BIT HUD (Health: 2 Hearts, Energy: 5 Squares)               -->
    <!-- ================================================================== -->
    <header class="relative z-10 flex flex-wrap items-start justify-between gap-2 p-2.5 md:p-3.5">
      <!-- Player Stats: 2 Hearts + 5 Energy Squares -->
      <div class="retro-panel flex flex-col gap-1.5 px-3 py-2">
        <div class="flex items-center gap-4">
          <!-- Health: 2 Hearts -->
          <div class="flex items-center gap-1.5" data-testid="hud-health">
            <span class="text-[11px] font-bold uppercase text-[#E7D5AC]">HEALTH:</span>
            <span
              v-for="idx in gameStore.maxHealth"
              :key="`heart-${idx}`"
              class="text-base leading-none transition-transform"
              :class="
                idx <= gameStore.health
                  ? 'text-[#D18C39] drop-shadow-[0_0_6px_rgba(209,140,57,0.85)]'
                  : 'text-[#31515A]'
              "
            >
              ♥
            </span>
          </div>

          <!-- Weapon & Energy: 5 Squares (Passive recharge) -->
          <div class="flex items-center gap-1" data-testid="hud-energy">
            <span class="text-[11px] font-bold uppercase text-[#E7D5AC]">ENERGY:</span>
            <div class="flex gap-1">
              <div
                v-for="sq in gameStore.maxEnergy"
                :key="`energy-${sq}`"
                class="h-3.5 w-3.5 border transition-colors"
                :class="
                  sq <= gameStore.energy
                    ? 'border-[#E7D5AC] bg-[#D18C39] shadow-[0_0_8px_#D18C39]'
                    : 'border-[#31515A] bg-[#101820]'
                "
              ></div>
            </div>
            <span class="ml-1 text-[10px] font-bold text-[#D18C39]">
              {{ gameStore.energy }}/{{ gameStore.maxEnergy }}
            </span>
          </div>
        </div>

        <!-- Kill Telemetry & Drop Rule (Every 2 kills) -->
        <div class="flex flex-wrap items-center gap-3 border-t border-[#31515A] pt-1.5 text-[10px]">
          <span class="font-bold text-[#D18C39]">
            KILLS: {{ gameStore.kills }} (DROP EVERY {{ KILLS_PER_DROP }})
          </span>
          <span class="text-[#E7D5AC]">
            DISCS: {{ gameStore.collectedOfficialCount }}/{{ gameStore.totalCatalogDiscs }}
          </span>
          <span class="text-[#E7D5AC]/70">
            POS: ({{ gameStore.playerGrid.x }}, {{ gameStore.playerGrid.z }})
          </span>
        </div>
      </div>

      <!-- Spatial Acoustic Radar & .GIF Placeholder Selector -->
      <div class="retro-panel flex flex-col items-end gap-1.5 px-3 py-2 text-right">
        <div class="flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            class="border border-[#31515A] bg-[#101820] px-2 py-0.5 text-[10px] font-bold uppercase text-[#E7D5AC] hover:border-[#D18C39]"
            @click="togglePlaceholderStyle"
          >
            GIF SPRITES: {{ showVisualPlaceholders ? '32-BIT PLACEHOLDER ART' : 'BLANK / TRANSPARENT' }}
          </button>

          <button
            type="button"
            class="border px-2 py-0.5 text-[10px] font-bold uppercase"
            :class="
              isPointerLocked
                ? 'border-[#D18C39] bg-[#D18C39] text-[#101820]'
                : 'border-[#31515A] bg-[#101820] text-[#E7D5AC] hover:border-[#D18C39]'
            "
            @click="isPointerLocked ? releasePointerLock() : lockPointerInGame()"
          >
            {{ isPointerLocked ? '🔒 MOUSE LOCKED [ESC]' : '🖱️ LOCK MOUSE' }}
          </button>

          <button
            type="button"
            class="border px-2 py-0.5 text-[10px] font-bold uppercase"
            :class="
              gameStore.navMode
                ? 'border-[#D18C39] bg-[#D18C39] text-[#101820]'
                : 'border-[#31515A] bg-[#101820] text-[#E7D5AC]/80'
            "
            @click="gameStore.navMode = !gameStore.navMode"
          >
            {{ gameStore.navMode ? 'MENU [A/D]' : 'SECTIONS [1/G · 3/L]' }}
          </button>
        </div>

        <p class="max-w-xs truncate text-[10px] font-bold text-[#D18C39]">
          {{ audioCueBanner }}
        </p>
        <p class="max-w-xs truncate text-[10px] text-[#E7D5AC]">
          {{ gameStore.statusMessage }}
        </p>
      </div>
    </header>

    <!-- ================================================================== -->
    <!-- QTE MODAL: TRAPPED BY CEILING STALKER (MASH SPACEBAR)              -->
    <!-- ================================================================== -->
    <div
      v-if="gameStore.qteActive"
      class="relative z-20 mx-auto my-auto flex max-w-md flex-col items-center border-4 border-[#D18C39] bg-[#101820]/95 p-5 text-center shadow-[0_0_40px_rgba(209,140,57,0.8)]"
      data-testid="qte-modal"
    >
      <p class="animate-pulse text-sm font-black uppercase tracking-widest text-[#D18C39]">
        ⚠️ TRAPPED BY CEILING STALKER! ⚠️
      </p>
      <p class="mt-1 text-xs text-[#E7D5AC]">
        Rapidly press <kbd class="border border-[#E7D5AC] px-1.5 py-0.5">SPACE</kbd> or the button below to break free and detonate it:
      </p>

      <div class="mt-3 h-4 w-full border-2 border-[#31515A] bg-[#1D303B] p-0.5">
        <div
          class="h-full bg-[#D18C39] transition-all duration-75"
          :style="{ width: `${(gameStore.qteProgress / gameStore.qteTarget) * 100}%` }"
        ></div>
      </div>
      <p class="mt-1 text-[11px] font-bold text-[#D18C39]">
        QTE PROGRESS: {{ gameStore.qteProgress }} / {{ gameStore.qteTarget }}
      </p>

      <button
        type="button"
        class="mt-3 w-full border-2 border-[#31515A] bg-[#D18C39] py-2.5 text-sm font-black uppercase text-[#101820] active:scale-95"
        @click="handleSpaceQTEAction"
      >
        MASH [SPACEBAR] FAST!
      </button>
    </div>

    <!-- Game Over Modal -->
    <div
      v-if="gameStore.isGameOver"
      class="relative z-20 mx-auto my-auto flex max-w-sm flex-col items-center border-4 border-[#D18C39] bg-[#101820]/95 p-6 text-center"
    >
      <h2 class="text-xl font-black uppercase text-[#D18C39]">
        MISSION INTERRUPTED
      </h2>
      <p class="mt-1 text-xs text-[#E7D5AC]/80">
        Your space suit lost both integrity hearts.
      </p>
      <button
        type="button"
        class="mt-4 border-2 border-[#31515A] bg-[#D18C39] px-5 py-2 text-xs font-black uppercase text-[#101820] hover:brightness-110"
        @click="gameStore.resetGame()"
      >
        REBOOT SYSTEMS
      </button>
    </div>

    <!-- Direct Collect Button when a Holographic Disc is in the scene -->
    <div
      v-if="gameStore.pendingDrops.length > 0 && !gameStore.qteActive"
      class="relative z-10 mx-auto my-auto flex flex-col items-center gap-2"
    >
      <button
        v-for="drop in gameStore.pendingDrops"
        :key="drop.id"
        type="button"
        class="animate-bounce border-2 bg-[#1D303B]/95 px-4 py-2 text-xs font-black uppercase text-[#E7D5AC] shadow-[4px_4px_0px_#000]"
        :class="RARITY_CONFIG[drop.rarity]?.borderClass"
        data-testid="collect-disc-btn"
        @click="gameStore.collectDisc(drop)"
      >
        ◉ COLLECT HOLOGRAPHIC DISC [{{ drop.category.toUpperCase() }} // {{ (RARITY_CONFIG[drop.rarity]?.label || drop.rarity).toUpperCase() }}]
      </button>
    </div>

    <!-- ================================================================== -->
    <!-- TOUCH & DESKTOP CONTROLS + FLOATING MINI-PLAYER                    -->
    <!-- ================================================================== -->
    <footer class="relative z-10 flex flex-col gap-2 p-2.5 md:p-3.5">
      <!-- Floating Mini-Player (appears after collecting a disc) -->
      <MiniPlayer
        @toggle-play="gameStore.toggleAudioPlayback()"
        @open-player="emit('navigate-right')"
      />

      <!-- Hybrid Ergonomic Controls (Left D-Pad + Right Actions) -->
      <div class="flex items-end justify-between gap-2">
        <!-- Movement & Camera D-Pad (Efficient on Mobile and PC) -->
        <div class="retro-panel grid grid-cols-3 gap-1 p-1.5">
          <button
            type="button"
            class="border border-[#31515A] bg-[#101820] px-2.5 py-1.5 text-xs font-bold text-[#D18C39] active:bg-[#31515A]"
            title="Turn Camera Left (Q / Left Arrow)"
            @click="handleRotateStep(Math.PI / 2)"
          >
            ↺ Q
          </button>
          <button
            type="button"
            class="border border-[#D18C39]/70 bg-[#101820] px-2.5 py-1.5 text-xs font-black text-[#E7D5AC] active:bg-[#D18C39] active:text-[#101820]"
            title="Move Forward 1 Block (W / Up Arrow)"
            @click="handleMoveStep(1, 0)"
          >
            ▲ W
          </button>
          <button
            type="button"
            class="border border-[#31515A] bg-[#101820] px-2.5 py-1.5 text-xs font-bold text-[#D18C39] active:bg-[#31515A]"
            title="Turn Camera Right (E / Right Arrow)"
            @click="handleRotateStep(-Math.PI / 2)"
          >
            E ↻
          </button>

          <button
            type="button"
            class="border border-[#31515A] bg-[#101820] px-2.5 py-1.5 text-xs font-bold text-[#E7D5AC] active:bg-[#31515A]"
            title="Strafe Left (A)"
            @click="handleMoveStep(0, -1)"
          >
            ◄ A
          </button>
          <button
            type="button"
            class="border border-[#D18C39]/70 bg-[#101820] px-2.5 py-1.5 text-xs font-black text-[#E7D5AC] active:bg-[#D18C39] active:text-[#101820]"
            title="Move Backward 1 Block (S / Down Arrow)"
            @click="handleMoveStep(-1, 0)"
          >
            ▼ S
          </button>
          <button
            type="button"
            class="border border-[#31515A] bg-[#101820] px-2.5 py-1.5 text-xs font-bold text-[#E7D5AC] active:bg-[#31515A]"
            title="Strafe Right (D)"
            @click="handleMoveStep(0, 1)"
          >
            D ►
          </button>
        </div>

        <!-- Detected Enemies in Fog Summary (Hidden on very small screens) -->
        <div
          class="retro-panel hidden max-w-xs flex-col gap-1 px-3 py-2 text-[10px] md:flex"
        >
          <span class="font-bold uppercase text-[#D18C39]">
            SPATIAL AUDIO SENSORS ({{ nearbyEnemySummary.length }} ACTIVE):
          </span>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="e in nearbyEnemySummary"
              :key="e.id"
              class="border border-[#31515A] bg-[#101820] px-1.5 py-0.5 text-[#E7D5AC]"
            >
              {{ e.name }}: {{ e.dist }}m
            </span>
          </div>
        </div>

        <!-- Action Buttons: Shoot (-1⚡) & Dash 2 Blocks Back (-3⚡) -->
        <div class="retro-panel flex flex-col gap-1.5 p-1.5 sm:flex-row">
          <button
            type="button"
            data-testid="btn-dash"
            :disabled="!gameStore.canDash"
            class="border-2 px-3 py-2 text-xs font-black uppercase tracking-wider transition-all"
            :class="
              gameStore.canDash
                ? 'border-[#31515A] bg-[#101820] text-[#E7D5AC] hover:border-[#D18C39] active:translate-y-0.5'
                : 'cursor-not-allowed border-[#31515A]/40 bg-[#101820]/50 text-[#E7D5AC]/30'
            "
            @click="handleDashAction"
          >
            ⚡ DASH -2 BLOCKS (-{{ DASH_COST }}⚡)
          </button>

          <button
            type="button"
            data-testid="btn-shoot"
            :disabled="!gameStore.canShoot"
            class="border-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all"
            :class="
              gameStore.canShoot
                ? 'border-[#31515A] bg-[#D18C39] text-[#101820] hover:brightness-110 active:translate-y-0.5'
                : 'cursor-not-allowed border-[#31515A]/40 bg-[#101820]/50 text-[#E7D5AC]/30'
            "
            @click="handleShootAction"
          >
            🔥 SHOOT (-{{ SHOOT_COST }}⚡)
          </button>
        </div>
      </div>
    </footer>
  </section>
</template>
