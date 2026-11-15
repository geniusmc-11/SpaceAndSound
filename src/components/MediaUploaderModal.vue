<script setup>
import { ref } from 'vue'
import { useGameStore, NASA_CATEGORIES, RARITY_CONFIG } from '@/stores/useGameStore'
import {
  convertVideoToOptionBFrames,
  convertImageToDirectDiscMedia,
  buildDiscRecord,
} from '@/game/MediaFrameConverter'
import { COLORBAR_PROFILES } from '@/game/ColorbarMapper'

const emit = defineEmits(['close', 'added'])
const gameStore = useGameStore()

const inputType = ref('video') // 'video' (Opción B) | 'image' (Directa)
const title = ref('')
const instrument = ref('Dataset NASA / Usuario')
const category = ref('maps')
const mapProfileId = ref('5153')
const rarity = ref('raro')
const frameCount = ref(16)
const externalImageUrl = ref('')
const selectedFile = ref(null)

const isProcessing = ref(false)
const progressCurrent = ref(0)
const progressTotal = ref(0)
const errorMessage = ref('')

function handleFileChange(event) {
  errorMessage.value = ''
  const file = event.target.files?.[0]
  if (!file) return
  selectedFile.value = file
  if (!title.value.trim()) {
    title.value = file.name.replace(/\.[^.]+$/, '')
  }
}

async function handleSubmit() {
  errorMessage.value = ''

  if (inputType.value === 'video') {
    if (!selectedFile.value) {
      errorMessage.value = 'Selecciona un archivo de video (.mp4, .webm, .mov).'
      return
    }
    isProcessing.value = true
    progressCurrent.value = 0
    progressTotal.value = frameCount.value

    try {
      const result = await convertVideoToOptionBFrames(selectedFile.value, {
        frameCount: frameCount.value,
        onProgress: (curr, total) => {
          progressCurrent.value = curr
          progressTotal.value = total
        },
      })

      const newDisc = buildDiscRecord({
        title: title.value || selectedFile.value.name,
        instrument: instrument.value,
        category: category.value,
        mapProfileId: mapProfileId.value,
        rarity: rarity.value,
        mediaType: 'frames',
        frames: result.frames,
        durationSec: result.durationSec,
        frameIntervalMs: result.frameIntervalMs,
      })

      gameStore.addCustomDisc(newDisc, true)
      emit('added', newDisc)
      emit('close')
    } catch (err) {
      errorMessage.value = err?.message || 'Error al convertir el video a fotogramas.'
    } finally {
      isProcessing.value = false
    }
  } else {
    // Imagen directa (Archivo o URL)
    const source = selectedFile.value || externalImageUrl.value.trim()
    if (!source) {
      errorMessage.value = 'Selecciona una imagen local o pega una URL de imagen con CORS habilitado.'
      return
    }

    isProcessing.value = true
    try {
      const result = await convertImageToDirectDiscMedia(source)
      const newDisc = buildDiscRecord({
        title: title.value || (selectedFile.value?.name ?? 'Imagen NASA Directa'),
        instrument: instrument.value,
        category: category.value,
        mapProfileId: mapProfileId.value,
        rarity: rarity.value,
        mediaType: 'image',
        frames: result.frames,
        imageUrl: result.imageUrl,
        sourceUrl: typeof source === 'string' ? source : null,
      })

      gameStore.addCustomDisc(newDisc, true)
      emit('added', newDisc)
      emit('close')
    } catch (err) {
      errorMessage.value = err?.message || 'No se pudo cargar la imagen.'
    } finally {
      isProcessing.value = false
    }
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
    @click.self="!isProcessing && emit('close')"
  >
    <div class="w-full max-w-lg border-2 border-sky-400 bg-[#070d1c] p-5 shadow-[6px_6px_0px_#000]">
      <div class="flex items-center justify-between border-b border-slate-700 pb-3">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-widest text-amber-400">
            IMPORTADOR MULTIMEDIA // OPCIÓN B
          </p>
          <h2 class="text-base font-black uppercase text-white">
            AÑADIR VIDEO (A FOTOGRAMAS) O IMAGEN
          </h2>
        </div>
        <button
          type="button"
          :disabled="isProcessing"
          class="border border-slate-600 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Selector Tipo: Video -> Opción B vs Imagen Directa -->
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          class="border-2 py-2 text-xs font-black uppercase"
          :class="
            inputType === 'video'
              ? 'border-sky-400 bg-sky-950 text-sky-200'
              : 'border-slate-700 bg-slate-900 text-slate-400'
          "
          @click="inputType = 'video'; selectedFile = null; errorMessage = ''"
        >
          🎬 VIDEO → FOTOGRAMAS
        </button>
        <button
          type="button"
          class="border-2 py-2 text-xs font-black uppercase"
          :class="
            inputType === 'image'
              ? 'border-emerald-400 bg-emerald-950 text-emerald-200'
              : 'border-slate-700 bg-slate-900 text-slate-400'
          "
          @click="inputType = 'image'; selectedFile = null; errorMessage = ''"
        >
          🖼️ IMAGEN DIRECTA
        </button>
      </div>

      <form class="mt-4 flex flex-col gap-3" @submit.prevent="handleSubmit">
        <!-- Archivo Local -->
        <div>
          <label class="mb-1 block text-[11px] font-bold uppercase text-slate-300">
            {{ inputType === 'video' ? 'Archivo de Video (.mp4, .webm, .mov)' : 'Archivo de Imagen (.png, .jpg, .webp)' }}
          </label>
          <input
            type="file"
            :accept="inputType === 'video' ? 'video/*' : 'image/*'"
            class="w-full border border-slate-600 bg-black/70 p-2 text-xs text-slate-200 file:mr-3 file:border-0 file:bg-sky-800 file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-white"
            @change="handleFileChange"
          />
        </div>

        <!-- URL opcional para imagen directa -->
        <div v-if="inputType === 'image'">
          <label class="mb-1 block text-[11px] font-bold uppercase text-slate-300">
            O URL directa de imagen (si no subes archivo)
          </label>
          <input
            v-model="externalImageUrl"
            type="url"
            placeholder="https://..."
            class="w-full border border-slate-600 bg-black/70 px-2.5 py-1.5 text-xs text-slate-100"
          />
        </div>

        <!-- Cantidad de Fotogramas (solo Video Opción B) -->
        <div v-if="inputType === 'video'">
          <label class="mb-1 block text-[11px] font-bold uppercase text-amber-300">
            Fotogramas clave a extraer (Opción B): {{ frameCount }} frames
          </label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="count in [8, 12, 16, 24]"
              :key="count"
              type="button"
              class="border py-1 text-xs font-bold"
              :class="
                frameCount === count
                  ? 'border-amber-400 bg-amber-950 text-amber-200'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              "
              @click="frameCount = count"
            >
              {{ count }} frames
            </button>
          </div>
          <p class="mt-1 text-[10px] text-slate-400">
            Para videos de ~30s se recomienda 12 o 16 fotogramas (~350 KB totales en memoria).
          </p>
        </div>

        <!-- Título y Metadatos -->
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-[11px] font-bold uppercase text-slate-300">
              Título del Disco
            </label>
            <input
              v-model="title"
              type="text"
              placeholder="Ej. Huracán / CO2 Global"
              class="w-full border border-slate-600 bg-black/70 px-2.5 py-1.5 text-xs text-slate-100"
            />
          </div>

          <div>
            <label class="mb-1 block text-[11px] font-bold uppercase text-slate-300">
              Fuente / Instrumento
            </label>
            <input
              v-model="instrument"
              type="text"
              class="w-full border border-slate-600 bg-black/70 px-2.5 py-1.5 text-xs text-slate-100"
            />
          </div>
        </div>

        <!-- Estrategia de Sonificación y Rareza -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="mb-1 block text-[11px] font-bold uppercase text-slate-300">
              Modo de Sonificación
            </label>
            <select
              v-model="category"
              class="w-full border border-slate-600 bg-black px-2 py-1.5 text-xs uppercase text-sky-200"
            >
              <option v-for="cat in NASA_CATEGORIES" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-[11px] font-bold uppercase text-slate-300">
              Rareza (Capas de Audio)
            </label>
            <select
              v-model="rarity"
              class="w-full border border-slate-600 bg-black px-2 py-1.5 text-xs uppercase text-amber-200"
            >
              <option v-for="(meta, key) in RARITY_CONFIG" :key="key" :value="key">
                {{ meta.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Perfil de Colorbar cuando el tipo es 'maps' -->
        <div v-if="category === 'maps'">
          <label class="mb-1 block text-[11px] font-bold uppercase text-sky-300">
            Perfil de Leyenda (Colorbar ID)
          </label>
          <select
            v-model="mapProfileId"
            class="w-full border border-sky-600 bg-black px-2 py-1.5 text-xs text-sky-200"
          >
            <option
              v-for="(profile, key) in COLORBAR_PROFILES"
              :key="key"
              :value="key"
            >
              {{ key }} — {{ profile.name }}
            </option>
          </select>
        </div>

        <!-- Barra de Progreso de Conversión -->
        <div v-if="isProcessing" class="border border-sky-500/60 bg-black/80 p-2.5">
          <p class="text-[11px] font-bold text-sky-300">
            {{
              inputType === 'video'
                ? `EXTRAYENDO FOTOGRAMAS OPCIÓN B: ${progressCurrent} / ${progressTotal}`
                : 'PROCESANDO IMAGEN...'
            }}
          </p>
          <div class="mt-1.5 h-2.5 w-full bg-slate-800">
            <div
              class="h-full bg-sky-400 transition-all duration-150"
              :style="{
                width:
                  progressTotal > 0
                    ? `${Math.round((progressCurrent / progressTotal) * 100)}%`
                    : '100%',
              }"
            ></div>
          </div>
        </div>

        <p v-if="errorMessage" class="border border-rose-500 bg-rose-950/60 p-2 text-xs text-rose-200">
          {{ errorMessage }}
        </p>

        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            :disabled="isProcessing"
            class="border border-slate-600 bg-slate-900 px-4 py-2 text-xs font-bold uppercase text-slate-300"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isProcessing"
            class="border-2 border-emerald-400 bg-emerald-950 px-4 py-2 text-xs font-black uppercase text-emerald-200 hover:bg-emerald-800 disabled:opacity-50"
          >
            {{
              isProcessing
                ? 'CONVIRTIENDO...'
                : inputType === 'video'
                  ? 'CONVERTIR VIDEO Y AÑADIR'
                  : 'AÑADIR IMAGEN A LA BÓVEDA'
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
