<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useGameStore, RARITY_CONFIG, NASA_CATEGORIES } from '@/stores/useGameStore'
import { useSonifier } from '@/composables/useSonifier'
import { renderDiscFrameToCanvas } from '@/game/NasaDatasetGenerator'
import MediaUploaderModal from '@/components/MediaUploaderModal.vue'

const emit = defineEmits(['navigate-to-game', 'navigate-to-vault'])
const gameStore = useGameStore()
const sonifier = useSonifier()

const displayCanvasRef = ref(null)
const laserLineRef = ref(null)
const scanColumnTextRef = ref(null)
const scanNoteTextRef = ref(null)
const scanDetailTextRef = ref(null)

const activeFrameIndex = ref(0)
const showUploader = ref(false)

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

const MODE_DESCRIPTIONS = {
  grafica:
    'MODO GRÁFICA (Series de Tiempo): Barrido X de izquierda a derecha; la coordenada Y del píxel más brillante cuantiza el pitch en la escala pentatónica.',
  maritimo:
    'MODO MARÍTIMO (Nivel del Mar): Síntesis dual; la línea guía blanca (RGB > 225) modula el bajo/drone continuo y el área azul/cian dispara melodía (con +intensidad si rebasa la guía blanca).',
  espacial:
    'MODO ESPACIAL (Nebulosas/Estrellas): Puntos ultra brillantes (R+G+B > 690) disparan notas agudas tipo arpa/pluck; nubes difusas disparan acordes con Reverb (graves para rojo/IR, agudos para azul/UV).',
  huracan:
    'MODO HURACÁN (Mapas de Calor / Concentración): Evalúa en tiempo real la proporción de colores cálidos (alta densidad/calor) vs. fríos en la columna escaneada para modular tensión armónica y ritmo.',
}

async function redrawVisualizer(frameIdx = activeFrameIndex.value) {
  if (displayCanvasRef.value && currentDisc.value) {
    await renderDiscFrameToCanvas(displayCanvasRef.value, currentDisc.value, frameIdx)
  }
}

watch(
  () => gameStore.currentDisc,
  async (newDisc) => {
    if (!newDisc) return
    activeFrameIndex.value = 0
    await redrawVisualizer(0)
    await sonifier.loadDisc(newDisc)
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
  }

  unsubscribeScan = sonifier.onScanStep(({ scanX, canvasWidth, normalizedX, telemetry }) => {
    if (laserLineRef.value) {
      laserLineRef.value.style.left = `${(normalizedX * 100).toFixed(2)}%`
    }
    if (scanColumnTextRef.value) {
      scanColumnTextRef.value.textContent = `SCAN_X: ${String(scanX).padStart(3, '0')} / ${canvasWidth}`
    }
    if (scanNoteTextRef.value && telemetry) {
      scanNoteTextRef.value.textContent = `NOTA: ${telemetry.primaryNote}`
    }
    if (scanDetailTextRef.value && telemetry) {
      scanDetailTextRef.value.textContent = telemetry.detail
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

function handleChangeCategory(newCat) {
  if (!currentDisc.value) return
  gameStore.setDiscCategory(currentDisc.value.id, newCat)
  sonifier.setMode(newCat)
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

function handleNarrateMetadata() {
  if (!currentDisc.value || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(currentDisc.value.narration)
  utterance.lang = 'es-ES'
  window.speechSynthesis.speak(utterance)
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
            v-if="currentDisc"
            class="border px-2 py-0.5 text-[10px]"
            :class="rarityMeta.badgeClass"
          >
            RAREZA: {{ rarityMeta.label }}
          </span>
          <span
            v-if="currentDisc && totalFrames > 1"
            class="border border-sky-500/60 bg-sky-950/70 px-2 py-0.5 text-[10px] text-sky-300"
          >
            OPCIÓN B: {{ totalFrames }} FOTOGRAMAS
          </span>
        </div>
        <h1 class="mt-1 text-xl font-black uppercase tracking-wider text-slate-100 md:text-2xl">
          REPRODUCTOR &amp; MOTOR DE SONIFICACIÓN NASA
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

    <!-- Visor Principal con Línea Láser Vertical scanX + Secuencia Opción B -->
    <div v-else class="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="flex flex-col lg:col-span-2">
        <div
          class="relative flex-1 cursor-crosshair overflow-hidden border-2 bg-black min-h-[240px] md:min-h-[340px]"
          :class="rarityMeta.borderClass"
          title="Haz clic para posicionar el láser scanX"
          @click="handleCanvasSeek"
        >
          <canvas
            ref="displayCanvasRef"
            width="512"
            height="256"
            class="pixelated h-full w-full object-fill"
          ></canvas>

          <!-- Línea Láser Vertical sincronizada en tiempo real con scanX -->
          <div
            ref="laserLineRef"
            class="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e,0_0_4px_#fff]"
            style="left: 0%"
          >
            <div
              class="absolute -top-0.5 -left-1.5 h-3 w-3 rotate-45 bg-rose-400 shadow-[0_0_6px_#fff]"
            ></div>
            <div
              class="absolute bottom-2 left-1.5 whitespace-nowrap border border-rose-400 bg-black/85 px-1.5 py-0.5 text-[10px] font-bold text-rose-300"
            >
              LÁSER SCAN_X
            </div>
          </div>

          <div class="crt-scanlines pointer-events-none absolute inset-0 opacity-30"></div>
        </div>

        <!-- Selector / Timeline de Fotogramas (Opción B cuando hay >1 fotograma) -->
        <div
          v-if="totalFrames > 1"
          class="mt-3 flex flex-col gap-2 border-2 border-slate-700 bg-[#070d1c] p-2.5"
        >
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-amber-300">
              TIMELINE OPCIÓN B: FOTOGRAMA {{ String(activeFrameIndex + 1).padStart(2, '0') }} / {{ String(totalFrames).padStart(2, '0') }}
            </span>
            <div class="flex gap-1.5">
              <button
                type="button"
                class="border border-slate-600 bg-slate-900 px-2 py-0.5 text-[11px] hover:bg-slate-800"
                @click="handleSelectFrame(activeFrameIndex - 1)"
              >
                ◀ ANTERIOR
              </button>
              <button
                type="button"
                class="border border-slate-600 bg-slate-900 px-2 py-0.5 text-[11px] hover:bg-slate-800"
                @click="handleSelectFrame(activeFrameIndex + 1)"
              >
                SIGUIENTE ▶
              </button>
            </div>
          </div>

          <div class="grid gap-1" :style="{ gridTemplateColumns: `repeat(${totalFrames}, minmax(0, 1fr))` }">
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
              :title="`Ir al fotograma ${idx}`"
              @click="handleSelectFrame(idx - 1)"
            ></button>
          </div>
        </div>

        <!-- Barra de Telemetría en Tiempo Real -->
        <div
          class="mt-3 flex flex-wrap items-center justify-between gap-2 border-2 border-slate-700 bg-[#081021] px-3 py-2 text-xs font-bold"
        >
          <span ref="scanColumnTextRef" class="text-rose-400">
            SCAN_X: 000 / 256
          </span>
          <span ref="scanNoteTextRef" class="text-emerald-400">
            NOTA: --
          </span>
          <span ref="scanDetailTextRef" class="truncate text-sky-300">
            LISTO PARA BARRIDO ESPECTRAL
          </span>
        </div>
      </div>

      <!-- Panel de Control y Metadatos -->
      <aside class="flex flex-col justify-between border-2 border-slate-700 bg-[#081021] p-4">
        <div>
          <div class="flex items-center justify-between border-b border-slate-700 pb-2">
            <span class="text-xs font-bold uppercase text-sky-400">
              ORIGEN: {{ currentDisc.svsId ? `NASA SVS #${currentDisc.svsId}` : 'MULTIMEDIA' }}
            </span>
            <span class="text-[11px] text-slate-400">
              {{ currentDisc.date }}
            </span>
          </div>

          <h2 class="mt-2 text-lg font-black text-white">
            {{ currentDisc.title }}
          </h2>
          <p class="text-xs font-bold text-amber-300">
            INSTRUMENTO: {{ currentDisc.instrument }}
          </p>

          <!-- Selector en vivo de Estrategia de Sonificación -->
          <div class="mt-3">
            <p class="mb-1 text-[10px] font-bold uppercase text-slate-400">
              CAMBIAR ESTRATEGIA DE SONIFICACIÓN:
            </p>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="cat in NASA_CATEGORIES"
                :key="cat"
                type="button"
                class="border py-1 text-[11px] font-bold uppercase"
                :class="
                  currentDisc.category === cat
                    ? 'border-sky-400 bg-sky-900 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                "
                @click="handleChangeCategory(cat)"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <div class="mt-3 border border-slate-700 bg-black/60 p-3">
            <p class="text-[11px] font-bold uppercase text-sky-300">
              ESTRATEGIA ACTIVA ({{ currentDisc.category.toUpperCase() }}):
            </p>
            <p class="mt-1 text-xs leading-relaxed text-slate-300">
              {{ MODE_DESCRIPTIONS[currentDisc.category] }}
            </p>
          </div>

          <div class="mt-3 border border-slate-700 bg-black/60 p-3">
            <p class="text-[11px] font-bold uppercase text-purple-300">
              ESCALAMIENTO POR RAREZA ({{ rarityMeta.label.toUpperCase() }}):
            </p>
            <p class="mt-1 text-xs text-slate-300">
              {{ rarityMeta.description }}
            </p>
          </div>

          <div class="mt-3 border border-slate-800 bg-[#04070f] p-2.5 text-[11px] text-slate-400 italic">
            "{{ currentDisc.narration }}"
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2">
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 border-2 border-emerald-400 bg-emerald-950 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-200 shadow-[3px_3px_0px_#000] hover:bg-emerald-800"
              @click="handleTogglePlay"
            >
              {{ gameStore.isPlayingAudio ? '❚❚ PAUSAR SONIFICACIÓN' : '▶ INICIAR BARRIDO LÁSER' }}
            </button>

            <button
              type="button"
              class="border-2 border-amber-400 bg-amber-950 px-3 py-2.5 text-xs font-bold uppercase text-amber-200 shadow-[3px_3px_0px_#000] hover:bg-amber-800"
              title="Narrar metadatos con síntesis de voz"
              @click="handleNarrateMetadata"
            >
              🔊 VOZ NASA
            </button>
          </div>
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
