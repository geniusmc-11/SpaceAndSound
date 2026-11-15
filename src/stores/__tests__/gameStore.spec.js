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
import { synthesizeNormalizedMapValue } from '@/composables/useSonifier'
import { EnemyFactory } from '@/game/EnemyFactory'
import App from '@/App.vue'

describe('useGameStore - NASA Space Apps (SVS #5153 + Opción B)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('inicializa con 2 corazones, 5 cuadritos de energía, layout bloqueado y únicamente NASA SVS #5153 en el catálogo', () => {
    const store = useGameStore()
    expect(store.health).toBe(MAX_HEALTH)
    expect(store.energy).toBe(MAX_ENERGY)
    expect(store.layoutUnlocked).toBe(false)
    expect(store.activeSection).toBe(1)
    expect(CURATED_NASA_DISCS).toHaveLength(1)
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

  it('despliega únicamente NASA SVS #5153 cada KILLS_PER_DROP (2) bajas y no genera discos aleatorios', () => {
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

    // Recoger SVS #5153
    store.collectDisc(drop2)

    // Bajas adicionales no deben autogenerar discos aleatorios
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
    expect(store.isPlayingAudio).toBe(true)
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
  })
})
