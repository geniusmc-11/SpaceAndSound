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
    <!-- Deep starfield, distant galaxies, orbital arcs & shooting stars -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_28%_22%,rgba(0,0,0,0.62)_15%,black_80%)]"
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        class="h-full w-full"
      >
        <defs>
          <!-- Soft star glow -->
          <filter id="conclusion-star-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <!-- Lightweight radial gradients for galaxies (zero blur overhead) -->
          <radialGradient id="galaxy-halo-amber" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#E7D5AC" stop-opacity="0.85" />
            <stop offset="22%" stop-color="#D18C39" stop-opacity="0.42" />
            <stop offset="58%" stop-color="#31515A" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#101820" stop-opacity="0" />
          </radialGradient>

          <radialGradient id="galaxy-halo-teal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#E7D5AC" stop-opacity="0.75" />
            <stop offset="30%" stop-color="#31515A" stop-opacity="0.45" />
            <stop offset="68%" stop-color="#1D303B" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#101820" stop-opacity="0" />
          </radialGradient>

          <linearGradient id="conclusion-meteor-beige" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E7D5AC" stop-opacity="0" />
            <stop offset="75%" stop-color="#E7D5AC" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.95" />
          </linearGradient>

          <linearGradient id="conclusion-meteor-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#D18C39" stop-opacity="0" />
            <stop offset="70%" stop-color="#D18C39" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#E7D5AC" stop-opacity="0.9" />
          </linearGradient>
        </defs>

        <!-- Subtle celestial orbital arcs -->
        <g opacity="0.2" stroke="#E7D5AC" fill="none">
          <circle cx="1340" cy="80" r="190" stroke-width="0.7" stroke-dasharray="3 7" />
          <circle cx="1340" cy="80" r="295" stroke-width="0.5" stroke-dasharray="1 9" />
          <circle cx="90" cy="830" r="175" stroke-width="0.6" stroke-dasharray="2 8" />
        </g>

        <!-- Distant Galaxies -->
        <g class="galaxy-pulse motion-reduce:animate-none">
          <!-- 1. Tilted Spiral Galaxy (Upper-right quadrant) -->
          <g transform="translate(1195, 205) rotate(-26)">
            <ellipse cx="0" cy="0" rx="76" ry="28" fill="url(#galaxy-halo-amber)" />
            <ellipse cx="0" cy="0" rx="34" ry="12" fill="url(#galaxy-halo-teal)" />
            <!-- Spiral arms -->
            <path
              d="M -6 -2 C -26 -14, -56 -8, -64 4 C -48 12, -20 9, 0 2"
              fill="none"
              stroke="#E7D5AC"
              stroke-width="1.1"
              stroke-linecap="round"
              opacity="0.45"
            />
            <path
              d="M 6 2 C 26 14, 56 8, 64 -4 C 48 -12, 20 -9, 0 -2"
              fill="none"
              stroke="#D18C39"
              stroke-width="1.1"
              stroke-linecap="round"
              opacity="0.5"
            />
            <path
              d="M -14 6 C -38 15, -58 10, -68 2"
              fill="none"
              stroke="#31515A"
              stroke-width="1.4"
              stroke-linecap="round"
              opacity="0.6"
            />
            <!-- Galactic core -->
            <circle cx="0" cy="0" r="2.4" fill="#E7D5AC" />
            <circle cx="-38" cy="-5" r="0.9" fill="#E7D5AC" opacity="0.7" />
            <circle cx="42" cy="4" r="0.9" fill="#D18C39" opacity="0.75" />
          </g>

          <!-- 2. Edge-on Lenticular Galaxy with dust lane (Mid-left) -->
          <g transform="translate(175, 535) rotate(22)">
            <ellipse cx="0" cy="0" rx="72" ry="14" fill="url(#galaxy-halo-teal)" />
            <ellipse cx="0" cy="0" rx="28" ry="8" fill="url(#galaxy-halo-amber)" />
            <!-- Dark cosmic dust lane -->
            <line
              x1="-52"
              y1="0.8"
              x2="52"
              y2="-0.8"
              stroke="#101820"
              stroke-width="1.5"
              stroke-linecap="round"
              opacity="0.65"
            />
            <circle cx="0" cy="0" r="2" fill="#E7D5AC" opacity="0.9" />
          </g>

          <!-- 3. Compact Distant Spiral Galaxy (Lower-right) -->
          <g transform="translate(1285, 765) rotate(34)">
            <ellipse cx="0" cy="0" rx="48" ry="18" fill="url(#galaxy-halo-amber)" opacity="0.85" />
            <path
              d="M -4 -1 C -18 -9, -36 -5, -41 3"
              fill="none"
              stroke="#E7D5AC"
              stroke-width="0.9"
              stroke-linecap="round"
              opacity="0.4"
            />
            <path
              d="M 4 1 C 18 9, 36 5, 41 -3"
              fill="none"
              stroke="#D18C39"
              stroke-width="0.9"
              stroke-linecap="round"
              opacity="0.45"
            />
            <circle cx="0" cy="0" r="1.7" fill="#E7D5AC" />
          </g>
        </g>

        <!-- Layer 1: High-luminance beige stars -->
        <g class="star-twinkle-1 motion-reduce:animate-none" fill="#E7D5AC">
          <circle cx="95" cy="78" r="1.9" filter="url(#conclusion-star-glow)" />
          <circle cx="95" cy="78" r="5" opacity="0.2" />

          <circle cx="260" cy="145" r="1.4" opacity="0.8" />
          <circle cx="445" cy="68" r="2" filter="url(#conclusion-star-glow)" />
          <circle cx="670" cy="112" r="1.5" opacity="0.85" />
          <circle cx="890" cy="54" r="2.1" filter="url(#conclusion-star-glow)" />
          <circle cx="890" cy="54" r="5.5" opacity="0.22" />

          <circle cx="1120" cy="128" r="1.6" opacity="0.9" />
          <circle cx="1335" cy="84" r="2.2" filter="url(#conclusion-star-glow)" />
          <circle cx="1335" cy="84" r="6" opacity="0.24" />

          <circle cx="140" cy="360" r="1.7" opacity="0.9" />
          <circle cx="520" cy="325" r="1.6" opacity="0.85" />
          <circle cx="980" cy="340" r="1.9" filter="url(#conclusion-star-glow)" />
          <circle cx="1290" cy="390" r="1.7" opacity="0.9" />

          <circle cx="82" cy="640" r="2.1" filter="url(#conclusion-star-glow)" />
          <circle cx="82" cy="640" r="5.5" opacity="0.22" />

          <circle cx="410" cy="615" r="1.6" opacity="0.85" />
          <circle cx="780" cy="655" r="1.8" filter="url(#conclusion-star-glow)" />
          <circle cx="1165" cy="620" r="2" filter="url(#conclusion-star-glow)" />
          <circle cx="1375" cy="710" r="1.7" opacity="0.9" />
          <circle cx="245" cy="835" r="1.9" filter="url(#conclusion-star-glow)" />
          <circle cx="920" cy="845" r="1.8" opacity="0.9" />
        </g>

        <!-- Layer 2: Staggered secondary stars -->
        <g class="star-twinkle-2 motion-reduce:animate-none" fill="#E7D5AC">
          <circle cx="180" cy="230" r="1.3" opacity="0.75" />
          <circle cx="355" cy="195" r="1.5" opacity="0.85" />
          <circle cx="585" cy="185" r="1.3" opacity="0.7" />
          <circle cx="795" cy="175" r="1.6" opacity="0.85" />
          <circle cx="1015" cy="215" r="1.4" opacity="0.8" />
          <circle cx="1225" cy="245" r="1.7" filter="url(#conclusion-star-glow)" />

          <circle cx="315" cy="475" r="1.5" opacity="0.8" />
          <circle cx="715" cy="490" r="1.4" opacity="0.75" />
          <circle cx="1085" cy="480" r="1.6" opacity="0.85" />
          <circle cx="475" cy="275" r="1.2" opacity="0.7" />
          <circle cx="885" cy="285" r="1.3" opacity="0.75" />

          <circle cx="165" cy="755" r="1.5" opacity="0.8" />
          <circle cx="560" cy="735" r="1.7" filter="url(#conclusion-star-glow)" />
          <circle cx="845" cy="760" r="1.4" opacity="0.75" />
          <circle cx="1055" cy="785" r="1.6" opacity="0.85" />
          <circle cx="1275" cy="830" r="1.8" filter="url(#conclusion-star-glow)" />
        </g>

        <!-- Layer 3: Warm amber stars and glowing 4-point sparkles -->
        <g class="star-twinkle-3 motion-reduce:animate-none" fill="#D18C39">
          <circle cx="320" cy="95" r="1.9" filter="url(#conclusion-star-glow)" />
          <circle cx="320" cy="95" r="5" opacity="0.24" />

          <circle cx="1045" cy="82" r="2" filter="url(#conclusion-star-glow)" />
          <circle cx="1210" cy="165" r="1.6" opacity="0.85" />
          <circle cx="70" cy="495" r="2" filter="url(#conclusion-star-glow)" />
          <circle cx="640" cy="605" r="1.7" opacity="0.9" />
          <circle cx="1360" cy="545" r="2.1" filter="url(#conclusion-star-glow)" />
          <circle cx="1360" cy="545" r="6" opacity="0.25" />

          <circle cx="475" cy="855" r="1.8" filter="url(#conclusion-star-glow)" />
          <circle cx="1135" cy="860" r="1.7" opacity="0.85" />

          <!-- 4-point star sparkles -->
          <path
            d="M1265 54 L1267.5 64.5 L1278 67 L1267.5 69.5 L1265 80 L1262.5 69.5 L1252 67 L1262.5 64.5 Z"
            filter="url(#conclusion-star-glow)"
          />
          <path
            d="M115 713 L117 721.5 L125.5 723.5 L117 725.5 L115 734 L113 725.5 L104.5 723.5 L113 721.5 Z"
            filter="url(#conclusion-star-glow)"
          />
          <path
            d="M955 593 L956.8 600.2 L964 602 L956.8 603.8 L955 611 L953.2 603.8 L946 602 L953.2 600.2 Z"
            fill="#E7D5AC"
            filter="url(#conclusion-star-glow)"
          />
          <path
            d="M720 42 L721.4 47.6 L727 49 L721.4 50.4 L720 56 L718.6 50.4 L713 49 L718.6 47.6 Z"
            fill="#E7D5AC"
            opacity="0.9"
          />
        </g>

        <!-- Floating cosmic dust fluctuations -->
        <g class="dust-float motion-reduce:animate-none" fill="#E7D5AC" opacity="0.5">
          <circle cx="210" cy="290" r="1.1" />
          <circle cx="490" cy="430" r="1.2" fill="#D18C39" />
          <circle cx="760" cy="260" r="1" />
          <circle cx="1140" cy="330" r="1.2" fill="#D18C39" />
          <circle cx="340" cy="710" r="1.1" />
          <circle cx="990" cy="705" r="1.1" fill="#D18C39" />
        </g>

        <!-- Periodic shooting stars -->
        <g class="shooting-star-1 motion-reduce:hidden">
          <line
            x1="460"
            y1="35"
            x2="565"
            y2="88"
            stroke="url(#conclusion-meteor-beige)"
            stroke-width="1.6"
            stroke-linecap="round"
          />
          <circle cx="565" cy="88" r="1.8" fill="#FFFFFF" filter="url(#conclusion-star-glow)" />
        </g>

        <g class="shooting-star-2 motion-reduce:hidden">
          <line
            x1="1030"
            y1="520"
            x2="1125"
            y2="568"
            stroke="url(#conclusion-meteor-amber)"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <circle cx="1125" cy="568" r="1.6" fill="#E7D5AC" filter="url(#conclusion-star-glow)" />
        </g>
      </svg>
    </div>

    <!-- Fluctuating cosmic nebula glows -->
    <div
      aria-hidden="true"
      class="nebula-drift-1 pointer-events-none absolute top-1/4 left-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-[#31515A]/25 blur-3xl motion-reduce:animate-none"
    ></div>
    <div
      aria-hidden="true"
      class="nebula-drift-2 pointer-events-none absolute right-1/4 bottom-10 h-72 w-72 translate-x-1/2 rounded-full blur-3xl transition-colors duration-700 motion-reduce:animate-none"
      :class="isPlayingChord ? 'bg-[#D18C39]/25' : 'bg-[#D18C39]/14'"
    ></div>
    <div
      aria-hidden="true"
      class="nebula-drift-1 pointer-events-none absolute top-16 right-1/3 h-64 w-64 rounded-full bg-[#1D303B]/45 blur-3xl motion-reduce:animate-none"
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

      <!-- Sound zone (clean glass capsule synced with Header/Footer + chord resonance) -->
      <div
        class="flex flex-col items-start justify-between gap-5 rounded-2xl border bg-[#1D303B]/40 p-5 backdrop-blur-xl backdrop-saturate-150 transition-all duration-500 sm:flex-row sm:items-center sm:rounded-full sm:px-7 sm:py-4"
        :class="
          isPlayingChord
            ? 'border-[#D18C39]/80 shadow-[inset_0_1px_1px_rgba(231,213,172,0.22),0_0_36px_rgba(209,140,57,0.24)]'
            : 'border-[#31515A]/70 border-t-[#E7D5AC]/20 shadow-[inset_0_1px_1px_rgba(231,213,172,0.16),0_16px_36px_rgba(0,0,0,0.45)]'
        "
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

@keyframes galaxy-breathe {
  0%,
  100% {
    opacity: 0.72;
  }
  50% {
    opacity: 1;
  }
}

@keyframes nebula-fluctuate {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.72;
  }
  50% {
    transform: translate3d(18px, -14px, 0) scale(1.14);
    opacity: 1;
  }
}

@keyframes dust-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 0.3;
  }
  50% {
    transform: translate3d(10px, -14px, 0);
    opacity: 0.8;
  }
}

@keyframes shooting-streak {
  0%,
  78% {
    transform: translate3d(-45px, -22px, 0);
    opacity: 0;
  }
  82% {
    opacity: 1;
  }
  92% {
    transform: translate3d(145px, 72px, 0);
    opacity: 0;
  }
  100% {
    transform: translate3d(145px, 72px, 0);
    opacity: 0;
  }
}

.star-twinkle-1 {
  animation: star-twinkle 4.4s ease-in-out infinite;
}

.star-twinkle-2 {
  animation: star-twinkle 6s ease-in-out infinite 1.7s;
}

.star-twinkle-3 {
  animation: star-twinkle 4.8s ease-in-out infinite 0.8s;
}

.galaxy-pulse {
  animation: galaxy-breathe 9s ease-in-out infinite;
}

.nebula-drift-1 {
  animation: nebula-fluctuate 12s ease-in-out infinite;
}

.nebula-drift-2 {
  animation: nebula-fluctuate 15s ease-in-out infinite reverse;
}

.dust-float {
  animation: dust-drift 8.5s ease-in-out infinite;
}

.shooting-star-1 {
  animation: shooting-streak 12s cubic-bezier(0.25, 0.1, 0.25, 1) infinite 2s;
}

.shooting-star-2 {
  animation: shooting-streak 16s cubic-bezier(0.25, 0.1, 0.25, 1) infinite 8s;
}
</style>