/**
 * Fábrica Extensible de Enemigos 2.5D (Billboards THREE.Sprite)
 * Implementa los 3 arquetipos principales guiados por audio espacial:
 * 1. 'stalker' (Acechador de Techo - Nivel Y=+2, trampa QTE barra espaciadora)
 * 2. 'shooter' (Francotirador Oculto - Disparo a distancia desde la niebla)
 * 3. 'gravity' (Anomalía Gravitatoria - Atracción de 1 bloque cada 1.5s a <= 3 bloques)
 *
 * Estructura abierta (Open/Closed Principle) preparada para registrar 2 variantes adicionales
 * y escalar a 5 subtipos de enemigos sin modificar el motor principal.
 */

import * as THREE from 'three'
import { createAnimatedGifSpriteMaterial, GIF_SPRITE_PATHS } from './GifSpriteLoader'

const SUBTYPE_REGISTRY = new Map([
  [
    'stalker',
    {
      type: 'stalker',
      name: 'Ceiling Stalker',
      gifPath: GIF_SPRITE_PATHS.stalker,
      defaultY: 2.0, // Moves 2 levels higher
      scale: 1.5,
      hp: 1,
      stepIntervalMs: 1300,
    },
  ],
  [
    'shooter',
    {
      type: 'shooter',
      name: 'Hidden Sniper',
      gifPath: GIF_SPRITE_PATHS.shooter,
      defaultY: 0.75,
      scale: 1.65,
      hp: 1,
      attackIntervalMs: 3200,
    },
  ],
  [
    'gravity',
    {
      type: 'gravity',
      name: 'Gravity Anomaly',
      gifPath: GIF_SPRITE_PATHS.gravity,
      defaultY: 0.85,
      scale: 1.75,
      hp: 1,
      pullRadiusBlocks: 3, // Pulls if within 3 blocks
      pullIntervalMs: 1500, // Pulls 1 block every 1.5 seconds
    },
  ],
  // Pre-registered variants 4 and 5 for immediate scalability to 5 subtypes
  [
    'crawler',
    {
      type: 'crawler',
      name: 'Duct Crawler (Variant 4)',
      gifPath: GIF_SPRITE_PATHS.crawler,
      defaultY: 0.35,
      scale: 1.2,
      hp: 1,
      stepIntervalMs: 950,
    },
  ],
  [
    'phaser',
    {
      type: 'phaser',
      name: 'Phase Wraith (Variant 5)',
      gifPath: GIF_SPRITE_PATHS.phaser,
      defaultY: 0.9,
      scale: 1.6,
      hp: 2,
      attackIntervalMs: 2600,
    },
  ],
])

let nextEnemyNumericId = 1

export const EnemyFactory = {
  /**
   * Permite registrar o sobrescribir subtipos (hasta 5 o más variantes)
   */
  registerSubtype(typeKey, config) {
    SUBTYPE_REGISTRY.set(typeKey, {
      ...config,
      type: typeKey,
      gifPath: config.gifPath || GIF_SPRITE_PATHS[typeKey] || GIF_SPRITE_PATHS.shooter,
    })
  },

  getRegisteredSubtypes() {
    return Array.from(SUBTYPE_REGISTRY.keys())
  },

  /**
   * Crea una entidad de enemigo 2.5D con su THREE.Sprite (Billboard) y controlador .GIF
   */
  createEnemy(type = 'shooter', gridX = 0, gridZ = -4, options = {}) {
    const blueprint = SUBTYPE_REGISTRY.get(type) || SUBTYPE_REGISTRY.get('shooter')
    const id = `enemy-${blueprint.type}-${nextEnemyNumericId++}`

    const spriteCtrl = createAnimatedGifSpriteMaterial(
      blueprint.type,
      blueprint.gifPath,
      { showVisualPlaceholder: options.showVisualPlaceholder !== false }
    )

    const sprite = new THREE.Sprite(spriteCtrl.material)
    const worldY = blueprint.defaultY
    sprite.position.set(gridX * 2, worldY, gridZ * 2)
    sprite.scale.set(blueprint.scale, blueprint.scale, 1)

    return {
      id,
      type: blueprint.type,
      name: blueprint.name,
      hp: blueprint.hp,
      alive: true,
      gridX,
      gridZ,
      worldY,
      sprite,
      spriteCtrl,
      // Temporizadores internos de IA
      timerMs: 0,
      pullAccumulatorMs: 0,
      qteTimerMs: 0,
      isTrappingPlayer: false,
      blueprint,
    }
  },
}
