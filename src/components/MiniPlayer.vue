<script setup>
import { ref, computed } from 'vue'
import { useGameStore, RARITY_CONFIG } from '@/stores/useGameStore'
import { useSonifier } from '@/composables/useSonifier'
import PixelDiscSprite from '@/components/PixelDiscSprite.vue'

const emit = defineEmits(['open-player', 'toggle-play'])
const gameStore = useGameStore()
const sonifier = useSonifier()

// Starts collapsed showing only the collected disc's name and logo (without auto-playing)
const isExpanded = ref(false)
const isExportingMp3 = ref(false)
const exportProgress = ref(0)
const exportError = ref('')

const disc = computed(() => gameStore.currentDisc)
const rarityMeta = computed(() => {
  if (!disc.value) return RARITY_CONFIG.comun
  return RARITY_CONFIG[disc.value.rarity] || RARITY_CONFIG.comun
})

async function downloadMp3() {
  if (!disc.value || isExportingMp3.value) return

  isExportingMp3.value = true
  exportProgress.value = 0
  exportError.value = ''
  try {
    const mp3 = await sonifier.exportDiscAsMp3(disc.value, (progress) => {
      exportProgress.value = progress
    })
    const url = URL.createObjectURL(mp3)
    const link = document.createElement('a')
    const filename = disc.value.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `nasa-svs-${disc.value.svsId || 'sonification'}`
    link.href = url
    link.download = `${filename}.mp3`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    exportError.value = error?.message || 'MP3 export failed.'
  } finally {
    isExportingMp3.value = false
  }
}
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

          <button
            type="button"
            :disabled="isExportingMp3"
            :aria-label="isExportingMp3 ? 'Generating MP3 sonification' : `Download ${disc.title} sonification as MP3`"
            :title="isExportingMp3 ? `Generating MP3: ${Math.round(exportProgress * 100)}%` : 'Download sonification as MP3'"
            class="inline-flex shrink-0 items-center gap-1 border border-[#31515A] bg-[#1D303B] px-1.5 py-1 text-[9px] font-bold text-[#D18C39] transition-colors hover:border-[#D18C39] hover:bg-[#D18C39]/15 disabled:cursor-wait disabled:opacity-60"
            @click.stop="downloadMp3"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
              <path d="M7 1h2v7l2.5-2.5L13 7l-5 5-5-5 1.5-1.5L7 8V1Z" />
              <path d="M2 13h12v2H2z" />
            </svg>
            {{ isExportingMp3 ? `${Math.round(exportProgress * 100)}%` : 'MP3' }}
          </button>
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
      <p v-if="exportError" role="alert" class="text-[10px] font-semibold text-red-300">
        {{ exportError }}
      </p>
    </div>
  </transition>
</template>
