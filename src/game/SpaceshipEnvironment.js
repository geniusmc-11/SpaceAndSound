/**
 * Entorno de Nave Espacial 2.5D (Estilo PS1 / Doom 32-bits)
 * Contiene:
 * - Textura procedural pixelada de suelo de losas metálicas (NearestFilter)
 * - Punto de controles de la nave como objeto 3D sólido con pantallas CRT
 * - Ventanas espaciales ubicadas inteligentemente en el casco exterior
 * - Físicas y colisión precisa de proyectiles lentos (sin auto-hit global)
 * Lenguaje: JavaScript puro (ES6+)
 */

export const CONTROL_STATION_GRID = { x: 0, z: -6 }

export const PLAYER_BULLET_SPEED = 7.5 // Unidades/s (~3.75 bloques/s, visible en la niebla)
export const ENEMY_BULLET_SPEED = 4.2 // Unidades/s (~2.1 bloques/s, esquivable por audio)

export const SHIP_FOG_DENSITY = 0.29
export const SHIP_CAMERA_FAR = 18

/**
 * Posiciones inteligentes de ventanas en el casco:
 * - Evitan esquinas extremas y el centro tras la consola de control norte
 * - Se distribuyen simétricamente en muros Oeste, Este y mamparo Norte
 */
export function getIntelligentWindowSpecs(gridMinX, gridMaxX, gridMinZ, cellSize) {
  const specs = []
  const westX = (gridMinX - 0.59) * cellSize
  const eastX = (gridMaxX + 0.59) * cellSize
  const northZ = (gridMinZ - 0.59) * cellSize

  // Ventanales laterales simétricos a lo largo del pasillo (evitando esquinas)
  for (const gz of [-6, -2, 2]) {
    specs.push({
      id: `win-west-${gz}`,
      wall: 'west',
      x: westX,
      y: 1.42,
      z: gz * cellSize,
      rotY: Math.PI / 2,
    })
    specs.push({
      id: `win-east-${gz}`,
      wall: 'east',
      x: eastX,
      y: 1.42,
      z: gz * cellSize,
      rotY: -Math.PI / 2,
    })
  }

  // Ventanales frontales del puente flanqueando el punto de control (x = 0)
  for (const gx of [-2, 2]) {
    specs.push({
      id: `win-north-${gx}`,
      wall: 'north',
      x: gx * cellSize,
      y: 1.48,
      z: northZ,
      rotY: 0,
    })
  }

  return specs
}

export function isControlConsoleCell(gx, gz) {
  return gx === CONTROL_STATION_GRID.x && gz === CONTROL_STATION_GRID.z
}

/**
 * Verifica colisión precisa entre un proyectil del jugador y los enemigos vivos.
 * Evita que disparos desviados o horizontales maten enemigos fuera de la trayectoria 3D.
 */
export function findBulletHitEnemy(
  bulletPos,
  enemies,
  hitRadiusXZ = 0.58,
  hitRadiusY = 0.72
) {
  if (!bulletPos || !Array.isArray(enemies)) return null

  for (const enemy of enemies) {
    if (!enemy || !enemy.alive) continue
    const ex = enemy.sprite?.position?.x ?? (enemy.gridX || 0) * 2.0
    const ey = enemy.sprite?.position?.y ?? enemy.worldY ?? 0.8
    const ez = enemy.sprite?.position?.z ?? (enemy.gridZ || 0) * 2.0

    const distXZ = Math.hypot(bulletPos.x - ex, bulletPos.z - ez)
    const distY = Math.abs(bulletPos.y - ey)

    if (distXZ <= hitRadiusXZ && distY <= hitRadiusY) {
      return enemy
    }
  }
  return null
}

/**
 * Textura de suelo de losas metálicas tipo nave espacial (64x64 pixel-art)
 */
export function createSpaceshipFloorTileTexture(THREE) {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const ctx = c.getContext('2d')

  if (ctx) {
    // Fondo oscuro de juntas entre losas
    ctx.fillStyle = '#050811'
    ctx.fillRect(0, 0, 64, 64)

    // 4 cuadrantes de losas por bloque (30x30 px cada losa)
    const tiles = [
      [1, 1],
      [33, 1],
      [1, 33],
      [33, 33],
    ]

    tiles.forEach(([tx, ty], idx) => {
      // Cuerpo principal de la losa de acero espacial
      ctx.fillStyle = idx % 2 === 0 ? '#111c30' : '#0f182a'
      ctx.fillRect(tx, ty, 30, 30)

      // Bisel superior/izquierdo iluminado
      ctx.fillStyle = '#233554'
      ctx.fillRect(tx, ty, 30, 2)
      ctx.fillRect(tx, ty, 2, 30)

      // Bisel inferior/derecho en sombra
      ctx.fillStyle = '#080e1a'
      ctx.fillRect(tx, ty + 28, 30, 2)
      ctx.fillRect(tx + 28, ty, 2, 30)

      // Rejilla o panel interior hundido
      ctx.fillStyle = '#0b1322'
      ctx.fillRect(tx + 6, ty + 6, 18, 18)
      ctx.fillStyle = '#182842'
      for (let gy = ty + 8; gy < ty + 22; gy += 4) {
        ctx.fillRect(tx + 8, gy, 14, 1)
      }

      // Pernos en las esquinas de cada losa
      ctx.fillStyle = '#475569'
      ctx.fillRect(tx + 3, ty + 3, 2, 2)
      ctx.fillRect(tx + 25, ty + 3, 2, 2)
      ctx.fillRect(tx + 3, ty + 25, 2, 2)
      ctx.fillRect(tx + 25, ty + 25, 2, 2)
    })

    // Franja técnica cian sutil en unión central
    ctx.fillStyle = '#0e7490'
    ctx.fillRect(30, 12, 4, 8)
    ctx.fillRect(30, 44, 4, 8)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

/**
 * Textura pixel-art 64x32 para ventanales exteriores con campo estelar y planeta lejano
 */
export function createSpaceshipWindowTexture(THREE, seed = 0) {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 32
  const ctx = c.getContext('2d')

  if (ctx) {
    // Marco exterior blindado
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, 64, 32)
    ctx.fillStyle = '#334155'
    ctx.fillRect(1, 1, 62, 2)
    ctx.fillRect(1, 1, 2, 30)

    // Vidrio espacial profundo
    ctx.fillStyle = '#02040a'
    ctx.fillRect(4, 4, 56, 24)

    // Estrellas pixeladas determinísticas
    for (let i = 0; i < 18; i++) {
      const sx = 6 + ((i * 19 + seed * 7) % 52)
      const sy = 6 + ((i * 11 + seed * 5) % 20)
      ctx.fillStyle = i % 5 === 0 ? '#38bdf8' : i % 3 === 0 ? '#fde68a' : '#e2e8f0'
      ctx.fillRect(sx, sy, 1, 1)
    }

    // Horizonte planetario lejano en una esquina del cristal
    ctx.fillStyle = '#0c4a6e'
    ctx.fillRect(42, 19, 14, 7)
    ctx.fillStyle = '#38bdf8'
    ctx.fillRect(43, 18, 11, 2)

    // Montante metálico central de refuerzo
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(30, 3, 4, 26)
    ctx.fillStyle = '#475569'
    ctx.fillRect(31, 3, 1, 26)

    // Remaches del marco
    ctx.fillStyle = '#64748b'
    ctx.fillRect(2, 2, 2, 2)
    ctx.fillRect(60, 2, 2, 2)
    ctx.fillRect(2, 28, 2, 2)
    ctx.fillRect(60, 28, 2, 2)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  return tex
}

/**
 * Textura pixel-art CRT para los monitores del Punto de Control de la Nave
 */
export function createControlConsoleScreenTexture(THREE) {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 32
  const ctx = c.getContext('2d')

  if (ctx) {
    ctx.fillStyle = '#031218'
    ctx.fillRect(0, 0, 64, 32)
    ctx.strokeStyle = '#0ea5e9'
    ctx.strokeRect(1, 1, 62, 30)

    // Radar circular pixelado a la izquierda
    ctx.strokeStyle = '#10b981'
    ctx.strokeRect(5, 5, 22, 22)
    ctx.fillStyle = '#34d399'
    ctx.fillRect(15, 15, 2, 2)
    ctx.fillStyle = '#059669'
    ctx.fillRect(16, 7, 1, 8)
    ctx.fillStyle = '#facc15'
    ctx.fillRect(21, 11, 2, 2)

    // Barras de telemetría de nave / energía a la derecha
    const bars = [
      { y: 6, w: 22, color: '#38bdf8' },
      { y: 12, w: 16, color: '#22c55e' },
      { y: 18, w: 26, color: '#facc15' },
      { y: 24, w: 12, color: '#f43f5e' },
    ]
    bars.forEach((b) => {
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(32, b.y, 28, 3)
      ctx.fillStyle = b.color
      ctx.fillRect(32, b.y, b.w, 3)
    })
  }

  const tex = new THREE.CanvasTexture(c)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  return tex
}

/**
 * Construye el objeto 3D del Punto de Controles de la Nave en (0, -6)
 */
export function buildControlConsoleObject(THREE, cellSize = 2.0) {
  const group = new THREE.Group()
  group.position.set(
    CONTROL_STATION_GRID.x * cellSize,
    0,
    CONTROL_STATION_GRID.z * cellSize
  )

  const chassisMat = new THREE.MeshLambertMaterial({ color: 0x1e293b })
  const trimMat = new THREE.MeshLambertMaterial({ color: 0x334155 })
  const screenTex = createControlConsoleScreenTexture(THREE)
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex })

  // Pedestal base pesado
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.52, 0.9), chassisMat)
  base.position.set(0, 0.26, 0)
  group.add(base)

  // Tablero inclinado de mandos
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.16, 1.0), trimMat)
  desk.position.set(0, 0.58, 0.04)
  desk.rotation.x = 0.22
  group.add(desk)

  // Palancas / botones brillantes sobre el tablero
  const btnColors = [0x22d3ee, 0x22c55e, 0xfacc15, 0xf43f5e]
  btnColors.forEach((col, i) => {
    const btn = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, 0.12),
      new THREE.MeshBasicMaterial({ color: col })
    )
    btn.position.set(-0.45 + i * 0.3, 0.67, 0.22)
    group.add(btn)
  })

  // Marco superior de monitores dobles
  const monitorHousing = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.68, 0.22), chassisMat)
  monitorHousing.position.set(0, 0.98, -0.22)
  group.add(monitorHousing)

  // Pantalla CRT principal mirando al jugador (+Z)
  const mainScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.52), screenMat)
  mainScreen.position.set(0, 0.99, -0.1)
  group.add(mainScreen)

  // Luz tenue de terminal para localizarlo entre la niebla
  const consoleLight = new THREE.PointLight(0x22d3ee, 1.25, 5.2, 1.7)
  consoleLight.position.set(0, 1.25, 0.35)
  group.add(consoleLight)

  return {
    group,
    light: consoleLight,
  }
}

/**
 * Monta las ventanas inteligentes sobre el casco de la nave
 */
export function buildIntelligentWindows(THREE, scene, gridMinX, gridMaxX, gridMinZ, cellSize) {
  const specs = getIntelligentWindowSpecs(gridMinX, gridMaxX, gridMinZ, cellSize)
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x334155 })
  const created = []

  specs.forEach((spec, idx) => {
    const winGroup = new THREE.Group()
    winGroup.position.set(spec.x, spec.y, spec.z)
    winGroup.rotation.y = spec.rotY

    const tex = createSpaceshipWindowTexture(THREE, idx + 1)
    const paneMat = new THREE.MeshBasicMaterial({ map: tex })
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.05), paneMat)
    pane.position.set(0, 0, 0.02)
    winGroup.add(pane)

    // Marco superior e inferior en 3D
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.1, 0.12), frameMat)
    topBar.position.set(0, 0.56, 0.02)
    winGroup.add(topBar)

    const botBar = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.12, 0.14), frameMat)
    botBar.position.set(0, -0.56, 0.03)
    winGroup.add(botBar)

    scene.add(winGroup)
    created.push(winGroup)
  })

  return created
}
