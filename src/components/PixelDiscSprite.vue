<script setup>
import { ref, onMounted, watch } from 'vue'
import { RARITY_CONFIG } from '@/stores/useGameStore'

const props = defineProps({
  rarity: {
    type: String,
    default: 'epico',
  },
  spinning: {
    type: Boolean,
    default: false,
  },
})

const discCanvasRef = ref(null)

/**
 * Dibuja un disco pixel-art de 32x32 píxeles estilo 32-bits / PS1
 * con borde brillante según la rareza, surcos de vinilo/CD y etiqueta central.
 */
function drawPixelDisc() {
  const canvas = discCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const size = 32
  const cx = 15.5
  const cy = 15.5
  const rarityMeta = RARITY_CONFIG[props.rarity] || RARITY_CONFIG.epico
  const accent = rarityMeta.hex

  ctx.clearRect(0, 0, size, size)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const r = Math.sqrt(dx * dx + dy * dy)

      if (r > 15.2) continue // Transparente fuera del círculo

      // Agujero central del disco (transparente)
      if (r < 2.1) continue

      // Aro interior blanco/metálico del centro
      if (r < 3.4) {
        ctx.fillStyle = '#e2e8f0'
      }
      // Etiqueta central con el color de rareza (estilo vinilo / lobby track)
      else if (r < 6.4) {
        ctx.fillStyle = accent
      }
      // Borde exterior de rareza / contorno oscuro pixelado
      else if (r > 14.0) {
        ctx.fillStyle = '#020617'
      } else if (r > 13.0) {
        ctx.fillStyle = accent
      }
      // Cuerpo del disco con surcos concéntricos y destello diagonal holográfico 32-bits
      else {
        const isDiagonalSheen = Math.abs(dx - dy) < 2.8 && dx * dy >= 0
        const isGroove = Math.floor(r) % 2 === 0
        if (isDiagonalSheen) {
          ctx.fillStyle = isGroove ? '#475569' : '#64748b'
        } else {
          ctx.fillStyle = isGroove ? '#0f172a' : '#1e293b'
        }
      }

      ctx.fillRect(x, y, 1, 1)
    }
  }
}

onMounted(drawPixelDisc)
watch(() => props.rarity, drawPixelDisc)
</script>

<template>
  <canvas
    ref="discCanvasRef"
    width="32"
    height="32"
    class="pixelated block h-full w-full drop-shadow-[3px_3px_0px_#000]"
    :class="spinning ? 'animate-spin' : ''"
    style="animation-duration: 6s"
  ></canvas>
</template>
