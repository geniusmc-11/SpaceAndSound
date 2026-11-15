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
    class="relative flex h-full w-full shrink-0 snap-center flex-col overflow-y-auto bg-[#101820] p-4 text-[#E7D5AC] md:p-6"
  >
    <!-- Vault Header -->
    <header
      class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#31515A] pb-4"
    >
      <div>
        <div class="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D18C39]">
          <span>[LEFT SECTION // ORBITAL GALLERY]</span>
          <span
            data-testid="vault-progress-badge"
            class="border border-[#D18C39] bg-[#1D303B] px-2 py-0.5 text-[11px] font-black text-[#E7D5AC]"
          >
            DISCS: {{ gameStore.collectedOfficialCount }} / {{ gameStore.totalCatalogDiscs }}
          </span>
          <span
            v-if="gameStore.customDiscCount > 0"
            class="border border-[#31515A] bg-[#1D303B] px-2 py-0.5 text-[10px] text-[#D18C39]"
          >
            + {{ gameStore.customDiscCount }} EXTRA
          </span>
        </div>
        <h1 class="mt-1 text-xl font-black uppercase tracking-wider text-[#E7D5AC] md:text-2xl">
          DISC GALLERY // 32-BIT LOBBY TRACKS
        </h1>
        <!-- Total collection progress bar -->
        <div class="mt-1.5 flex items-center gap-3">
          <div class="h-2.5 w-48 border border-[#31515A] bg-[#1D303B] p-0.5">
            <div
              class="h-full bg-[#D18C39] transition-all duration-300"
              :style="{
                width: `${
                  gameStore.totalCatalogDiscs > 0
                    ? Math.round((gameStore.collectedOfficialCount / gameStore.totalCatalogDiscs) * 100)
                    : 0
                }%`,
              }"
            ></div>
          </div>
          <span class="text-[11px] font-bold text-[#E7D5AC]/80">
            {{ gameStore.collectedDiscs.length }} TRACKS UNLOCKED OF {{ gameStore.totalCatalogDiscs }} TOTAL
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="open-media-uploader-btn"
          class="border-2 border-[#D18C39] bg-[#1D303B] px-3 py-1.5 text-xs font-black uppercase text-[#E7D5AC] shadow-[3px_3px_0px_#000] hover:bg-[#D18C39] hover:text-[#101820]"
          @click="showUploader = true"
        >
          + ADD VIDEO / IMAGE
        </button>

        <button
          type="button"
          class="border-2 border-[#31515A] bg-[#D18C39] px-3 py-1.5 text-xs font-bold uppercase text-[#101820] shadow-[3px_3px_0px_#000] hover:brightness-110"
          @click="emit('navigate-to-game')"
        >
          BACK TO GAME [2/D] ►
        </button>
      </div>
    </header>

    <!-- Empty state -->
    <div
      v-if="gameStore.collectedDiscs.length === 0"
      class="my-auto flex flex-col items-center justify-center border-2 border-dashed border-[#31515A] bg-[#1D303B]/40 p-10 text-center"
    >
      <p class="text-sm font-bold uppercase text-[#E7D5AC]">
        NO DISCS IN THE VAULT YET
      </p>
      <p class="mt-1 text-xs text-[#E7D5AC]/70">
        Defeat 2 enemies on the ship to obtain NASA SVS #5153 or add a video/image manually.
      </p>
    </div>

    <!-- Fortnite Lobby Tracks style grid (Pixel Art Sleeve + Large Protruding Pixel Art Disc) -->
    <div
      v-else
      class="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <article
        v-for="disc in gameStore.collectedDiscs"
        :key="disc.id"
        class="group relative flex cursor-pointer flex-col pr-20 transition-transform duration-200 hover:-translate-y-1 sm:pr-24"
        @click="handleSelectDisc(disc)"
      >
        <!-- Sleeve + Protruding Disc Container -->
        <div class="relative flex items-center">
          <!-- 32x32 Pixel Art Disc protruding on the right -->
          <div
            class="absolute right-0 z-0 h-44 w-44 translate-x-14 transition-transform duration-300 ease-out group-hover:translate-x-20 sm:h-52 sm:w-52"
            :class="
              gameStore.currentDisc?.id === disc.id ? 'translate-x-20' : ''
            "
          >
            <PixelDiscSprite
              :rarity="disc.rarity"
              :spinning="
                gameStore.currentDisc?.id === disc.id && gameStore.isPlayingAudio
              "
            />
          </div>

          <!-- Square Pixel Art Cover Sleeve -->
          <div
            class="relative z-10 aspect-square w-full overflow-hidden border-2 bg-[#1D303B] shadow-[6px_6px_0px_#000]"
            :class="[
              getRarityMeta(disc.rarity).borderClass,
              gameStore.currentDisc?.id === disc.id ? 'ring-2 ring-[#E7D5AC]' : '',
            ]"
            @mousemove="handleVaultLegendaryHover($event, disc)"
          >
            <!-- Pixel Art Cover (64x64 canvas scaled with image-rendering: pixelated) -->
            <canvas
              :ref="(el) => setThumbnailCanvas(el, disc)"
              width="64"
              height="64"
              class="pixelated h-full w-full object-cover"
            ></canvas>

            <!-- Subtle retro scanlines over cover -->
            <div class="crt-scanlines pointer-events-none absolute inset-0 opacity-25"></div>

            <!-- Top badge: Rarity + Media Type -->
            <div class="absolute top-2 right-2 left-2 flex items-center justify-between gap-1">
              <span
                class="border px-1.5 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_#000]"
                :class="getRarityMeta(disc.rarity).badgeClass"
              >
                {{ getRarityMeta(disc.rarity).label }}
              </span>

              <span
                class="border border-[#D18C39]/80 bg-[#101820]/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#E7D5AC]"
              >
                {{
                  disc.frames && disc.frames.length > 1
                    ? `🎬 ${disc.frames.length}F`
                    : '🖼️ IMG'
                }}
              </span>
            </div>

            <!-- Bottom Lobby Track sleeve banner -->
            <div
              class="absolute right-0 bottom-0 left-0 border-t-2 bg-[#101820]/92 px-2.5 py-2"
              :style="{ borderTopColor: getRarityMeta(disc.rarity).hex }"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="text-[9px] font-bold uppercase tracking-wider text-[#D18C39]">
                  {{ disc.svsId ? `NASA SVS #${disc.svsId}` : 'DATA TRACK' }}
                </span>
                <span
                  v-if="gameStore.currentDisc?.id === disc.id && gameStore.isPlayingAudio"
                  class="animate-pulse text-[9px] font-black text-[#D18C39]"
                >
                  ▶ PLAYING
                </span>
              </div>
              <h2 class="mt-0.5 truncate text-xs font-black uppercase text-[#E7D5AC] group-hover:text-[#D18C39]">
                {{ disc.title }}
              </h2>
              <p class="truncate text-[10px] text-[#E7D5AC]/70">
                {{ disc.instrument }}
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- Video (Option B) / Direct Image Importer Modal -->
    <MediaUploaderModal
      v-if="showUploader"
      @close="showUploader = false"
      @added="handleMediaAdded"
    />
  </section>
</template>
