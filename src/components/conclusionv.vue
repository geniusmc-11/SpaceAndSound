<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

interface PilarConclusion {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
}

const isPlayingChord = ref<boolean>(false);
let audioCtx: AudioContext | null = null;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

const pilaresConclusion: PilarConclusion[] = [
  {
    id: 'inclusion',
    codigo: '',
    titulo: 'Universal Sensory Accessibility',
    descripcion:
      'Transforming visual data into soundscapes removes the barriers of optical perception, allowing people who are blind or have low vision to experience the vastness of the cosmos and the biodiversity of different ecosystems.'
  },
  {
    id: 'sonificacion',
    codigo: '',
    titulo: 'The Jukebox as a Data Bridge',
    descripcion:
      'Reinterpreting the classic jukebox concept toward image sonification demonstrates that art, science, and web engineering can transform pixels, light spectra, and textures into immersive auditory experiences.'
  },
  {
    id: 'empatia',
    codigo: '',
    titulo: 'Technology with Human Purpose',
    descripcion:
      'The true value of digital innovation lies not merely in its technical complexity, but in its ability to democratize wonder and connect all people with the environment around them.'
  }
];

const reproducirSintesisFinal = (): void => {
  if (isPlayingChord.value) return;

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) return;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  isPlayingChord.value = true;
  const now = audioCtx.currentTime;
  const frecuencias: number[] = [261.63, 329.63, 392.0, 493.88, 587.33];

  frecuencias.forEach((freq, index) => {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = index % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now + index * 0.12);

    gain.gain.setValueAtTime(0.001, now + index * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.06, now + index * 0.12 + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now + index * 0.12);
    osc.stop(now + 3.3);
  });

  timeoutId = setTimeout(() => {
    isPlayingChord.value = false;
  }, 3300);
};

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  if (audioCtx && audioCtx.state !== 'closed') {
    audioCtx.close();
  }
});
</script>

<template>
  <section
    aria-labelledby="conclusion-title"
    class="relative overflow-hidden bg-[#101820] px-6 py-20 font-sans text-[#E7D5AC] sm:py-24"
  >
    <!-- Deep starfield (visible stars with soft halos that preserve readability) -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_28%_22%,rgba(0,0,0,0.45)_15%,black_75%)]"
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        class="h-full w-full"
      >
        <!-- Layer 1: Medium-high brightness beige stars -->
        <g class="star-twinkle-1 motion-reduce:animate-none" fill="#E7D5AC">
          <circle cx="95" cy="78" r="1.7" opacity="0.9" />
          <circle cx="95" cy="78" r="4.5" opacity="0.16" />

          <circle cx="260" cy="145" r="1.3" opacity="0.75" />
          <circle cx="445" cy="68" r="1.8" opacity="0.9" />
          <circle cx="670" cy="112" r="1.4" opacity="0.8" />
          <circle cx="890" cy="54" r="1.9" opacity="0.95" />
          <circle cx="890" cy="54" r="5" opacity="0.18" />

          <circle cx="1120" cy="128" r="1.5" opacity="0.85" />
          <circle cx="1335" cy="84" r="2" opacity="0.95" />
          <circle cx="1335" cy="84" r="5.5" opacity="0.2" />

          <circle cx="140" cy="360" r="1.6" opacity="0.85" />
          <circle cx="520" cy="325" r="1.5" opacity="0.8" />
          <circle cx="980" cy="340" r="1.8" opacity="0.9" />
          <circle cx="1290" cy="390" r="1.6" opacity="0.85" />

          <circle cx="82" cy="640" r="1.9" opacity="0.9" />
          <circle cx="82" cy="640" r="5" opacity="0.18" />

          <circle cx="410" cy="615" r="1.5" opacity="0.8" />
          <circle cx="780" cy="655" r="1.7" opacity="0.85" />
          <circle cx="1165" cy="620" r="1.9" opacity="0.9" />
          <circle cx="1375" cy="710" r="1.6" opacity="0.85" />
          <circle cx="245" cy="835" r="1.8" opacity="0.9" />
          <circle cx="920" cy="845" r="1.7" opacity="0.85" />
        </g>

        <!-- Layer 2: Staggered secondary stars -->
        <g class="star-twinkle-2 motion-reduce:animate-none" fill="#E7D5AC">
          <circle cx="180" cy="230" r="1.2" opacity="0.7" />
          <circle cx="355" cy="195" r="1.4" opacity="0.75" />
          <circle cx="585" cy="185" r="1.2" opacity="0.65" />
          <circle cx="795" cy="175" r="1.5" opacity="0.8" />
          <circle cx="1015" cy="215" r="1.3" opacity="0.75" />
          <circle cx="1225" cy="245" r="1.6" opacity="0.85" />

          <circle cx="315" cy="475" r="1.4" opacity="0.75" />
          <circle cx="715" cy="490" r="1.3" opacity="0.7" />
          <circle cx="1085" cy="480" r="1.5" opacity="0.8" />

          <circle cx="165" cy="755" r="1.4" opacity="0.75" />
          <circle cx="560" cy="735" r="1.6" opacity="0.85" />
          <circle cx="845" cy="760" r="1.3" opacity="0.7" />
          <circle cx="1055" cy="785" r="1.5" opacity="0.8" />
          <circle cx="1275" cy="830" r="1.7" opacity="0.85" />
        </g>

        <!-- Layer 3: Warm amber stars and 4-point sparkles -->
        <g class="star-twinkle-3 motion-reduce:animate-none" fill="#D18C39">
          <circle cx="320" cy="95" r="1.7" opacity="0.9" />
          <circle cx="320" cy="95" r="4.5" opacity="0.2" />

          <circle cx="1045" cy="82" r="1.8" opacity="0.9" />
          <circle cx="1210" cy="165" r="1.5" opacity="0.8" />
          <circle cx="70" cy="495" r="1.8" opacity="0.9" />
          <circle cx="640" cy="605" r="1.6" opacity="0.85" />
          <circle cx="1360" cy="545" r="1.9" opacity="0.95" />
          <circle cx="1360" cy="545" r="5.5" opacity="0.22" />

          <circle cx="475" cy="855" r="1.7" opacity="0.85" />
          <circle cx="1135" cy="860" r="1.6" opacity="0.8" />

          <!-- 4-point star sparkles -->
          <path
            d="M1265 56 L1267.2 64.8 L1276 67 L1267.2 69.2 L1265 78 L1262.8 69.2 L1254 67 L1262.8 64.8 Z"
            opacity="0.9"
          />
          <path
            d="M115 715 L116.8 722.2 L124 724 L116.8 725.8 L115 733 L113.2 725.8 L106 724 L113.2 722.2 Z"
            opacity="0.85"
          />
          <path
            d="M955 595 L956.5 601 L962.5 602.5 L956.5 604 L955 610 L953.5 604 L947.5 602.5 L953.5 601 Z"
            fill="#E7D5AC"
            opacity="0.85"
          />
        </g>
      </svg>
    </div>

    <!-- Subtle background glows to add depth to the glass -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute top-1/3 left-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-[#31515A]/20 blur-3xl"
    ></div>
    <div
      aria-hidden="true"
      class="pointer-events-none absolute right-1/4 bottom-12 h-64 w-64 translate-x-1/2 rounded-full bg-[#D18C39]/12 blur-3xl"
    ></div>

    <div class="relative z-10 mx-auto flex max-w-[1040px] flex-col gap-14">
      <!-- Clean editorial header (no heavy boxes or tags) -->
      <div class="max-w-[760px]">
        <div
          aria-hidden="true"
          class="mb-3 flex flex-wrap items-center gap-2.5 font-mono text-xs tracking-widest uppercase"
        >
          <span class="font-bold text-[#D18C39]">Project Closing</span>
          <span class="text-[#31515A]">/</span>
          <span class="text-[#E7D5AC]/55">LOG // FINAL-SONIFICATION</span>
        </div>

        <h2
          id="conclusion-title"
          class="mb-5 text-3xl leading-tight font-extrabold tracking-tight text-[#E7D5AC] sm:text-4xl lg:text-[2.55rem]"
        >
          Conclusion: <span class="text-[#D18C39]">Hearing the Invisible</span>
        </h2>

        <p class="text-base leading-relaxed text-[#E7D5AC]/80 sm:text-lg">
          This project demonstrates that the modern web can transcend the purely visual. By fusing
          the interactive nostalgia of a
          <strong class="font-semibold text-[#D18C39]">jukebox</strong> with
          <strong class="font-semibold text-[#D18C39]">image sonification</strong> algorithms, we
          succeed in translating the silent beauty of outer space and terrestrial ecosystems into a
          universal language: sound.
        </p>
      </div>

      <!-- Minimalist text cards with hover reactivity -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3" role="list">
        <div
          v-for="pilar in pilaresConclusion"
          :key="pilar.id"
          role="listitem"
          tabindex="0"
          class="group rounded-2xl border border-[#31515A]/55 bg-[#1D303B]/25 p-7 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-[#D18C39] hover:bg-[#1D303B]/60 hover:shadow-[0_14px_32px_-10px_rgba(209,140,57,0.22)] focus-visible:-translate-y-1.5 focus-visible:border-[#D18C39] focus-visible:bg-[#1D303B]/60 focus-visible:ring-2 focus-visible:ring-[#D18C39] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101820] focus-visible:outline-none"
        >
          <span
            v-if="pilar.codigo"
            aria-hidden="true"
            class="mb-3 block font-mono text-[0.7rem] font-semibold tracking-widest text-[#D18C39]/80 transition-colors duration-200 group-hover:text-[#D18C39]"
          >
            {{ pilar.codigo }}
          </span>

          <h3
            class="mb-3 text-lg font-bold text-[#E7D5AC] transition-colors duration-200 group-hover:text-white sm:text-xl"
          >
            {{ pilar.titulo }}
          </h3>

          <p
            class="text-sm leading-relaxed text-[#E7D5AC]/75 transition-colors duration-200 group-hover:text-[#E7D5AC]/90 sm:text-[0.96rem]"
          >
            {{ pilar.descripcion }}
          </p>
        </div>
      </div>

      <!-- Quote zone (featured with amber accent and glassmorphism) -->
      <div
        class="rounded-2xl border border-[#31515A]/60 border-l-4 border-l-[#D18C39] bg-[#1D303B]/40 px-7 py-6 shadow-[inset_0_1px_0_rgba(231,213,172,0.12)] backdrop-blur-xl sm:px-9 sm:py-7"
      >
        <span
          aria-hidden="true"
          class="mb-2 block font-mono text-[0.68rem] font-semibold tracking-[0.2em] text-[#D18C39] uppercase"
        >
          Final Transmission // Design Principle
        </span>
        <p class="m-0 text-base leading-relaxed text-[#E7D5AC] italic sm:text-lg">
          “When we design with those who perceive the world differently in mind, we don't just build
          accessible software; we expand the senses of all humanity.”
        </p>
      </div>

      <!-- Sound zone (clean glass capsule synced with Header/Footer) -->
      <div
        class="flex flex-col items-start justify-between gap-5 rounded-2xl border border-[#31515A]/70 border-t-[#E7D5AC]/20 bg-[#1D303B]/40 p-5 shadow-[inset_0_1px_1px_rgba(231,213,172,0.16),0_16px_36px_rgba(0,0,0,0.45)] backdrop-blur-xl backdrop-saturate-150 sm:flex-row sm:items-center sm:rounded-full sm:px-7 sm:py-4"
      >
        <div class="flex items-center gap-4">
          <!-- Spinning mini record -->
          <div
            aria-hidden="true"
            class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#31515A] bg-[#101820]/80 transition-colors duration-300"
            :class="isPlayingChord ? 'animate-spin border-[#D18C39]' : ''"
          >
            <span class="h-7 w-7 rounded-full border border-[#E7D5AC]/15"></span>
            <span class="absolute h-3 w-3 rounded-full bg-[#D18C39]"></span>
            <span class="absolute h-1 w-1 rounded-full bg-[#101820]"></span>
          </div>

          <div class="flex flex-col">
            <span class="font-mono text-xs font-bold tracking-wider text-[#D18C39] uppercase">
              {{ isPlayingChord ? 'Active Signal // 432-587 Hz' : 'Synthesizer on Standby' }}
            </span>
            <span class="text-xs text-[#E7D5AC]/75 sm:text-sm">
              Closing spatial harmonic chord (Web Audio API)
            </span>
          </div>
        </div>

        <div class="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
          <!-- Minimalist frequency bars -->
          <div aria-hidden="true" class="flex h-5 items-end gap-1 px-1">
            <span
              class="w-1 rounded-full transition-all duration-300"
              :class="isPlayingChord ? 'h-3.5 animate-pulse bg-[#D18C39]' : 'h-1.5 bg-[#31515A]'"
            ></span>
            <span
              class="w-1 rounded-full transition-all duration-300"
              :class="isPlayingChord ? 'h-5 animate-bounce bg-[#D18C39]' : 'h-2.5 bg-[#31515A]'"
            ></span>
            <span
              class="w-1 rounded-full transition-all duration-300"
              :class="isPlayingChord ? 'h-4 animate-pulse bg-[#E7D5AC]' : 'h-3 bg-[#31515A]'"
            ></span>
            <span
              class="w-1 rounded-full transition-all duration-300"
              :class="isPlayingChord ? 'h-5 animate-bounce bg-[#D18C39]' : 'h-2 bg-[#31515A]'"
            ></span>
            <span
              class="w-1 rounded-full transition-all duration-300"
              :class="isPlayingChord ? 'h-3 animate-pulse bg-[#D18C39]' : 'h-1.5 bg-[#31515A]'"
            ></span>
          </div>

          <button
            type="button"
            :disabled="isPlayingChord"
            :aria-pressed="isPlayingChord"
            aria-label="Play closing harmonic chord of the project"
            class="inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-[#E7D5AC]/20 bg-[#D18C39] px-6 py-3 text-sm font-extrabold tracking-wide text-[#101820] shadow-[0_0_20px_rgba(209,140,57,0.25)] transition-all duration-200 enabled:hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#E7D5AC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101820] focus-visible:outline-none disabled:cursor-wait disabled:opacity-90"
            @click="reproducirSintesisFinal"
          >
            <span
              aria-hidden="true"
              class="h-2 w-2 rounded-full bg-[#101820]"
              :class="isPlayingChord ? 'animate-ping' : 'opacity-80'"
            ></span>
            {{ isPlayingChord ? 'Synthesizing soundscape...' : 'Listen to closing echo' }}
          </button>
        </div>

        <span class="sr-only" aria-live="polite">
          {{ isPlayingChord ? 'Playing closing spatial sound synthesis.' : '' }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes star-twinkle {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}

.star-twinkle-1 {
  animation: star-twinkle 4.2s ease-in-out infinite;
}

.star-twinkle-2 {
  animation: star-twinkle 5.8s ease-in-out infinite 1.7s;
}

.star-twinkle-3 {
  animation: star-twinkle 4.9s ease-in-out infinite 0.8s;
}
</style>