<script setup>
import { watch, nextTick, onMounted } from 'vue'
import { useGameStore, RARITY_CONFIG } from '@/stores/useGameStore'
import { renderNasaDatasetToCanvas } from '@/game/NasaDatasetGenerator'
import { useSonifier } from '@/composables/useSonifier'

const emit = defineEmits(['navigate-to-player', 'navigate-to-game'])
const gameStore = useGameStore()
const sonifier = useSonifier()

// Mapa de referencias a los <canvas> miniatura de cada tarjeta
const canvasRefs = new Map()

function setThumbnailCanvas(el, disc) {
  if (el && disc) {
    canvasRefs.set(disc.id, { el, disc })
    renderNasaDatasetToCanvas(el, disc)
  }
}

function redrawAllThumbnails() {
  canvasRefs.forEach(({ el, disc }) => {
    renderNasaDatasetToCanvas(el, disc)
  })
}

watch(
  () => gameStore.collectedDiscs.length,
  async () => {
    await nextTick()
    redrawAllThumbnails()
  }
)

onMounted(() => {
  redrawAllThumbnails()
})

function handleSelectDisc(disc) {
  gameStore.selectDiscForPlayer(disc)
  sonifier.start(disc)
  emit('navigate-to-player', disc)
}

function getRarityMeta(rarity) {
  return RARITY_CONFIG[rarity] || RARITY_CONFIG.comun
}
</script>

<template>
  <section
    class="relative flex h-dvh w-screen shrink-0 snap-center flex-col overflow-y-auto bg-[#050914] p-4 md:p-8"
  >
    <!-- Encabezado de la Bóveda -->
    <header
      class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-sky-500/50 pb-4"
    >
      <div>
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-400">
          <span>[SECCIÓN IZQUIERDA // ARCHIVO ORBITAL]</span>
          <span class="border border-sky-500/40 bg-sky-950/60 px-2 py-0.5 text-[10px]">
            {{ gameStore.collectedDiscs.length }} DISCOS EN BÓVEDA
          </span>
        </div>
        <h1 class="mt-1 text-xl font-black uppercase tracking-wider text-slate-100 md:text-2xl">
          BÓVEDA DE DISCOS HOLOGRÁFICOS NASA
        </h1>
        <p class="text-xs text-slate-400">
          Haz clic en cualquier disco para cargarlo en el Motor de Sonificación y abrir el Reproductor NASA (Sección Derecha ►).
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="border-2 border-sky-400 bg-sky-950 px-3 py-1.5 text-xs font-bold uppercase text-sky-200 shadow-[3px_3px_0px_#000] hover:bg-sky-800"
          @click="emit('navigate-to-game')"
        >
          VOLVER AL JUEGO [D] ►
        </button>
      </div>
    </header>

    <!-- Estado vacío (por si se inspecciona antes) -->
    <div
      v-if="gameStore.collectedDiscs.length === 0"
      class="my-auto flex flex-col items-center justify-center border-2 border-dashed border-slate-700 p-10 text-center"
    >
      <p class="text-sm font-bold uppercase text-slate-300">
        AÚN NO HAY DISCOS EN LA BÓVEDA
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Derrota {{ 2 }} enemigos en la nave para generar un Disco Holográfico 3D.
      </p>
    </div>

    <!-- Cuadrícula (Grid en Tailwind) con los discos recolectados -->
    <div
      v-else
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <article
        v-for="disc in gameStore.collectedDiscs"
        :key="disc.id"
        class="group cursor-pointer border-2 bg-[#091122] p-3 transition-transform duration-150 hover:-translate-y-1"
        :class="[
          getRarityMeta(disc.rarity).borderClass,
          gameStore.currentDisc?.id === disc.id ? 'ring-2 ring-white' : '',
        ]"
        @click="handleSelectDisc(disc)"
      >
        <!-- Miniatura Procedural de la NASA en Canvas (32-bit Pixelated) -->
        <div class="relative mb-3 overflow-hidden border border-slate-700 bg-black">
          <canvas
            :ref="(el) => setThumbnailCanvas(el, disc)"
            width="160"
            height="84"
            class="pixelated h-28 w-full object-cover"
          ></canvas>

          <div
            class="absolute top-1.5 left-1.5 border px-1.5 py-0.5 text-[10px] font-bold uppercase"
            :class="getRarityMeta(disc.rarity).badgeClass"
          >
            {{ getRarityMeta(disc.rarity).label }}
          </div>

          <div
            class="absolute top-1.5 right-1.5 border border-sky-400/50 bg-[#050811]/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-300"
          >
            {{ disc.category }}
          </div>
        </div>

        <!-- Metadatos del Disco -->
        <h2 class="truncate text-sm font-bold text-slate-100 group-hover:text-sky-300">
          {{ disc.title }}
        </h2>
        <p class="mt-0.5 truncate text-[11px] text-slate-400">
          {{ disc.instrument }} • {{ disc.date }}
        </p>
        <p class="mt-1.5 line-clamp-2 text-[10px] text-slate-400">
          {{ getRarityMeta(disc.rarity).description }}
        </p>

        <div class="mt-3 flex items-center justify-between border-t border-slate-800 pt-2">
          <span class="text-[10px] font-bold uppercase text-amber-300">
            ▶ SONIFICAR DATOS
          </span>
          <span class="text-[10px] text-slate-500">
            SEED #{{ disc.seed }}
          </span>
        </div>
      </article>
    </div>
  </section>
</template>
