<script setup>
import { computed } from 'vue'
import { useGameStore, RARITY_CONFIG } from '@/stores/useGameStore'

const emit = defineEmits(['open-player', 'toggle-play'])
const gameStore = useGameStore()

const disc = computed(() => gameStore.currentDisc)
const rarityMeta = computed(() => {
  if (!disc.value) return RARITY_CONFIG.comun
  return RARITY_CONFIG[disc.value.rarity] || RARITY_CONFIG.comun
})
</script>

<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-8 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
  >
    <div
      v-if="disc"
      class="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between gap-2 border-2 bg-[#070d19]/95 px-3 py-2 shadow-[4px_4px_0px_#000]"
      :class="rarityMeta.borderClass"
    >
      <!-- Icono Disco Giratorio 32-bits + Metadato -->
      <div class="flex min-w-0 flex-1 items-center gap-2.5">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-bold"
          :class="[
            rarityMeta.badgeClass,
            gameStore.isPlayingAudio ? 'animate-spin' : '',
          ]"
          style="animation-duration: 4s"
        >
          ◉
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span
              class="border px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              :class="rarityMeta.badgeClass"
            >
              {{ rarityMeta.label }}
            </span>
            <span class="truncate text-[10px] uppercase text-sky-400">
              [{{ disc.category }}]
            </span>
          </div>
          <p class="truncate text-xs font-bold tracking-tight text-slate-100">
            {{ disc.title }}
          </p>
        </div>
      </div>

      <!-- Controles Play/Pause y Acceso Rápido al Reproductor NASA (Derecha) -->
      <div class="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          class="border-2 border-sky-400 bg-sky-950 px-2.5 py-1 text-xs font-bold text-sky-200 active:translate-y-0.5 hover:bg-sky-800"
          :title="gameStore.isPlayingAudio ? 'Pausar Sonificación' : 'Reproducir Sonificación'"
          @click="emit('toggle-play')"
        >
          {{ gameStore.isPlayingAudio ? '❚❚ PAUSA' : '▶ PLAY' }}
        </button>

        <button
          type="button"
          class="border-2 border-amber-400 bg-amber-950/90 px-2.5 py-1 text-xs font-bold text-amber-200 active:translate-y-0.5 hover:bg-amber-800"
          title="Ir al Reproductor NASA (Sección Derecha)"
          @click="emit('open-player')"
        >
          LAB ►
        </button>
      </div>
    </div>
  </transition>
</template>
