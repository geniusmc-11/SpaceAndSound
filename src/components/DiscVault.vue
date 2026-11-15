<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useGameStore, RARITY_CONFIG } from '@/stores/useGameStore'
import { renderDiscFrameToCanvas } from '@/game/NasaDatasetGenerator'
import { useSonifier } from '@/composables/useSonifier'
import MediaUploaderModal from '@/components/MediaUploaderModal.vue'
import PixelDiscSprite from '@/components/PixelDiscSprite.vue'

const emit = defineEmits(['navigate-to-player', 'navigate-to-game'])
const gameStore = useGameStore()
const sonifier = useSonifier()

const showUploader = ref(false)
const canvasRefs = new Map()

function setThumbnailCanvas(el, disc) {
  if (el && disc) {
    canvasRefs.set(disc.id, { el, disc })
    renderDiscFrameToCanvas(el, disc, 0)
  }
}

function redrawAllThumbnails() {
  canvasRefs.forEach(({ el, disc }) => {
    renderDiscFrameToCanvas(el, disc, 0)
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

function handleMediaAdded(disc) {
  showUploader.value = false
  if (disc) {
    gameStore.selectDiscForPlayer(disc)
    sonifier.start(disc)
    emit('navigate-to-player', disc)
  }
}

function getRarityMeta(rarity) {
  return RARITY_CONFIG[rarity] || RARITY_CONFIG.comun
}

function handleVaultLegendaryHover(event, disc) {
  if (!disc || disc.rarity !== 'legendario') return
  const target = event.currentTarget
  if (!target) return
  const rect = target.getBoundingClientRect()
  const normX = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)))
  const normY = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height)))
  sonifier.probeHoverPixel(normX, normY, disc)
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
            {{ gameStore.collectedDiscs.length }} PISTAS EN BÓVEDA
          </span>
        </div>
        <h1 class="mt-1 text-xl font-black uppercase tracking-wider text-slate-100 md:text-2xl">
          BÓVEDA DE DISCOS // LOBBY TRACKS 32-BIT
        </h1>
        <p class="text-xs text-slate-400">
          Selecciona un disco para reproducirlo en el Laboratorio NASA o añade tus propios videos (Opción B) e imágenes.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="open-media-uploader-btn"
          class="border-2 border-emerald-400 bg-emerald-950 px-3 py-1.5 text-xs font-black uppercase text-emerald-200 shadow-[3px_3px_0px_#000] hover:bg-emerald-800"
          @click="showUploader = true"
        >
          + AÑADIR VIDEO / IMAGEN
        </button>

        <button
          type="button"
          class="border-2 border-sky-400 bg-sky-950 px-3 py-1.5 text-xs font-bold uppercase text-sky-200 shadow-[3px_3px_0px_#000] hover:bg-sky-800"
          @click="emit('navigate-to-game')"
        >
          VOLVER AL JUEGO [D] ►
        </button>
      </div>
    </header>

    <!-- Estado vacío -->
    <div
      v-if="gameStore.collectedDiscs.length === 0"
      class="my-auto flex flex-col items-center justify-center border-2 border-dashed border-slate-700 p-10 text-center"
    >
      <p class="text-sm font-bold uppercase text-slate-300">
        AÚN NO HAY DISCOS EN LA BÓVEDA
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Derrota 2 enemigos en la nave para obtener NASA SVS #5153 o añade un video/imagen manualmente.
      </p>
    </div>

    <!-- Cuadrícula estilo "Lobby Tracks de Fortnite" (Funda Pixel Art + Disco Pixel Art sobresaliendo) -->
    <div
      v-else
      class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <article
        v-for="disc in gameStore.collectedDiscs"
        :key="disc.id"
        class="group relative flex cursor-pointer flex-col pr-14 transition-transform duration-200 hover:-translate-y-1"
        @click="handleSelectDisc(disc)"
      >
        <!-- Contenedor Funda + Disco Sobresaliente -->
        <div class="relative flex items-center">
          <!-- Disco Pixel Art 32x32 que sobresale por detrás a la derecha -->
          <div
            class="absolute right-0 z-0 h-36 w-36 translate-x-10 transition-transform duration-300 ease-out group-hover:translate-x-14 sm:h-40 sm:w-40"
            :class="
              gameStore.currentDisc?.id === disc.id ? 'translate-x-14' : ''
            "
          >
            <PixelDiscSprite
              :rarity="disc.rarity"
              :spinning="
                gameStore.currentDisc?.id === disc.id && gameStore.isPlayingAudio
              "
            />
          </div>

          <!-- Funda / Portada Cuadrada en Pixel Art (Baja resolución escalada con pixelated) -->
          <div
            class="relative z-10 aspect-square w-full overflow-hidden border-2 bg-[#060b18] shadow-[6px_6px_0px_#000]"
            :class="[
              getRarityMeta(disc.rarity).borderClass,
              gameStore.currentDisc?.id === disc.id ? 'ring-2 ring-white' : '',
            ]"
            @mousemove="handleVaultLegendaryHover($event, disc)"
          >
            <!-- Portada Pixel Art (canvas 64x64 escalado con image-rendering: pixelated) -->
            <canvas
              :ref="(el) => setThumbnailCanvas(el, disc)"
              width="64"
              height="64"
              class="pixelated h-full w-full object-cover"
            ></canvas>

            <!-- Scanlines retro sutiles sobre la portada -->
            <div class="crt-scanlines pointer-events-none absolute inset-0 opacity-25"></div>

            <!-- Etiqueta superior de Rareza + Tipo de Media -->
            <div class="absolute top-2 right-2 left-2 flex items-center justify-between gap-1">
              <span
                class="border px-1.5 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_#000]"
                :class="getRarityMeta(disc.rarity).badgeClass"
              >
                {{ getRarityMeta(disc.rarity).label }}
              </span>

              <span
                class="border border-amber-400/70 bg-black/85 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300"
              >
                {{
                  disc.frames && disc.frames.length > 1
                    ? `🎬 ${disc.frames.length}F`
                    : '🖼️ IMG'
                }}
              </span>
            </div>

            <!-- Banner inferior de la funda estilo Lobby Track -->
            <div
              class="absolute right-0 bottom-0 left-0 border-t-2 bg-[#040814]/92 px-2.5 py-2"
              :style="{ borderTopColor: getRarityMeta(disc.rarity).hex }"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="text-[9px] font-bold uppercase tracking-wider text-sky-400">
                  {{ disc.svsId ? `NASA SVS #${disc.svsId}` : 'PISTA DE DATOS' }}
                </span>
                <span
                  v-if="gameStore.currentDisc?.id === disc.id && gameStore.isPlayingAudio"
                  class="animate-pulse text-[9px] font-black text-emerald-400"
                >
                  ▶ SONANDO
                </span>
              </div>
              <h2 class="mt-0.5 truncate text-xs font-black uppercase text-white group-hover:text-sky-300">
                {{ disc.title }}
              </h2>
              <p class="truncate text-[10px] text-slate-400">
                {{ disc.instrument }}
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- Modal Importador Video (Opción B) / Imagen Directa -->
    <MediaUploaderModal
      v-if="showUploader"
      @close="showUploader = false"
      @added="handleMediaAdded"
    />
  </section>
</template>
