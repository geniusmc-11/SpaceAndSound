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

const inputType = ref('video') // 'video' (Option B) | 'image' (Direct)
const title = ref('')
const instrument = ref('NASA / User Dataset')
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
      errorMessage.value = 'Please select a video file (.mp4, .webm, .mov).'
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
      errorMessage.value = err?.message || 'Error converting video to frames.'
    } finally {
      isProcessing.value = false
    }
  } else {
    // Direct Image (File or URL)
    const source = selectedFile.value || externalImageUrl.value.trim()
    if (!source) {
      errorMessage.value = 'Select a local image or paste a CORS-enabled image URL.'
      return
    }

    isProcessing.value = true
    try {
      const result = await convertImageToDirectDiscMedia(source)
      const newDisc = buildDiscRecord({
        title: title.value || (selectedFile.value?.name ?? 'Direct NASA Image'),
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
      errorMessage.value = err?.message || 'Could not load the image.'
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
    <div class="w-full max-w-lg border-2 border-[#D18C39] bg-[#101820] p-5 text-[#E7D5AC] shadow-[6px_6px_0px_#000]">
      <div class="flex items-center justify-between border-b border-[#31515A] pb-3">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-widest text-[#D18C39]">
            MULTIMEDIA IMPORTER // OPTION B
          </p>
          <h2 class="text-base font-black uppercase text-[#E7D5AC]">
            ADD VIDEO (TO FRAMES) OR IMAGE
          </h2>
        </div>
        <button
          type="button"
          :disabled="isProcessing"
          class="border border-[#31515A] bg-[#1D303B] px-2 py-1 text-xs font-bold text-[#E7D5AC] hover:border-[#D18C39]"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Type Selector: Video -> Option B vs Direct Image -->
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          class="border-2 py-2 text-xs font-black uppercase"
          :class="
            inputType === 'video'
              ? 'border-[#D18C39] bg-[#D18C39] text-[#101820]'
              : 'border-[#31515A] bg-[#1D303B] text-[#E7D5AC]/75'
          "
          @click="inputType = 'video'; selectedFile = null; errorMessage = ''"
        >
          🎬 VIDEO → FRAMES
        </button>
        <button
          type="button"
          class="border-2 py-2 text-xs font-black uppercase"
          :class="
            inputType === 'image'
              ? 'border-[#D18C39] bg-[#D18C39] text-[#101820]'
              : 'border-[#31515A] bg-[#1D303B] text-[#E7D5AC]/75'
          "
          @click="inputType = 'image'; selectedFile = null; errorMessage = ''"
        >
          🖼️ DIRECT IMAGE
        </button>
      </div>

      <form class="mt-4 flex flex-col gap-3" @submit.prevent="handleSubmit">
        <!-- Local File -->
        <div>
          <label class="mb-1 block text-[11px] font-bold uppercase text-[#E7D5AC]">
            {{ inputType === 'video' ? 'Video File (.mp4, .webm, .mov)' : 'Image File (.png, .jpg, .webp)' }}
          </label>
          <input
            type="file"
            :accept="inputType === 'video' ? 'video/*' : 'image/*'"
            class="w-full border border-[#31515A] bg-[#1D303B] p-2 text-xs text-[#E7D5AC] file:mr-3 file:border-0 file:bg-[#D18C39] file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-[#101820]"
            @change="handleFileChange"
          />
        </div>

        <!-- Optional URL for direct image -->
        <div v-if="inputType === 'image'">
          <label class="mb-1 block text-[11px] font-bold uppercase text-[#E7D5AC]">
            Or direct image URL (if not uploading a file)
          </label>
          <input
            v-model="externalImageUrl"
            type="url"
            placeholder="https://..."
            class="w-full border border-[#31515A] bg-[#1D303B] px-2.5 py-1.5 text-xs text-[#E7D5AC]"
          />
        </div>

        <!-- Keyframe Count (Video Option B only) -->
        <div v-if="inputType === 'video'">
          <label class="mb-1 block text-[11px] font-bold uppercase text-[#D18C39]">
            Keyframes to extract (Option B): {{ frameCount }} frames
          </label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="count in [8, 12, 16, 24]"
              :key="count"
              type="button"
              class="border py-1 text-xs font-bold"
              :class="
                frameCount === count
                  ? 'border-[#D18C39] bg-[#D18C39] text-[#101820]'
                  : 'border-[#31515A] bg-[#1D303B] text-[#E7D5AC]/70'
              "
              @click="frameCount = count"
            >
              {{ count }} frames
            </button>
          </div>
          <p class="mt-1 text-[10px] text-[#E7D5AC]/65">
            For ~30s videos, 12 or 16 frames are recommended (~350 KB total in memory).
          </p>
        </div>

        <!-- Title and Metadata -->
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-[11px] font-bold uppercase text-[#E7D5AC]">
              Disc Title
            </label>
            <input
              v-model="title"
              type="text"
              placeholder="e.g. Hurricane / Global CO2"
              class="w-full border border-[#31515A] bg-[#1D303B] px-2.5 py-1.5 text-xs text-[#E7D5AC]"
            />
          </div>

          <div>
            <label class="mb-1 block text-[11px] font-bold uppercase text-[#E7D5AC]">
              Source / Instrument
            </label>
            <input
              v-model="instrument"
              type="text"
              class="w-full border border-[#31515A] bg-[#1D303B] px-2.5 py-1.5 text-xs text-[#E7D5AC]"
            />
          </div>
        </div>

        <!-- Sonification Strategy and Rarity -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="mb-1 block text-[11px] font-bold uppercase text-[#E7D5AC]">
              Sonification Mode
            </label>
            <select
              v-model="category"
              class="w-full border border-[#31515A] bg-[#1D303B] px-2 py-1.5 text-xs uppercase text-[#E7D5AC]"
            >
              <option v-for="cat in NASA_CATEGORIES" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-[11px] font-bold uppercase text-[#E7D5AC]">
              Rarity (Audio Layers)
            </label>
            <select
              v-model="rarity"
              class="w-full border border-[#31515A] bg-[#1D303B] px-2 py-1.5 text-xs uppercase text-[#D18C39]"
            >
              <option v-for="(meta, key) in RARITY_CONFIG" :key="key" :value="key">
                {{ meta.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Colorbar Profile when mode is 'maps' -->
        <div v-if="category === 'maps'">
          <label class="mb-1 block text-[11px] font-bold uppercase text-[#D18C39]">
            Legend Profile (Colorbar ID)
          </label>
          <select
            v-model="mapProfileId"
            class="w-full border border-[#31515A] bg-[#1D303B] px-2 py-1.5 text-xs text-[#E7D5AC]"
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

        <!-- Conversion Progress Bar -->
        <div v-if="isProcessing" class="border border-[#D18C39] bg-[#1D303B] p-2.5">
          <p class="text-[11px] font-bold text-[#D18C39]">
            {{
              inputType === 'video'
                ? `EXTRACTING OPTION B FRAMES: ${progressCurrent} / ${progressTotal}`
                : 'PROCESSING IMAGE...'
            }}
          </p>
          <div class="mt-1.5 h-2.5 w-full bg-[#101820]">
            <div
              class="h-full bg-[#D18C39] transition-all duration-150"
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
            class="border border-[#31515A] bg-[#1D303B] px-4 py-2 text-xs font-bold uppercase text-[#E7D5AC]"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isProcessing"
            class="border-2 border-[#31515A] bg-[#D18C39] px-4 py-2 text-xs font-black uppercase text-[#101820] hover:brightness-110 disabled:opacity-50"
          >
            {{
              isProcessing
                ? 'CONVERTING...'
                : inputType === 'video'
                  ? 'CONVERT VIDEO & ADD'
                  : 'ADD IMAGE TO VAULT'
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
