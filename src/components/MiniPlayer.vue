<script setup>
import { ref, computed } from 'vue'
import { useGameStore, RARITY_CONFIG } from '@/stores/useGameStore'
import PixelDiscSprite from '@/components/PixelDiscSprite.vue'

const emit = defineEmits(['open-player', 'toggle-play'])
const gameStore = useGameStore()

// Starts collapsed showing only the collected disc's name and logo (without auto-playing)
const isExpanded = ref(false)

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
      data-testid="mini-player-pill"
      class="pointer-events-auto mx-auto flex w-fit max-w-md flex-col gap-1.5 border-2 bg-[#101820]/95 px-2.5 py-1.5 shadow-[4px_4px_0px_#000]"
      :class="rarityMeta.borderClass"
    >
      <!-- Collapsed default view: Disc Logo + Name -->
      <div
        class="flex cursor-pointer items-center justify-between gap-2.5"
        :title="isExpanded ? 'Collapse' : 'Show quick disc controls'"
        @click="isExpanded = !isExpanded"
      >
        <div class="flex min-w-0 items-center gap-2">
          <!-- Pixel-Art Disc Logo -->
          <div class="h-7 w-7 shrink-0">
            <PixelDiscSprite
              :rarity="disc.rarity"
              :spinning="gameStore.isPlayingAudio"
            />
          </div>

          <p
            data-testid="mini-player-title"
            class="max-w-[210px] truncate text-xs font-bold tracking-tight text-[#E7D5AC] sm:max-w-[270px]"
          >
            {{ disc.title }}
          </p>
        </div>

        <span
          class="shrink-0 border border-[#31515A] bg-[#1D303B] px-1.5 py-0.5 text-[10px] font-black text-[#E7D5AC]"
        >
          {{ isExpanded ? '▲' : '▼' }}
        </span>
      </div>

      <!-- Optional expanded controls (for mobile or direct access without keyboard) -->
      <div
        v-if="isExpanded"
        class="flex items-center justify-between gap-2 border-t border-[#31515A] pt-1.5"
      >
        <div class="flex items-center gap-1.5">
          <span
            class="border px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            :class="rarityMeta.badgeClass"
          >
            {{ rarityMeta.label }}
          </span>
          <span class="text-[10px] uppercase text-[#D18C39]">
            [{{ disc.category }}]
          </span>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            class="border-2 border-[#31515A] bg-[#1D303B] px-2 py-0.5 text-[11px] font-bold text-[#E7D5AC] hover:border-[#D18C39]"
            :title="gameStore.isPlayingAudio ? 'Pause Sonification' : 'Play Sonification'"
            @click.stop="emit('toggle-play')"
          >
            {{ gameStore.isPlayingAudio ? '❚❚ PAUSE' : '▶ PLAY' }}
          </button>

          <button
            type="button"
            class="border-2 border-[#D18C39] bg-[#D18C39] px-2 py-0.5 text-[11px] font-bold text-[#101820] hover:brightness-110"
            title="Go to LAB (Right Section)"
            @click.stop="emit('open-player')"
          >
            LAB ►
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>
