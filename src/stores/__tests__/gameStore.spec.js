import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import {
  useGameStore,
  KILLS_PER_DROP,
  MAX_HEALTH,
  MAX_ENERGY,
  SHOOT_COST,
  DASH_COST,
  DASH_DISTANCE,
  CURATED_NASA_DISCS,
  NASA_CATEGORIES,
} from '@/stores/useGameStore'
import { buildDiscRecord } from '@/game/MediaFrameConverter'
import {
  COLORBAR_PROFILES,
  rgbToHsl,
  mapRgbPixelToNormalizedValue,
} from '@/game/ColorbarMapper'
import {
  synthesizeNormalizedMapValue,
  synthesizeNasaColumn,
  synthesizePlanetarySamples,
  isBlackPixel,
  useSonifier,
} from '@/composables/useSonifier'
import { EnemyFactory } from '@/game/EnemyFactory'
import { GIF_SPRITE_PATHS } from '@/game/GifSpriteLoader'
import {
  ENEMY_SOUND_PROFILES,
  computeEnemyProximityIntensity,
} from '@/composables/useSpatialAudio'
import {
  PLAYER_BULLET_SPEED,
  ENEMY_BULLET_SPEED,
  SHIP_FOG_DENSITY,
  SHIP_CAMERA_FAR,
  isControlConsoleCell,
  findBulletHitEnemy,
  getIntelligentWindowSpecs,
} from '@/game/SpaceshipEnvironment'
import App from '@/App.vue'
import DiscVault from '@/components/DiscVault.vue'
import GameCanvas from '@/components/GameCanvas.vue'
import MiniPlayer from '@/components/MiniPlayer.vue'

describe('useGameStore - NASA Space Apps (20 Discos SVS + Opción B)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('inicializa con 2 corazones, 5 cuadritos de energía, layout bloqueado y 20 discos oficiales NASA SVS en el catálogo', () => {
    const store = useGameStore()
    expect(store.health).toBe(MAX_HEALTH)
    expect(store.energy).toBe(MAX_ENERGY)
    expect(store.layoutUnlocked).toBe(false)
    expect(store.activeSection).toBe(1)
    expect(CURATED_NASA_DISCS).toHaveLength(20)
    expect(store.totalCatalogDiscs).toBe(20)
    expect(store.collectedOfficialCount).toBe(0)
    expect(store.catalogDiscs[0].id).toBe('nasa-svs-5153')
    expect(store.catalogDiscs[0].frames).toHaveLength(16)
  })

  it('consume 1 cuadrito de energía al disparar (Disparo = -1)', () => {
    const store = useGameStore()
    expect(store.energy).toBe(5)

    const shotOk = store.shoot()
    expect(shotOk).toBe(true)
    expect(store.energy).toBe(5 - SHOOT_COST)
  })

  it('consume 3 cuadritos de energía al hacer Dash (Dash = -3) y retrocede 2 bloques instantáneamente', () => {
    const store = useGameStore()
    expect(store.playerGrid.x).toBe(0)
    expect(store.playerGrid.z).toBe(0)
    expect(store.energy).toBe(5)

    const dashResult = store.dash()
    expect(dashResult).toBeTruthy()
    expect(dashResult.success).toBe(true)
    expect(dashResult.distanceMoved).toBe(DASH_DISTANCE)
    expect(store.energy).toBe(5 - DASH_COST)
    expect(store.playerGrid.z).toBe(2)

    const secondDash = store.dash()
    expect(secondDash).toBe(false)
    expect(store.energy).toBe(2)
  })

  it('despliega secuencialmente los 20 discos NASA SVS cada KILLS_PER_DROP (2) bajas y se agota al recolectar todos', () => {
    const store = useGameStore()
    expect(KILLS_PER_DROP).toBe(2)
    expect(store.pendingDrops.length).toBe(0)

    const drop1 = store.registerEnemyKill({ x: 0, z: -2 })
    expect(drop1).toBeNull()
    expect(store.kills).toBe(1)

    const drop2 = store.registerEnemyKill({ x: 0, z: -2 })
    expect(drop2).not.toBeNull()
    expect(drop2.id).toBe('nasa-svs-5153')
    expect(drop2.mediaType).toBe('frames')
    expect(drop2.frames).toHaveLength(16)
    expect(store.pendingDrops.length).toBe(1)

    // Recoger SVS #5153 y verificar contador oficial
    store.collectDisc(drop2)
    expect(store.collectedOfficialCount).toBe(1)

    // Recolectar los 19 discos restantes del catálogo oficial
    for (let i = 1; i < 20; i++) {
      store.registerEnemyKill({ x: 0, z: -2 })
      const nextDrop = store.registerEnemyKill({ x: 0, z: -2 })
      expect(nextDrop).not.toBeNull()
      expect(nextDrop.id).toBe(CURATED_NASA_DISCS[i].id)
      store.collectDisc(nextDrop)
    }
    expect(store.collectedOfficialCount).toBe(20)

    // Bajas adicionales después de los 20 discos no deben autogenerar discos aleatorios
    store.registerEnemyKill({ x: 0, z: -2 })
    const dropAfterCatalogExhausted = store.registerEnemyKill({ x: 0, z: -2 })
    expect(dropAfterCatalogExhausted).toBeNull()
  })

  it('desbloquea el layout horizontal y activa el Mini-Player al recoger NASA SVS #5153', () => {
    const store = useGameStore()
    store.registerEnemyKill({ x: 0, z: -1 })
    const disc = store.registerEnemyKill({ x: 0, z: -1 })

    expect(store.layoutUnlocked).toBe(false)
    const collected = store.collectDisc(disc)

    expect(collected.id).toBe('nasa-svs-5153')
    expect(store.layoutUnlocked).toBe(true)
    expect(store.collectedDiscs.length).toBe(1)
    expect(store.currentDisc.id).toBe('nasa-svs-5153')
    // Al recoger el disco en el juego no se reproduce automáticamente
    expect(store.isPlayingAudio).toBe(false)
  })

  it('permite añadir manualmente discos de video convertidos (Opción B) e imágenes directas', () => {
    const store = useGameStore()

    const videoOptionBDisc = buildDiscRecord({
      title: 'Mi Video 30s NASA',
      category: 'huracan',
      rarity: 'raro',
      mediaType: 'frames',
      frames: ['data:image/jpeg;base64,f1', 'data:image/jpeg;base64,f2'],
      durationSec: 30,
      frameIntervalMs: 1875,
    })

    const directImageDisc = buildDiscRecord({
      title: 'Imagen Espectral Directa',
      category: 'espacial',
      rarity: 'epico',
      mediaType: 'image',
      imageUrl: 'data:image/jpeg;base64,img1',
    })

    store.addCustomDisc(videoOptionBDisc, true)
    store.addCustomDisc(directImageDisc, false)

    expect(store.layoutUnlocked).toBe(true)
    expect(store.collectedDiscs).toHaveLength(2)
    expect(videoOptionBDisc.mediaType).toBe('frames')
    expect(videoOptionBDisc.frames).toHaveLength(2)
    expect(directImageDisc.mediaType).toBe('image')
    expect(directImageDisc.frames).toHaveLength(1)
    expect(videoOptionBDisc.sonificationMode).toBe('nasa')
    expect(directImageDisc.sonificationMode).toBe('nasa')

    const graphicDisc = buildDiscRecord({
      title: 'Gráfica de referencia',
      category: 'grafica',
      mediaType: 'image',
      imageUrl: 'data:image/jpeg;base64,graphic',
    })
    expect(graphicDisc.sonificationMode).toBe('grafica')
  })

  it('ejecuta eficientemente el movimiento de personaje, rotación de cámara y QTE del Acechador de Techo', () => {
    const store = useGameStore()

    expect(store.movePlayer(1, 0)).toBe(true)
    expect(store.playerGrid.z).toBe(-1)

    store.rotateCamera(Math.PI / 2)
    expect(store.playerGrid.dirX).toBe(-1)
    expect(store.movePlayer(1, 0)).toBe(true)
    expect(store.playerGrid.x).toBe(-1)

    store.startStalkerQTE('enemy-stalker-1', 3)
    expect(store.qteActive).toBe(true)
    store.pressSpaceQTE()
    store.pressSpaceQTE()
    const finalPress = store.pressSpaceQTE({ x: -1, z: -1 })
    expect(finalPress.freed).toBe(true)
    expect(store.qteActive).toBe(false)
    expect(store.kills).toBe(1)
  })

  it('crea placeholders de enemigos con arquitectura .GIF y NearestFilter (extensible a 5 subtipos)', () => {
    const subtypes = EnemyFactory.getRegisteredSubtypes()
    expect(subtypes).toContain('stalker')
    expect(subtypes).toContain('shooter')
    expect(subtypes).toContain('gravity')
    expect(subtypes.length).toBeGreaterThanOrEqual(5)
  })

  it('App.vue mantiene ocultas las secciones laterales al inicio y las desbloquea con nextTick sin perder la vista central', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(App, {
      global: { plugins: [pinia] },
    })
    const store = useGameStore()

    const carousel = wrapper.get('[data-testid="main-carousel"]')
    expect(carousel.classes()).toContain('overflow-x-hidden')

    store.registerEnemyKill({ x: 0, z: 0 })
    const disc = store.registerEnemyKill({ x: 0, z: 0 })
    store.collectDisc(disc)
    await nextTick()
    await nextTick()

    expect(store.layoutUnlocked).toBe(true)
    expect(carousel.classes()).toContain('overflow-x-auto')
    expect(store.activeSection).toBe(1)
    expect(wrapper.find('[data-testid="edge-indicator-left"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="edge-indicator-right"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('desacopla mapas tipo "maps" mediante perfiles de colorbar HSL y pasa solo un flotante limpio [0.0..1.0]', () => {
    expect(NASA_CATEGORIES).toContain('maps')
    expect(COLORBAR_PROFILES['5147'].stops.length).toBeGreaterThanOrEqual(4)
    expect(COLORBAR_PROFILES['5151'].stops.length).toBeGreaterThanOrEqual(4)
    expect(COLORBAR_PROFILES['5153'].stops.length).toBeGreaterThanOrEqual(4)

    // Conversión RGB -> HSL
    const hslBlue = rgbToHsl(16, 40, 210)
    const hslRed = rgbToHsl(230, 24, 24)
    expect(hslBlue.h).toBeGreaterThan(200)
    expect(hslRed.h).toBeLessThan(15)

    // Cálculo continuo en escala [0.0 .. 1.0] para mapa '5147' (Temperatura)
    const coldNorm = mapRgbPixelToNormalizedValue(20, 60, 210, '5147')
    const hotNorm = mapRgbPixelToNormalizedValue(225, 25, 20, '5147')
    expect(coldNorm).toBeGreaterThanOrEqual(0)
    expect(coldNorm).toBeLessThan(0.35)
    expect(hotNorm).toBeGreaterThan(0.7)
    expect(hotNorm).toBeLessThanOrEqual(1)

    // Salida limpia al motor de síntesis (únicamente valor flotante 0.0 - 1.0)
    const lowSynth = synthesizeNormalizedMapValue(coldNorm, 'legendario')
    const highSynth = synthesizeNormalizedMapValue(hotNorm, 'legendario')
    expect(lowSynth.mode).toBe('maps')
    expect(lowSynth.normalizedValue).toBeCloseTo(coldNorm, 2)
    expect(highSynth.normalizedValue).toBeCloseTo(hotNorm, 2)
    expect(lowSynth.primaryNote).not.toBe(highSynth.primaryNote)

    // Verificar perfiles agregados para nuevos mapas SVS
    for (const id of ['5154', '5149', '5152', '5150', '5148', '4095', '2900']) {
      expect(COLORBAR_PROFILES[id].stops.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('cambia la síntesis a la escala pentatónica menor cuando se selecciona', () => {
    const sonifier = useSonifier()
    const samples = [
      { yNorm: 0.5, r: 128, g: 128, b: 128 },
      { yNorm: 0.5, r: 128, g: 128, b: 128 },
    ]

    sonifier.activeNoteType.value = 'current'
    const currentResult = synthesizeNasaColumn(samples, 'comun')
    sonifier.activeNoteType.value = 'pentatonic'
    const pentatonicResult = synthesizeNasaColumn(samples, 'comun')
    sonifier.activeNoteType.value = 'current'

    expect(currentResult.mode).toBe('nasa')
    expect(pentatonicResult.mode).toBe('nasa')
    expect(pentatonicResult.primaryNote).not.toBe(currentResult.primaryNote)
  })

  it('cambia la síntesis a la escala de guitarra cuando se selecciona', () => {
    const sonifier = useSonifier()
    const samples = [
      { yNorm: 0.5, r: 128, g: 128, b: 128 },
      { yNorm: 0.5, r: 128, g: 128, b: 128 },
    ]

    sonifier.activeNoteType.value = 'guitar'
    const guitarResult = synthesizeNasaColumn(samples, 'comun')
    sonifier.activeNoteType.value = 'current'

    expect(guitarResult.mode).toBe('nasa')
    expect([
      'E2',
      'G2',
      'A2',
      'Bb2',
      'B2',
      'D3',
      'E3',
      'G3',
      'A3',
      'Bb3',
      'B3',
      'D4',
      'E4',
      'G4',
      'A4',
      'Bb4',
      'B4',
      'D5',
      'E5',
    ])
      .toContain(guitarResult.primaryNote)
  })

  it('cambia la síntesis a la escala de campana cuando se selecciona', () => {
    const sonifier = useSonifier()
    const samples = [
      { yNorm: 0.5, r: 128, g: 128, b: 128 },
      { yNorm: 0.5, r: 128, g: 128, b: 128 },
    ]

    sonifier.activeNoteType.value = 'bell'
    const bellResult = synthesizeNasaColumn(samples, 'comun')
    sonifier.activeNoteType.value = 'current'

    expect(bellResult.mode).toBe('nasa')
    expect([
      'C4',
      'D4',
      'E4',
      'G4',
      'A4',
      'C5',
      'D5',
      'E5',
      'G5',
      'A5',
      'C6',
      'D6',
      'E6',
      'G6',
      'A6',
    ]).toContain(bellResult.primaryNote)
  })

  it('muestra el progreso total del catálogo (recolectados / 20) en DiscVault', () => {
    const store = useGameStore()
    store.collectDisc(CURATED_NASA_DISCS[0])

    const wrapper = mount(DiscVault)
    const badge = wrapper.find('[data-testid="vault-progress-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('DISCS: 1 / 20')
  })

  it('corrige la colisión de balas lentas para no matar al disparar a otro lado, bloquea el punto de control y coloca ventanas inteligentes', () => {
    expect(PLAYER_BULLET_SPEED).toBeLessThanOrEqual(8)
    expect(ENEMY_BULLET_SPEED).toBeLessThanOrEqual(5)
    expect(SHIP_FOG_DENSITY).toBeGreaterThanOrEqual(0.25)
    expect(SHIP_CAMERA_FAR).toBeLessThanOrEqual(20)

    const shooter = EnemyFactory.createEnemy('shooter', 0, -3)
    const stalker = EnemyFactory.createEnemy('stalker', -1, -2)

    // Bala disparada lejos de los enemigos no impacta ninguno
    expect(findBulletHitEnemy({ x: 3.5, y: 0.8, z: -4 }, [shooter, stalker])).toBeNull()
    // Bala horizontal a altura del pecho no mata al acechador en el techo (y = 2.0)
    expect(findBulletHitEnemy({ x: -2.0, y: 0.8, z: -4 }, [shooter, stalker])).toBeNull()
    // Bala directa sobre el francotirador sí impacta
    expect(findBulletHitEnemy({ x: 0, y: 0.75, z: -6 }, [shooter, stalker])).toBe(shooter)

    // Punto de control de la nave bloqueado como objeto sólido en (0, -6)
    expect(isControlConsoleCell(0, -6)).toBe(true)
    const store = useGameStore()
    store.setPlayerGridPosition(0, -5)
    const walkedIntoConsole = store.movePlayer(1, 0, (gx, gz) => !isControlConsoleCell(gx, gz))
    expect(walkedIntoConsole).toBe(false)

    // Ventanas colocadas inteligentemente en casco lateral y flanqueando el puente
    const windows = getIntelligentWindowSpecs(-4, 4, -8, 2.0)
    expect(windows.length).toBe(8)
    expect(windows.some((w) => w.wall === 'north' && w.x === 0)).toBe(false)
  })

  it('implementa tipo "planetario" silencioso en píxeles negros y genera 2 melodías (principal + theremin)', () => {
    expect(NASA_CATEGORIES).toContain('planetario')
    expect(isBlackPixel(0, 0, 0)).toBe(true)
    expect(isBlackPixel(8, 10, 12)).toBe(true)
    expect(isBlackPixel(180, 90, 40)).toBe(false)

    // Píxeles negros en modo planetario NO producen sonido ni theremin
    const blackResult = synthesizePlanetarySamples(
      [
        { yNorm: 0.2, r: 0, g: 0, b: 0 },
        { yNorm: 0.6, r: 5, g: 5, b: 8 },
      ],
      'comun'
    )
    expect(blackResult.mode).toBe('planetario')
    expect(blackResult.silent).toBe(true)
    expect(blackResult.primaryNote).toBe('SILENCE')
    expect(blackResult.thereminNote).toBeNull()

    // Píxeles planetarios iluminados generan Melodía 1 + Melodía 2 (bajo tipo Theremin)
    const litResult = synthesizePlanetarySamples(
      [
        { yNorm: 0.2, r: 0, g: 0, b: 0 },
        { yNorm: 0.75, r: 220, g: 120, b: 40 },
      ],
      'comun'
    )
    expect(litResult.mode).toBe('planetario')
    expect(litResult.silent).toBe(false)
    expect(litResult.primaryNote).not.toBe('SILENCE')
    expect(litResult.thereminNote).toBeTruthy()
  })

  it('sonifica medios no gráficos con luminancia NASA y conserva el modo gráfico', () => {
    const darkResult = synthesizeNasaColumn(
      [
        { yNorm: 0.2, r: 12, g: 12, b: 12 },
        { yNorm: 0.8, r: 20, g: 20, b: 20 },
      ],
      'comun'
    )
    const brightResult = synthesizeNasaColumn(
      [
        { yNorm: 0.2, r: 240, g: 120, b: 30 },
        { yNorm: 0.8, r: 230, g: 110, b: 25 },
      ],
      'comun'
    )

    expect(darkResult.mode).toBe('nasa')
    expect(brightResult.mode).toBe('nasa')
    expect(brightResult.normValue).toBeGreaterThan(darkResult.normValue)
    expect(brightResult.primaryNote).not.toBe(darkResult.primaryNote)
  })

  it('mapea los sprites GIF reales, mueve la cámara con el mouse sin clic y genera sonido único por enemigo en rango 3x3', async () => {
    expect(GIF_SPRITE_PATHS.gravity).toBe('/sprites/colisionenemy.gif')
    expect(GIF_SPRITE_PATHS.gravityArea).toBe('/sprites/AreaExplotionEnemy.gif')
    expect(GIF_SPRITE_PATHS.explosion).toBe('/sprites/explotionenemy.gif')
    expect(GIF_SPRITE_PATHS.bullet).toBe('/sprites/bullet2.gif')
    expect(GIF_SPRITE_PATHS.bulletImpact).toBe('/sprites/bullet1.gif')
    expect(GIF_SPRITE_PATHS.stalker).toBe('/sprites/nave.gif')
    expect(GIF_SPRITE_PATHS.shooter).toBe('/sprites/naveenemy.gif')

    // Perfiles acústicos distintos para cada enemigo principal
    expect(ENEMY_SOUND_PROFILES.stalker.baseFreq).not.toBe(ENEMY_SOUND_PROFILES.shooter.baseFreq)
    expect(ENEMY_SOUND_PROFILES.shooter.baseFreq).not.toBe(ENEMY_SOUND_PROFILES.gravity.baseFreq)

    // Rango 3x3: fuera de 3 bloques es silencioso, dentro se intensifica al acercarse
    const far = computeEnemyProximityIntensity({ x: 0, z: -5 }, { x: 0, z: 0 }, 3)
    const edge = computeEnemyProximityIntensity({ x: 0, z: -3 }, { x: 0, z: 0 }, 3)
    const near = computeEnemyProximityIntensity({ x: 0, z: -1 }, { x: 0, z: 0 }, 3)

    expect(far.inRange).toBe(false)
    expect(edge.inRange).toBe(true)
    expect(near.inRange).toBe(true)
    expect(near.intensity).toBeGreaterThan(edge.intensity)
    expect(near.intervalMs).toBeLessThan(edge.intervalMs)

    // Cámara sigue el mouse sin requerir clic (mousedown)
    const store = useGameStore()
    const wrapper = mount(GameCanvas)
    const canvas = wrapper.find('canvas')
    const initialYaw = store.playerGrid.yaw

    await canvas.trigger('mouseenter', { clientX: 200, clientY: 150 })
    await canvas.trigger('mousemove', { clientX: 260, clientY: 150 })
    expect(store.playerGrid.yaw).not.toBe(initialYaw)
  })

  it('muestra MiniPlayer colapsado con nombre y logo sin reproducir y permite cambiar con teclas o botones a Galería y LAB', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useGameStore()

    // Recoger disco -> no se reproduce, queda colapsado con título y logo
    store.collectDisc(CURATED_NASA_DISCS[0])
    expect(store.isPlayingAudio).toBe(false)

    const miniWrapper = mount(MiniPlayer, {
      global: { plugins: [pinia] },
    })
    expect(miniWrapper.find('[data-testid="mini-player-title"]').text()).toContain('5153')
    // Botones de reproducción ocultos mientras está colapsado
    expect(miniWrapper.text()).not.toContain('▶ PLAY')

    // En App.vue se conservan botones táctiles para celular y atajos de teclado (1/G Galería, 3/L LAB, 2 Juego)
    const appWrapper = mount(App, {
      global: { plugins: [pinia] },
    })
    await nextTick()

    const rightBtn = appWrapper.find('[data-testid="edge-indicator-right"]')
    const leftBtn = appWrapper.find('[data-testid="edge-indicator-left"]')
    expect(leftBtn.text()).toContain('GALLERY')
    expect(rightBtn.text()).toContain('LAB')
    expect(rightBtn.text()).not.toContain('NASA LAB')

    // Mock scrollTo en jsdom para verificar cambio de sección por teclas
    const carousel = appWrapper.find('[data-testid="main-carousel"]').element
    carousel.scrollTo = () => {}

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG' }))
    expect(store.activeSection).toBe(0)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL' }))
    expect(store.activeSection).toBe(2)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit2' }))
    expect(store.activeSection).toBe(1)

    appWrapper.unmount()
  })

  it('integra los 4 componentes en App.vue con la rocola Fallout (Deep Space Operations) después de IntroductionText, botón Try it out! e iluminación lateral en inglés', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const appWrapper = mount(App, {
      global: { plugins: [pinia] },
    })

    const html = appWrapper.html()
    // Verificar presencia y orden: Header -> IntroductionText -> Jukebox -> Conclusion -> Footer
    const introIdx = html.indexOf('NASA Space Apps Challenge')
    const jukeboxIdx = html.indexOf('data-testid="jukebox-cabinet"')
    const conclusionIdx = html.indexOf('Conclusion: Listening to the Invisible')
    const footerIdx = html.indexOf('All rights reserved.')

    expect(introIdx).toBeGreaterThan(-1)
    expect(jukeboxIdx).toBeGreaterThan(introIdx)
    expect(conclusionIdx).toBeGreaterThan(jukeboxIdx)
    expect(footerIdx).toBeGreaterThan(conclusionIdx)

    // Botones laterales izquierda y derecha que se iluminan al presionarlos
    const leftBtn = appWrapper.get('[data-testid="jukebox-btn-left"]')
    const rightBtn = appWrapper.get('[data-testid="jukebox-btn-right"]')
    expect(leftBtn.attributes('aria-pressed')).toBe('false')
    expect(rightBtn.attributes('aria-pressed')).toBe('false')

    await leftBtn.trigger('click')
    expect(leftBtn.attributes('aria-pressed')).toBe('true')

    await rightBtn.trigger('click')
    expect(rightBtn.attributes('aria-pressed')).toBe('true')

    // Botón central que enciende y apaga el juego con transición CRT
    const tryBtn = appWrapper.get('[data-testid="jukebox-try-it-out-btn"]')
    expect(tryBtn.text()).toContain('Try it out!')
    expect(tryBtn.attributes('aria-pressed')).toBe('false')
    expect(appWrapper.find('[data-testid="game-off-screen"]').exists()).toBe(true)

    await tryBtn.trigger('click')

    const jukeboxScreen = appWrapper.get('[data-testid="jukebox-screen"]')
    expect(jukeboxScreen.classes()).toContain('fixed')
    expect(tryBtn.attributes('aria-pressed')).toBe('true')
    expect(appWrapper.find('[data-testid="game-off-screen"]').exists()).toBe(false)
    expect(appWrapper.find('[data-testid="exit-fullscreen-btn"]').exists()).toBe(true)

    await tryBtn.trigger('click')
    expect(tryBtn.attributes('aria-pressed')).toBe('false')
    expect(appWrapper.find('[data-testid="section-game"]').exists()).toBe(false)

    appWrapper.unmount()
  })
})
