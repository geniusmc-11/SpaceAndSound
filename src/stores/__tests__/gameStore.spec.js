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
  NASA_CATEGORIES,
  rollDiscRarity,
} from '@/stores/useGameStore'
import { EnemyFactory } from '@/game/EnemyFactory'
import App from '@/App.vue'

describe('useGameStore - NASA Space Apps (The Earth Information Jukebox)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('inicializa con 2 corazones de salud, 5 cuadritos de energía y layout bloqueado', () => {
    const store = useGameStore()
    expect(store.health).toBe(MAX_HEALTH) // 2 corazones
    expect(store.energy).toBe(MAX_ENERGY) // 5 cuadritos
    expect(store.layoutUnlocked).toBe(false)
    expect(store.activeSection).toBe(1) // Sección central (Juego 3D)
  })

  it('consume 1 cuadrito de energía al disparar (Disparo = -1)', () => {
    const store = useGameStore()
    expect(store.energy).toBe(5)

    const shotOk = store.shoot()
    expect(shotOk).toBe(true)
    expect(store.energy).toBe(5 - SHOOT_COST) // 4
  })

  it('consume 3 cuadritos de energía al hacer Dash (Dash = -3) y retrocede 2 bloques instantáneamente', () => {
    const store = useGameStore()
    // Mirando hacia -Z en el origen (0, 0)
    expect(store.playerGrid.x).toBe(0)
    expect(store.playerGrid.z).toBe(0)
    expect(store.energy).toBe(5)

    const dashResult = store.dash()
    expect(dashResult).toBeTruthy()
    expect(dashResult.success).toBe(true)
    expect(dashResult.distanceMoved).toBe(DASH_DISTANCE) // 2 bloques
    expect(store.energy).toBe(5 - DASH_COST) // 2 cuadritos restantes
    expect(store.playerGrid.z).toBe(2) // 2 bloques hacia atrás (+Z)

    // Un segundo Dash inmediato debe fallar por tener solo 2 cuadritos (< 3)
    const secondDash = store.dash()
    expect(secondDash).toBe(false)
    expect(store.energy).toBe(2)
  })

  it('genera un Disco Holográfico NASA cada KILLS_PER_DROP (2) enemigos derrotados', () => {
    const store = useGameStore()
    expect(KILLS_PER_DROP).toBe(2)
    expect(store.pendingDrops.length).toBe(0)

    // Baja #1 -> No genera drop aún
    const drop1 = store.registerEnemyKill({ x: 0, z: -2 })
    expect(drop1).toBeNull()
    expect(store.kills).toBe(1)
    expect(store.pendingDrops.length).toBe(0)

    // Baja #2 -> Genera 1 Disco Holográfico 3D con categoría y rareza válidas
    const drop2 = store.registerEnemyKill({ x: 0, z: -2 })
    expect(drop2).not.toBeNull()
    expect(store.kills).toBe(2)
    expect(store.pendingDrops.length).toBe(1)
    expect(NASA_CATEGORIES).toContain(drop2.category)
    expect(['comun', 'raro', 'epico', 'legendario']).toContain(drop2.rarity)
  })

  it('respeta las probabilidades de rareza (50% comun, 30% raro, 15% epico, 5% legendario)', () => {
    expect(rollDiscRarity(0.1)).toBe('comun')
    expect(rollDiscRarity(0.49)).toBe('comun')
    expect(rollDiscRarity(0.5)).toBe('raro')
    expect(rollDiscRarity(0.79)).toBe('raro')
    expect(rollDiscRarity(0.8)).toBe('epico')
    expect(rollDiscRarity(0.94)).toBe('epico')
    expect(rollDiscRarity(0.95)).toBe('legendario')
    expect(rollDiscRarity(0.99)).toBe('legendario')
  })

  it('desbloquea el layout horizontal y activa el Mini-Player al recoger el primer disco', () => {
    const store = useGameStore()
    store.registerEnemyKill({ x: 0, z: -1 })
    const disc = store.registerEnemyKill({ x: 0, z: -1 })

    expect(store.layoutUnlocked).toBe(false)
    const collected = store.collectDisc(disc)

    expect(collected.id).toBe(disc.id)
    expect(store.layoutUnlocked).toBe(true)
    expect(store.collectedDiscs.length).toBe(1)
    expect(store.currentDisc.id).toBe(disc.id)
    expect(store.isPlayingAudio).toBe(true)
  })

  it('ejecuta eficientemente el movimiento de personaje, rotación de cámara y QTE del Acechador de Techo', () => {
    const store = useGameStore()

    // Avanzar 1 bloque hacia adelante (-Z)
    expect(store.movePlayer(1, 0)).toBe(true)
    expect(store.playerGrid.z).toBe(-1)

    // Rotar cámara 90 grados a la izquierda y avanzar
    store.rotateCamera(Math.PI / 2)
    expect(store.playerGrid.dirX).toBe(-1)
    expect(store.movePlayer(1, 0)).toBe(true)
    expect(store.playerGrid.x).toBe(-1)

    // QTE de barra espaciadora al ser atrapado por el Acechador de Techo
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

    // Derrotar 2 enemigos para generar el primer disco y recogerlo
    store.registerEnemyKill({ x: 0, z: 0 })
    const disc = store.registerEnemyKill({ x: 0, z: 0 })
    store.collectDisc(disc)
    await nextTick()
    await nextTick()

    expect(store.layoutUnlocked).toBe(true)
    expect(carousel.classes()).toContain('overflow-x-auto')
    expect(store.activeSection).toBe(1) // Se mantiene en la sección central (Juego 3D)
    expect(wrapper.find('[data-testid="edge-indicator-left"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="edge-indicator-right"]').exists()).toBe(true)
  })
})
