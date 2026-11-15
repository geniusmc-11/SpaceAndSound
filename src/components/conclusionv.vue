<script setup>
import { ref, onUnmounted } from 'vue'

const isPlayingChord = ref(false)
let audioCtx = null
let timeoutId = null

const pilaresConclusion = [
  {
    id: 'inclusion',
    titulo: 'Universal Sensory Accessibility',
    descripcion:
      'Transforming visual data into soundscapes removes the barriers of optical perception, enabling people with blindness or low vision to experience the vastness of the cosmos and the biodiversity of diverse ecosystems.',
  },
  {
    id: 'sonificacion',
    titulo: 'The Jukebox as a Data Bridge',
    descripcion:
      'Reimagining the classic jukebox concept toward image sonification proves that art, science, and web engineering can turn pixels, light spectra, and textures into immersive auditory experiences.',
  },
  {
    id: 'empatia',
    titulo: 'Technology with Human Purpose',
    descripcion:
      'The true value of digital innovation lies not only in its technical complexity, but in its ability to democratize wonder and connect all people with the universe around them.',
  },
]

const reproducirSintesisFinal = () => {
  if (isPlayingChord.value) return

  const AudioContextClass = window.AudioContext || window.webkitAudioContext

  if (!AudioContextClass) return

  if (!audioCtx) {
    audioCtx = new AudioContextClass()
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  isPlayingChord.value = true
  const now = audioCtx.currentTime
  const frecuencias = [261.63, 329.63, 392.0, 493.88, 587.33]

  frecuencias.forEach((freq, index) => {
    if (!audioCtx) return

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()

    osc.type = index % 2 === 0 ? 'sine' : 'triangle'
    osc.frequency.setValueAtTime(freq, now + index * 0.12)

    gain.gain.setValueAtTime(0.001, now + index * 0.12)
    gain.gain.exponentialRampToValueAtTime(0.06, now + index * 0.12 + 0.4)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2)

    osc.connect(gain)
    gain.connect(audioCtx.destination)

    osc.start(now + index * 0.12)
    osc.stop(now + 3.3)
  })

  timeoutId = setTimeout(() => {
    isPlayingChord.value = false
  }, 3300)
}

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  if (audioCtx && audioCtx.state !== 'closed') {
    audioCtx.close()
  }
})
</script>

<template>
  <section
    aria-labelledby="conclusion-title"
    class="border-t border-[#31515A] bg-[#101820] px-6 py-[4.5rem] font-sans text-[#E7D5AC]"
  >
    <div class="mx-auto flex max-w-[1040px] flex-col gap-11">
      <div class="max-w-[780px]">
        <span
          aria-hidden="true"
          class="mb-4 inline-block rounded-full border border-[#31515A] bg-[#1D303B] px-3.5 py-1.5 text-xs font-bold tracking-widest text-[#D18C39] uppercase"
        >
          Project Finale
        </span>
        <h2
          id="conclusion-title"
          class="mb-5 text-3xl leading-tight font-extrabold text-[#E7D5AC] sm:text-4xl lg:text-[2.65rem]"
        >
          Conclusion: Listening to the Invisible
        </h2>
        <p class="text-lg leading-relaxed text-[#E7D5AC]/85">
          This project demonstrates that the modern web can transcend the purely visual. By merging
          the interactive nostalgia of a
          <strong class="font-semibold text-[#D18C39]">jukebox</strong> with
          <strong class="font-semibold text-[#D18C39]">image sonification</strong> algorithms, we
          translate the silent beauty of outer space and Earth's ecosystems into a universal
          language: sound.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-3" role="list">
        <div
          v-for="pilar in pilaresConclusion"
          :key="pilar.id"
          role="listitem"
          tabindex="0"
          class="rounded-2xl border border-[#31515A] bg-[#1D303B] p-7 transition-all duration-200 hover:-translate-y-1 hover:border-[#D18C39] hover:shadow-[0_12px_28px_-10px_rgba(209,140,57,0.25)] focus-visible:-translate-y-1 focus-visible:border-[#D18C39] focus-visible:ring-2 focus-visible:ring-[#D18C39] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101820] focus-visible:outline-none"
        >
          <h3 class="mb-3 text-xl font-bold text-[#E7D5AC]">
            {{ pilar.titulo }}
          </h3>
          <p class="text-[0.98rem] leading-relaxed text-[#E7D5AC]/80">
            {{ pilar.descripcion }}
          </p>
        </div>
      </div>

      <div
        class="rounded-r-xl border border-l-4 border-[#31515A] border-l-[#D18C39] bg-[#1D303B]/80 px-8 py-6"
      >
        <p class="m-0 text-lg leading-relaxed text-[#E7D5AC] italic">
          “When we design with those who perceive the world differently in mind, we don't just build
          accessible software; we expand the senses of all humanity.”
        </p>
      </div>

      <div class="flex items-center justify-start">
        <button
          type="button"
          :disabled="isPlayingChord"
          :aria-pressed="isPlayingChord"
          aria-label="Play closing harmonic chord"
          class="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-[#31515A] bg-[#D18C39] px-6 py-3.5 text-base font-bold text-[#101820] transition-all duration-200 enabled:hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#E7D5AC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101820] focus-visible:outline-none disabled:cursor-wait disabled:opacity-85"
          @click="reproducirSintesisFinal"
        >
          <span
            aria-hidden="true"
            class="h-2.5 w-2.5 rounded-full bg-[#101820] transition-all duration-300"
            :class="
              isPlayingChord
                ? 'scale-125 animate-pulse shadow-[0_0_10px_#101820]'
                : 'opacity-75'
            "
          ></span>
          {{ isPlayingChord ? 'Synthesizing soundscape...' : 'Listen to closing echo' }}
        </button>
        <span class="sr-only" aria-live="polite">
          {{ isPlayingChord ? 'Playing spatial closing sound synthesis.' : '' }}
        </span>
      </div>
    </div>
  </section>
</template>
