<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useGameStore, RARITY_CONFIG } from '@/stores/useGameStore'
import { useSonifier } from '@/composables/useSonifier'
import { renderDiscFrameToCanvas, fetchSvsTopicInfo } from '@/game/NasaDatasetGenerator'
import MediaUploaderModal from '@/components/MediaUploaderModal.vue'

const emit = defineEmits(['navigate-to-game', 'navigate-to-vault'])
const gameStore = useGameStore()
const sonifier = useSonifier()

const displayCanvasRef = ref(null)
const laserLineRef = ref(null)
const hoverDotRef = ref(null)
const scanColumnTextRef = ref(null)
const scanNoteTextRef = ref(null)

const activeFrameIndex = ref(0)
const showUploader = ref(false)
const topicInfo = ref(null)
const isLoadingTopic = ref(false)
const isHoverProbing = ref(false)
const selectedNoteType = computed({
  get: () => sonifier.activeNoteType.value,
  set: (value) => {
    if (sonifier.noteTypeOptions[value]) {
      sonifier.activeNoteType.value = value
    }
  },
})

let unsubscribeScan = null
let unsubscribeFrame = null

const currentDisc = computed(() => gameStore.currentDisc)
const totalFrames = computed(() => {
  if (!currentDisc.value) return 1
  if (Array.isArray(currentDisc.value.frames) && currentDisc.value.frames.length > 0) {
    return currentDisc.value.frames.length
  }
  return 1
})

const rarityMeta = computed(() => {
  if (!currentDisc.value) return RARITY_CONFIG.comun
  return RARITY_CONFIG[currentDisc.value.rarity] || RARITY_CONFIG.comun
})

async function redrawVisualizer(frameIdx = activeFrameIndex.value) {
  if (displayCanvasRef.value && currentDisc.value) {
    await renderDiscFrameToCanvas(displayCanvasRef.value, currentDisc.value, frameIdx)
  }
}

async function loadTopicDetails(disc) {
  if (!disc) {
    topicInfo.value = null
    return
  }

  if (disc.svsId) {
    isLoadingTopic.value = true
    topicInfo.value = disc.topicInfo || null
    const apiData = await fetchSvsTopicInfo(disc.svsId)
    if (apiData) {
      topicInfo.value = apiData
    }
    isLoadingTopic.value = false
  } else {
    topicInfo.value = {
      source: 'local',
      title: disc.title,
      releaseDate: disc.date,
      summary: disc.narration,
      credits: [disc.instrument],
      keywords: [disc.mediaType === 'frames' ? 'Option B Video' : 'Direct Image'],
      paragraphs: [
        disc.narration ||
          'Multimedia dataset manually loaded for spectral analysis and sonification.',
      ],
      moreInfoUrl: disc.sourceUrl || null,
      svsUrl: null,
    }
  }
}

watch(
  () => gameStore.currentDisc,
  async (newDisc) => {
    if (!newDisc) return
    activeFrameIndex.value = 0
    await redrawVisualizer(0)
    await sonifier.loadDisc(newDisc)
    loadTopicDetails(newDisc)
    if (gameStore.isPlayingAudio) {
      sonifier.start(newDisc)
    }
  }
)

watch(
  () => gameStore.isPlayingAudio,
  (playing) => {
    if (playing && currentDisc.value) {
      sonifier.start(currentDisc.value)
    } else {
      sonifier.stop()
    }
  }
)

onMounted(async () => {
  if (currentDisc.value) {
    await redrawVisualizer(0)
    await sonifier.loadDisc(currentDisc.value)
    loadTopicDetails(currentDisc.value)
  }

  unsubscribeScan = sonifier.onScanStep(({ scanX, canvasWidth, normalizedX, normalizedY, telemetry }) => {
    if (laserLineRef.value) {
      laserLineRef.value.style.left = `${(normalizedX * 100).toFixed(2)}%`
    }
    if (hoverDotRef.value && typeof normalizedY === 'number') {
      hoverDotRef.value.style.top = `${(normalizedY * 100).toFixed(2)}%`
    }
    if (scanColumnTextRef.value) {
      scanColumnTextRef.value.textContent = `SCAN_X: ${String(scanX).padStart(3, '0')} / ${canvasWidth}`
    }
    if (scanNoteTextRef.value && telemetry) {
      const extra =
        typeof telemetry.normalizedValue === 'number'
          ? ` [${Math.round(telemetry.normalizedValue * 100)}%]`
          : ''
      const thereminTag = telemetry.thereminNote ? ` // THEREMIN: ${telemetry.thereminNote}` : ''
      scanNoteTextRef.value.textContent = `NOTE: ${telemetry.primaryNote}${thereminTag}${extra}`
    }
  })

  unsubscribeFrame = sonifier.onFrameChange(({ frameIndex }) => {
    activeFrameIndex.value = frameIndex
    redrawVisualizer(frameIndex)
  })
})

onBeforeUnmount(() => {
  if (unsubscribeScan) unsubscribeScan()
  if (unsubscribeFrame) unsubscribeFrame()
})

function handleTogglePlay() {
  gameStore.toggleAudioPlayback()
}

function handleSelectFrame(idx) {
  const safe = ((idx % totalFrames.value) + totalFrames.value) % totalFrames.value
  activeFrameIndex.value = safe
  sonifier.setFrameIndex(safe)
  redrawVisualizer(safe)
}

function handleCanvasSeek(event) {
  if (!displayCanvasRef.value) return
  const rect = displayCanvasRef.value.getBoundingClientRect()
  const clickRatio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  const targetX = Math.floor(clickRatio * 256)
  sonifier.setScanPosition(targetX)
  if (laserLineRef.value) {
    laserLineRef.value.style.left = `${(clickRatio * 100).toFixed(2)}%`
  }
  sonifier.stepScan()
}

function handleLegendaryHoverMove(event) {
  if (!currentDisc.value || currentDisc.value.rarity !== 'legendario' || !displayCanvasRef.value) {
    return
  }
  const clientX = event.touches ? event.touches[0]?.clientX : event.clientX
  const clientY = event.touches ? event.touches[0]?.clientY : event.clientY
  if (typeof clientX !== 'number' || typeof clientY !== 'number') return

  const rect = displayCanvasRef.value.getBoundingClientRect()
  const normX = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)))
  const normY = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)))

  isHoverProbing.value = true
  sonifier.setHoverActive(true)
  sonifier.probeHoverPixel(normX, normY, currentDisc.value)
}

function handleLegendaryHoverLeave() {
  if (isHoverProbing.value) {
    isHoverProbing.value = false
    sonifier.setHoverActive(false)
  }
}
</script>

<template>
  <section
    class="relative flex h-full w-full shrink-0 snap-center flex-col overflow-y-auto bg-[#101820] p-4 text-[#E7D5AC] md:p-6"
  >
    <!-- LAB Header -->
    <header
      class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#31515A] pb-3"
    >
      <div>
        <div class="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D18C39]">
          <span>[RIGHT SECTION // LAB]</span>
          <span
            v-if="currentDisc && totalFrames > 1"
            class="border border-[#31515A] bg-[#1D303B] px-2 py-0.5 text-[10px] text-[#E7D5AC]"
          >
            OPTION B: {{ totalFrames }} FRAMES
          </span>
          <span
            v-if="currentDisc?.rarity === 'legendario'"
            class="border border-[#D18C39] bg-[#1D303B] px-2 py-0.5 text-[10px] text-[#D18C39]"
          >
            ✨ LEGENDARY HOVER ACTIVE
          </span>
          <span
            v-if="currentDisc?.category === 'espacial'"
            class="border border-[#31515A] bg-[#1D303B] px-2 py-0.5 text-[10px] text-[#E7D5AC]"
          >
            🎧 8D ORBITAL AUDIO
          </span>
          <span
            v-if="currentDisc?.category === 'planetario'"
            class="border border-[#31515A] bg-[#1D303B] px-2 py-0.5 text-[10px] text-[#E7D5AC]"
          >
            🪐 PLANETARY (SILENT ON BLACK)
          </span>
          <span
            v-if="currentDisc"
            class="border border-[#31515A] bg-[#1D303B] px-2 py-0.5 text-[10px] text-[#E7D5AC]/80"
          >
            🌊 AMBIENT + THEREMIN{{
              currentDisc.rarity !== 'comun'
                ? `: ${currentDisc.ambientStyle === 'espacial' || currentDisc.category === 'espacial' || currentDisc.category === 'grafica' || currentDisc.category === 'planetario' ? 'spatial' : 'maritime'}`
                : ': base'
            }}
          </span>
        </div>
        <h1 class="mt-1 text-xl font-black uppercase tracking-wider text-[#E7D5AC] md:text-2xl">
          LAB // VISUALIZER &amp; NASA SCIENTIFIC REPORT
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="border-2 border-[#D18C39] bg-[#1D303B] px-3 py-1.5 text-xs font-black uppercase text-[#E7D5AC] hover:bg-[#D18C39] hover:text-[#101820]"
          @click="showUploader = true"
        >
          + ADD VIDEO / IMAGE
        </button>
        <button
          type="button"
          class="border-2 border-[#31515A] bg-[#1D303B] px-3 py-1.5 text-xs font-bold uppercase text-[#E7D5AC] hover:border-[#D18C39]"
          @click="emit('navigate-to-vault')"
        >
          ◄◄ GALLERY [1/G]
        </button>
        <button
          type="button"
          class="border-2 border-[#31515A] bg-[#D18C39] px-3 py-1.5 text-xs font-bold uppercase text-[#101820] shadow-[3px_3px_0px_#000] hover:brightness-110"
          @click="emit('navigate-to-game')"
        >
          ◄ BACK TO GAME [2/A]
        </button>
        <label
          class="flex items-center gap-2 border border-[#31515A] bg-[#1D303B] px-2 py-1 text-[10px] font-bold uppercase text-[#E7D5AC]"
        >
          <span class="text-[#D18C39]">♫ NOTE TYPE</span>
          <select
            v-model="selectedNoteType"
            class="bg-[#101820] px-1.5 py-1 text-[10px] text-[#E7D5AC] outline-none"
            aria-label="Seleccionar tipo de notas musicales"
          >
            <option
              v-for="(noteType, noteTypeId) in sonifier.noteTypeOptions"
              :key="noteTypeId"
              :value="noteTypeId"
            >
              {{ noteType.label }}
            </option>
          </select>
        </label>
      </div>
    </header>

    <div
      v-if="!currentDisc"
      class="my-auto flex flex-col items-center justify-center border-2 border-dashed border-[#31515A] bg-[#1D303B]/40 p-10 text-center"
    >
      <p class="text-sm font-bold uppercase text-[#E7D5AC]">
        NO DISC SELECTED
      </p>
      <p class="mt-1 text-xs text-[#E7D5AC]/70">
        Collect NASA SVS #5153 on the ship or add a video/image from the top button.
      </p>
    </div>

    <!-- Main Viewer + NASA SVS API Scientific Information Panel -->
    <div v-else class="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Left Column: Laser Visualizer + Option B Timeline + Play/Pause -->
      <div class="flex flex-col lg:col-span-2">
        <div
          class="relative flex-1 cursor-crosshair overflow-hidden border-2 bg-black min-h-[240px] md:min-h-[340px]"
          :class="rarityMeta.borderClass"
          :title="
            currentDisc.rarity === 'legendario'
              ? 'Legendary Disc: hover over pixels to sonify in real time'
              : 'Click to move the scanX laser'
          "
          @click="handleCanvasSeek"
          @mousemove="handleLegendaryHoverMove"
          @mouseleave="handleLegendaryHoverLeave"
          @touchmove.passive="handleLegendaryHoverMove"
          @touchend.passive="handleLegendaryHoverLeave"
        >
          <canvas
            ref="displayCanvasRef"
            width="512"
            height="256"
            class="pixelated h-full w-full object-fill"
          ></canvas>

          <!-- Vertical Laser Line synchronized with scanX -->
          <div
            ref="laserLineRef"
            class="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-[#D18C39] shadow-[0_0_12px_#D18C39,0_0_4px_#E7D5AC]"
            style="left: 0%"
          >
            <div
              class="absolute -top-0.5 -left-1.5 h-3 w-3 rotate-45 bg-[#D18C39] shadow-[0_0_6px_#E7D5AC]"
            ></div>
            <div
              v-show="isHoverProbing"
              ref="hoverDotRef"
              class="absolute -left-2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-[#E7D5AC] bg-[#D18C39]/40 shadow-[0_0_10px_#D18C39]"
              style="top: 50%"
            ></div>
          </div>

          <div class="crt-scanlines pointer-events-none absolute inset-0 opacity-25"></div>
        </div>

        <!-- Frame Timeline (Option B when >1 frame) -->
        <div
          v-if="totalFrames > 1"
          class="mt-3 flex flex-col gap-2 border-2 border-[#31515A] bg-[#1D303B] p-2.5"
        >
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-[#D18C39]">
              FRAME {{ String(activeFrameIndex + 1).padStart(2, '0') }} / {{ String(totalFrames).padStart(2, '0') }}
            </span>
            <div class="flex gap-1.5">
              <button
                type="button"
                class="border border-[#31515A] bg-[#101820] px-2 py-0.5 text-[11px] text-[#E7D5AC] hover:border-[#D18C39]"
                @click="handleSelectFrame(activeFrameIndex - 1)"
              >
                ◀
              </button>
              <button
                type="button"
                class="border border-[#31515A] bg-[#101820] px-2 py-0.5 text-[11px] text-[#E7D5AC] hover:border-[#D18C39]"
                @click="handleSelectFrame(activeFrameIndex + 1)"
              >
                ▶
              </button>
            </div>
          </div>

          <div
            class="grid gap-1"
            :style="{ gridTemplateColumns: `repeat(${totalFrames}, minmax(0, 1fr))` }"
          >
            <button
              v-for="idx in totalFrames"
              :key="`frame-bar-${idx}`"
              type="button"
              class="h-2.5 border transition-colors"
              :class="
                idx - 1 === activeFrameIndex
                  ? 'border-[#E7D5AC] bg-[#D18C39]'
                  : 'border-[#31515A] bg-[#101820] hover:bg-[#31515A]'
              "
              :title="`Frame ${idx}`"
              @click="handleSelectFrame(idx - 1)"
            ></button>
          </div>
        </div>

        <!-- Playback & laser readout bar -->
        <div
          class="mt-3 flex flex-wrap items-center justify-between gap-3 border-2 border-[#31515A] bg-[#1D303B] px-3 py-2.5"
        >
          <button
            type="button"
            class="border-2 border-[#31515A] bg-[#D18C39] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#101820] shadow-[3px_3px_0px_#000] hover:brightness-110"
            @click="handleTogglePlay"
          >
            {{ gameStore.isPlayingAudio ? '❚❚ PAUSE' : '▶ PLAY' }}
          </button>

          <div class="flex items-center gap-4 text-xs font-bold">
            <span ref="scanColumnTextRef" class="text-[#D18C39]">
              SCAN_X: 000 / 256
            </span>
            <span ref="scanNoteTextRef" class="text-[#E7D5AC]">
              NOTE: --
            </span>
          </div>
        </div>
      </div>

      <!-- Right Column: Scientific Topic Information via NASA SVS API -->
      <aside
        data-testid="topic-info-panel"
        class="flex max-h-[75dvh] flex-col justify-between overflow-y-auto border-2 border-[#31515A] bg-[#1D303B] p-4"
      >
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#31515A] pb-2">
            <span
              class="border border-[#D18C39] bg-[#101820] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#D18C39]"
            >
              {{
                isLoadingTopic
                  ? 'QUERYING NASA SVS API...'
                  : topicInfo?.source === 'api-live'
                    ? `NASA SVS API #${currentDisc.svsId} (LIVE)`
                    : currentDisc.svsId
                      ? `NASA SVS #${currentDisc.svsId} (API DATA)`
                      : 'MEDIA ARCHIVE'
              }}
            </span>
            <span class="text-[11px] text-[#E7D5AC]/70">
              {{ topicInfo?.releaseDate || currentDisc.date }}
            </span>
          </div>

          <h2 class="mt-2.5 text-lg font-black text-[#E7D5AC]">
            {{ topicInfo?.title || currentDisc.title }}
          </h2>
          <p class="text-xs font-bold text-[#D18C39]">
            {{ currentDisc.instrument }}
          </p>

          <!-- API Keywords -->
          <div
            v-if="topicInfo?.keywords?.length"
            class="mt-2.5 flex flex-wrap gap-1.5"
          >
            <span
              v-for="kw in topicInfo.keywords"
              :key="kw"
              class="border border-[#31515A] bg-[#101820] px-1.5 py-0.5 text-[10px] text-[#E7D5AC]/85"
            >
              #{{ kw }}
            </span>
          </div>

          <!-- Dataset Summary -->
          <p
            v-if="topicInfo?.summary"
            class="mt-3 border-l-2 border-[#D18C39] pl-2.5 text-xs font-semibold text-[#E7D5AC]"
          >
            {{ topicInfo.summary }}
          </p>

          <!-- Official NASA Colorbar Scale if present -->
          <div
            v-if="currentDisc.colorbarUrl"
            class="mt-3 border border-[#31515A] bg-[#101820] p-2"
          >
            <p class="mb-1 text-[10px] font-bold uppercase text-[#E7D5AC]/75">
              OFFICIAL CONCENTRATION SCALE (NASA SVS):
            </p>
            <img
              :src="currentDisc.colorbarUrl"
              alt="NASA Official Color Scale"
              class="pixelated w-full bg-white/95 p-1"
            />
          </div>

          <!-- Scientific Topic Explanation (SVS API Media Groups) -->
          <div class="mt-3 space-y-2.5 text-xs leading-relaxed text-[#E7D5AC]/85">
            <p
              v-for="(paragraph, idx) in topicInfo?.paragraphs || []"
              :key="`p-${idx}`"
            >
              {{ paragraph }}
            </p>
          </div>

          <!-- Official API Credits -->
          <div
            v-if="topicInfo?.credits?.length"
            class="mt-4 border-t border-[#31515A] pt-2.5 text-[11px] text-[#E7D5AC]/75"
          >
            <span class="font-bold uppercase text-[#D18C39]">NASA CREDITS:</span>
            {{ topicInfo.credits.join(' • ') }}
          </div>
        </div>

        <!-- Official NASA Source Links -->
        <div
          v-if="topicInfo?.svsUrl || topicInfo?.moreInfoUrl"
          class="mt-4 flex flex-wrap gap-2 border-t border-[#31515A] pt-3"
        >
          <a
            v-if="topicInfo?.svsUrl"
            :href="topicInfo.svsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-[#D18C39] bg-[#101820] px-2.5 py-1.5 text-[11px] font-bold uppercase text-[#E7D5AC] hover:bg-[#D18C39] hover:text-[#101820]"
          >
            VIEW ON NASA SVS ↗
          </a>
          <a
            v-if="topicInfo?.moreInfoUrl"
            :href="topicInfo.moreInfoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-[#31515A] bg-[#101820] px-2.5 py-1.5 text-[11px] font-bold uppercase text-[#D18C39] hover:border-[#D18C39]"
          >
            MORE INFO (GEOS-CF) ↗
          </a>
        </div>
      </aside>
    </div>

    <MediaUploaderModal
      v-if="showUploader"
      @close="showUploader = false"
      @added="showUploader = false"
    />
  </section>
</template>
