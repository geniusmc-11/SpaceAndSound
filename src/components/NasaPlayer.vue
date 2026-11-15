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
      keywords: [disc.mediaType === 'frames' ? 'Video Opción B' : 'Imagen Directa'],
      paragraphs: [
        disc.narration ||
          'Dataset multimedia cargado manualmente para análisis espectral y sonificación.',
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
      scanNoteTextRef.value.textContent = `NOTA: ${telemetry.primaryNote}${extra}`
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
    class="relative flex h-dvh w-screen shrink-0 snap-center flex-col overflow-y-auto bg-[#040812] p-4 md:p-8"
  >
    <!-- Encabezado Reproductor NASA -->
    <header
      class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-400/50 pb-3"
    >
      <div>
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
          <span>[SECCIÓN DERECHA // EARTH INFORMATION JUKEBOX]</span>
          <span
            v-if="currentDisc && totalFrames > 1"
            class="border border-sky-500/60 bg-sky-950/70 px-2 py-0.5 text-[10px] text-sky-300"
          >
            OPCIÓN B: {{ totalFrames }} FOTOGRAMAS
          </span>
          <span
            v-if="currentDisc?.rarity === 'legendario'"
            class="border border-yellow-400/80 bg-yellow-950/80 px-2 py-0.5 text-[10px] text-yellow-300"
          >
            ✨ HOVER LEGENDARIO ACTIVO
          </span>
          <span
            v-if="currentDisc?.category === 'espacial'"
            class="border border-purple-400/80 bg-purple-950/80 px-2 py-0.5 text-[10px] text-purple-200"
          >
            🎧 AUDIO 8D ORBITAL
          </span>
          <span
            v-if="currentDisc && currentDisc.rarity !== 'comun'"
            class="border border-cyan-400/60 bg-cyan-950/70 px-2 py-0.5 text-[10px] text-cyan-200"
          >
            🌊 FONDO: {{ currentDisc.ambientStyle || (currentDisc.category === 'espacial' || currentDisc.category === 'grafica' ? 'espacial' : 'maritimo') }}
          </span>
        </div>
        <h1 class="mt-1 text-xl font-black uppercase tracking-wider text-slate-100 md:text-2xl">
          REPRODUCTOR &amp; INFORME CIENTÍFICO NASA
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="border-2 border-emerald-400 bg-emerald-950 px-3 py-1.5 text-xs font-black uppercase text-emerald-200 hover:bg-emerald-800"
          @click="showUploader = true"
        >
          + AÑADIR VIDEO / IMAGEN
        </button>
        <button
          type="button"
          class="border-2 border-slate-500 bg-slate-900 px-3 py-1.5 text-xs font-bold uppercase text-slate-200 hover:bg-slate-800"
          @click="emit('navigate-to-vault')"
        >
          ◄◄ BÓVEDA
        </button>
        <button
          type="button"
          class="border-2 border-sky-400 bg-sky-950 px-3 py-1.5 text-xs font-bold uppercase text-sky-200 shadow-[3px_3px_0px_#000] hover:bg-sky-800"
          @click="emit('navigate-to-game')"
        >
          ◄ VOLVER AL JUEGO [A]
        </button>
      </div>
    </header>

    <div
      v-if="!currentDisc"
      class="my-auto flex flex-col items-center justify-center border-2 border-dashed border-slate-700 p-10 text-center"
    >
      <p class="text-sm font-bold uppercase text-slate-300">
        NINGÚN DISCO SELECCIONADO
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Recoge NASA SVS #5153 en la nave o añade un video/imagen desde el botón superior.
      </p>
    </div>

    <!-- Visor Principal + Panel de Información Científica vía API -->
    <div v-else class="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Columna Izquierda: Visualizador Láser + Timeline Opción B + Play/Pause -->
      <div class="flex flex-col lg:col-span-2">
        <div
          class="relative flex-1 cursor-crosshair overflow-hidden border-2 bg-black min-h-[240px] md:min-h-[340px]"
          :class="rarityMeta.borderClass"
          :title="
            currentDisc.rarity === 'legendario'
              ? 'Disco Legendario: pasa el cursor sobre los píxeles para sonificar en tiempo real'
              : 'Haz clic para mover el láser scanX'
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

          <!-- Línea Láser Vertical sincronizada con scanX -->
          <div
            ref="laserLineRef"
            class="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e,0_0_4px_#fff]"
            style="left: 0%"
          >
            <div
              class="absolute -top-0.5 -left-1.5 h-3 w-3 rotate-45 bg-rose-400 shadow-[0_0_6px_#fff]"
            ></div>
            <div
              v-show="isHoverProbing"
              ref="hoverDotRef"
              class="absolute -left-2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-yellow-300 bg-yellow-400/30 shadow-[0_0_10px_#facc15]"
              style="top: 50%"
            ></div>
          </div>

          <div class="crt-scanlines pointer-events-none absolute inset-0 opacity-25"></div>
        </div>

        <!-- Timeline de Fotogramas (Opción B cuando hay >1 fotograma) -->
        <div
          v-if="totalFrames > 1"
          class="mt-3 flex flex-col gap-2 border-2 border-slate-700 bg-[#070d1c] p-2.5"
        >
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-amber-300">
              FOTOGRAMA {{ String(activeFrameIndex + 1).padStart(2, '0') }} / {{ String(totalFrames).padStart(2, '0') }}
            </span>
            <div class="flex gap-1.5">
              <button
                type="button"
                class="border border-slate-600 bg-slate-900 px-2 py-0.5 text-[11px] hover:bg-slate-800"
                @click="handleSelectFrame(activeFrameIndex - 1)"
              >
                ◀
              </button>
              <button
                type="button"
                class="border border-slate-600 bg-slate-900 px-2 py-0.5 text-[11px] hover:bg-slate-800"
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
                  ? 'border-white bg-amber-400'
                  : 'border-slate-700 bg-slate-800 hover:bg-sky-700'
              "
              :title="`Fotograma ${idx}`"
              @click="handleSelectFrame(idx - 1)"
            ></button>
          </div>
        </div>

        <!-- Barra simple de reproducción + lectura láser -->
        <div
          class="mt-3 flex flex-wrap items-center justify-between gap-3 border-2 border-slate-700 bg-[#081021] px-3 py-2.5"
        >
          <button
            type="button"
            class="border-2 border-emerald-400 bg-emerald-950 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-200 shadow-[3px_3px_0px_#000] hover:bg-emerald-800"
            @click="handleTogglePlay"
          >
            {{ gameStore.isPlayingAudio ? '❚❚ PAUSAR' : '▶ REPRODUCIR' }}
          </button>

          <div class="flex items-center gap-4 text-xs font-bold">
            <span ref="scanColumnTextRef" class="text-rose-400">
              SCAN_X: 000 / 256
            </span>
            <span ref="scanNoteTextRef" class="text-emerald-400">
              NOTA: --
            </span>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Información Científica del Tema vía API NASA SVS -->
      <aside
        data-testid="topic-info-panel"
        class="flex max-h-[75dvh] flex-col justify-between overflow-y-auto border-2 border-slate-700 bg-[#081021] p-4"
      >
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2">
            <span
              class="border px-1.5 py-0.5 text-[10px] font-bold uppercase"
              :class="
                topicInfo?.source === 'api-live'
                  ? 'border-emerald-400 bg-emerald-950 text-emerald-300'
                  : 'border-sky-400 bg-sky-950 text-sky-300'
              "
            >
              {{
                isLoadingTopic
                  ? 'CONSULTANDO API NASA SVS...'
                  : topicInfo?.source === 'api-live'
                    ? `API NASA SVS #${currentDisc.svsId} (EN VIVO)`
                    : currentDisc.svsId
                      ? `NASA SVS #${currentDisc.svsId} (DATOS API)`
                      : 'ARCHIVO MULTIMEDIA'
              }}
            </span>
            <span class="text-[11px] text-slate-400">
              {{ topicInfo?.releaseDate || currentDisc.date }}
            </span>
          </div>

          <h2 class="mt-2.5 text-lg font-black text-white">
            {{ topicInfo?.title || currentDisc.title }}
          </h2>
          <p class="text-xs font-bold text-amber-300">
            {{ currentDisc.instrument }}
          </p>

          <!-- Palabras clave de la API -->
          <div
            v-if="topicInfo?.keywords?.length"
            class="mt-2.5 flex flex-wrap gap-1.5"
          >
            <span
              v-for="kw in topicInfo.keywords"
              :key="kw"
              class="border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-[10px] text-sky-300"
            >
              #{{ kw }}
            </span>
          </div>

          <!-- Resumen del Dataset -->
          <p
            v-if="topicInfo?.summary"
            class="mt-3 border-l-2 border-amber-400 pl-2.5 text-xs font-semibold text-slate-200"
          >
            {{ topicInfo.summary }}
          </p>

          <!-- Escala de Color oficial NASA si existe -->
          <div
            v-if="currentDisc.colorbarUrl"
            class="mt-3 border border-slate-700 bg-black/70 p-2"
          >
            <p class="mb-1 text-[10px] font-bold uppercase text-slate-400">
              ESCALA OFICIAL DE CONCENTRACIÓN (NASA SVS):
            </p>
            <img
              :src="currentDisc.colorbarUrl"
              alt="Escala de color NASA Carbon Monoxide"
              class="pixelated w-full bg-white/95 p-1"
            />
          </div>

          <!-- Explicación Científica del Tema (API SVS Media Groups) -->
          <div class="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-300">
            <p
              v-for="(paragraph, idx) in topicInfo?.paragraphs || []"
              :key="`p-${idx}`"
            >
              {{ paragraph }}
            </p>
          </div>

          <!-- Créditos oficiales de la API -->
          <div
            v-if="topicInfo?.credits?.length"
            class="mt-4 border-t border-slate-800 pt-2.5 text-[11px] text-slate-400"
          >
            <span class="font-bold uppercase text-slate-300">CRÉDITOS NASA:</span>
            {{ topicInfo.credits.join(' • ') }}
          </div>
        </div>

        <!-- Enlaces a fuentes oficiales NASA -->
        <div
          v-if="topicInfo?.svsUrl || topicInfo?.moreInfoUrl"
          class="mt-4 flex flex-wrap gap-2 border-t border-slate-700 pt-3"
        >
          <a
            v-if="topicInfo?.svsUrl"
            :href="topicInfo.svsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-sky-500 bg-sky-950/70 px-2.5 py-1.5 text-[11px] font-bold uppercase text-sky-200 hover:bg-sky-800"
          >
            VER EN NASA SVS ↗
          </a>
          <a
            v-if="topicInfo?.moreInfoUrl"
            :href="topicInfo.moreInfoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-amber-500 bg-amber-950/70 px-2.5 py-1.5 text-[11px] font-bold uppercase text-amber-200 hover:bg-amber-800"
          >
            MÁS INFO (GEOS-CF) ↗
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
