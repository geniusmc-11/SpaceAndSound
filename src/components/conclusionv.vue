<script setup lang="ts">
interface PilarConclusion {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
}

const pilaresConclusion: PilarConclusion[] = [
  {
    id: 'inclusion',
    codigo: 'SLOT_01 // ACCESS',
    titulo: 'Universal Sensory Accessibility',
    descripcion:
      'Transforming visual data into soundscapes removes the barriers of optical perception, allowing people who are blind or have low vision to experience the vastness of the cosmos and the biodiversity of different ecosystems.'
  },
  {
    id: 'sonificacion',
    codigo: 'SLOT_02 // BRIDGE',
    titulo: 'The Jukebox as a Data Bridge',
    descripcion:
      'Reinterpreting the classic jukebox concept toward image sonification demonstrates that art, science, and web engineering can transform pixels, light spectra, and textures into immersive auditory experiences.'
  },
  {
    id: 'empatia',
    codigo: 'SLOT_03 // PURPOSE',
    titulo: 'Technology with Human Purpose',
    descripcion:
      'The true value of digital innovation lies not merely in its technical complexity, but in its ability to democratize wonder and connect all people with the environment around them.'
  }
];
</script>

<template>
  <section
    aria-labelledby="conclusion-title"
    class="pixel-section relative overflow-hidden bg-[#101820] px-6 py-20 font-mono text-[#E7D5AC] sm:py-24"
  >
    <!-- CRT Scanline & Pixel Grid Overlay -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 z-0 opacity-25 [background-image:linear-gradient(rgba(16,24,32,0)_50%,rgba(0,0,0,0.6)_50%),linear-gradient(90deg,rgba(231,213,172,0.03)_1px,transparent_1px)] [background-size:100%_4px,16px_100%]"
    ></div>

    <!-- Pixel Art Outer Space Background (Stars, Pixel Galaxies, Ringed Planet & Comets) -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 360 225"
        preserveAspectRatio="xMidYMid slice"
        shape-rendering="crispEdges"
        class="h-full w-full"
      >
        <!-- Deep Space Pixel Grid / Nebulae Clusters (Stepped blocks, zero blur) -->
        <!-- Nebula 1: Upper Left Teal Cluster -->
        <g fill="#1D303B" class="nebula-step-1 motion-reduce:animate-none">
          <rect x="24" y="20" width="48" height="16" />
          <rect x="16" y="28" width="64" height="16" />
          <rect x="28" y="44" width="44" height="12" />
          <rect x="36" y="14" width="24" height="6" />
          <g fill="#31515A" opacity="0.65">
            <rect x="28" y="26" width="36" height="14" />
            <rect x="22" y="32" width="48" height="8" />
          </g>
        </g>

        <!-- Nebula 2: Bottom Right Amber/Teal Cluster -->
        <g class="nebula-step-2 motion-reduce:animate-none">
          <g fill="#1D303B">
            <rect x="240" y="145" width="76" height="24" />
            <rect x="228" y="155" width="96" height="18" />
            <rect x="252" y="135" width="48" height="12" />
            <rect x="256" y="173" width="52" height="10" />
          </g>
          <g fill="#31515A" opacity="0.55">
            <rect x="250" y="150" width="56" height="18" />
            <rect x="262" y="142" width="32" height="10" />
          </g>
          <g fill="#D18C39" opacity="0.25">
            <rect x="264" y="154" width="28" height="10" />
            <rect x="272" y="150" width="12" height="18" />
          </g>
        </g>

        <!-- Distant Pixel Spiral Galaxy (Upper Right) -->
        <g transform="translate(290, 42)" class="galaxy-step motion-reduce:animate-none">
          <!-- Outer arms -->
          <g fill="#31515A">
            <rect x="-18" y="-4" width="8" height="2" />
            <rect x="-22" y="-2" width="6" height="2" />
            <rect x="-20" y="0" width="4" height="2" />
            <rect x="10" y="2" width="8" height="2" />
            <rect x="16" y="0" width="6" height="2" />
            <rect x="16" y="-2" width="4" height="2" />
          </g>
          <!-- Mid arms -->
          <g fill="#D18C39">
            <rect x="-12" y="-2" width="24" height="4" />
            <rect x="-8" y="-4" width="16" height="2" />
            <rect x="-8" y="2" width="16" height="2" />
            <rect x="-14" y="2" width="6" height="2" />
            <rect x="8" y="-4" width="6" height="2" />
          </g>
          <!-- Bright Galactic Core -->
          <g fill="#E7D5AC">
            <rect x="-6" y="-2" width="12" height="4" />
            <rect x="-2" y="-4" width="4" height="8" />
          </g>
          <rect x="-1" y="-1" width="2" height="2" fill="#FFFFFF" />
        </g>

        <!-- Pixel Ringed Planet (Mid-Left) -->
        <g transform="translate(46, 148)">
          <!-- Back Ring -->
          <g fill="#31515A">
            <rect x="-20" y="-4" width="40" height="2" />
            <rect x="-24" y="-2" width="48" height="2" />
          </g>
          <!-- Planet Body (Pixel Circle) -->
          <g fill="#1D303B">
            <rect x="-8" y="-12" width="16" height="24" />
            <rect x="-10" y="-10" width="20" height="20" />
            <rect x="-12" y="-8" width="24" height="16" />
          </g>
          <!-- Planet Bands & Highlight -->
          <g fill="#31515A">
            <rect x="-8" y="-12" width="12" height="2" />
            <rect x="-10" y="-8" width="18" height="2" />
            <rect x="-12" y="-2" width="20" height="2" />
            <rect x="-10" y="6" width="16" height="2" />
          </g>
          <g fill="#D18C39">
            <rect x="-6" y="-10" width="10" height="2" />
            <rect x="-12" y="-6" width="14" height="2" />
            <rect x="-8" y="2" width="12" height="2" />
          </g>
          <!-- Front Ring (Stepped Pixel Arc) -->
          <g fill="#E7D5AC">
            <rect x="-26" y="0" width="6" height="2" />
            <rect x="20" y="0" width="6" height="2" />
            <rect x="-22" y="2" width="44" height="2" />
          </g>
          <g fill="#D18C39">
            <rect x="-18" y="4" width="36" height="2" />
          </g>
        </g>

        <!-- Layer 1: Single-Pixel & Cross Stars (Beige) -->
        <g class="star-blink-1 motion-reduce:animate-none" fill="#E7D5AC">
          <!-- Single pixel stars -->
          <rect x="18" y="14" width="2" height="2" />
          <rect x="64" y="34" width="2" height="2" />
          <rect x="112" y="16" width="2" height="2" />
          <rect x="168" y="28" width="2" height="2" />
          <rect x="220" y="12" width="2" height="2" />
          <rect x="334" y="20" width="2" height="2" />
          <rect x="35" y="88" width="2" height="2" />
          <rect x="130" y="80" width="2" height="2" />
          <rect x="245" y="84" width="2" height="2" />
          <rect x="322" y="96" width="2" height="2" />
          <rect x="20" y="190" width="2" height="2" />
          <rect x="102" y="154" width="2" height="2" />
          <rect x="195" y="164" width="2" height="2" />
          <rect x="290" y="195" width="2" height="2" />
          <rect x="342" y="176" width="2" height="2" />

          <!-- Pixel Cross Stars (5-block 8-bit style) -->
          <g transform="translate(88, 22)">
            <rect x="0" y="-2" width="2" height="6" />
            <rect x="-2" y="0" width="6" height="2" />
          </g>
          <g transform="translate(254, 26)">
            <rect x="0" y="-2" width="2" height="6" />
            <rect x="-2" y="0" width="6" height="2" />
          </g>
          <g transform="translate(154, 186)">
            <rect x="0" y="-2" width="2" height="6" />
            <rect x="-2" y="0" width="6" height="2" />
          </g>
        </g>

        <!-- Layer 2: Secondary Pixel Stars -->
        <g class="star-blink-2 motion-reduce:animate-none" fill="#E7D5AC" opacity="0.8">
          <rect x="44" y="56" width="2" height="2" />
          <rect x="92" y="48" width="2" height="2" />
          <rect x="146" y="46" width="2" height="2" />
          <rect x="198" y="44" width="2" height="2" />
          <rect x="260" y="58" width="2" height="2" />
          <rect x="308" y="64" width="2" height="2" />
          <rect x="78" y="118" width="2" height="2" />
          <rect x="178" y="122" width="2" height="2" />
          <rect x="272" y="120" width="2" height="2" />
          <rect x="62" y="206" width="2" height="2" />
          <rect x="212" y="198" width="2" height="2" />
          <rect x="318" y="210" width="2" height="2" />
        </g>

        <!-- Layer 3: Amber 8-bit Sparkles & Plus Stars -->
        <g class="star-blink-3 motion-reduce:animate-none" fill="#D18C39">
          <rect x="135" y="14" width="2" height="2" />
          <rect x="302" y="18" width="2" height="2" />
          <rect x="16" y="122" width="2" height="2" />
          <rect x="160" y="150" width="2" height="2" />
          <rect x="338" y="136" width="2" height="2" />
          <rect x="118" y="212" width="2" height="2" />

          <!-- Large 8-bit Amber Cross Sparkles -->
          <g transform="translate(316, 16)">
            <rect x="0" y="-4" width="2" height="10" />
            <rect x="-4" y="0" width="10" height="2" />
            <rect x="0" y="0" width="2" height="2" fill="#E7D5AC" />
          </g>
          <g transform="translate(28, 178)">
            <rect x="0" y="-4" width="2" height="10" />
            <rect x="-4" y="0" width="10" height="2" />
            <rect x="0" y="0" width="2" height="2" fill="#E7D5AC" />
          </g>
          <g transform="translate(238, 148)">
            <rect x="0" y="-2" width="2" height="6" />
            <rect x="-2" y="0" width="6" height="2" />
            <rect x="0" y="0" width="2" height="2" fill="#FFFFFF" />
          </g>
        </g>

        <!-- Pixel Art Comet 1 (Upper Mid -> Right, Stepped Pixel Blocks) -->
        <g class="pixel-comet-1 motion-reduce:hidden">
          <!-- Dust trail blocks -->
          <rect x="96" y="14" width="2" height="2" fill="#31515A" />
          <rect x="102" y="16" width="4" height="2" fill="#31515A" />
          <rect x="108" y="18" width="4" height="2" fill="#D18C39" opacity="0.6" />
          <rect x="114" y="20" width="6" height="2" fill="#D18C39" />
          <rect x="120" y="22" width="6" height="4" fill="#E7D5AC" />
          <!-- Glowing pixel head -->
          <rect x="126" y="22" width="4" height="4" fill="#FFFFFF" />
          <rect x="128" y="20" width="2" height="8" fill="#E7D5AC" />
        </g>

        <!-- Pixel Art Comet 2 (Lower Right, Amber/Teal Tail) -->
        <g class="pixel-comet-2 motion-reduce:hidden">
          <rect x="230" y="114" width="2" height="2" fill="#31515A" />
          <rect x="234" y="116" width="4" height="2" fill="#D18C39" opacity="0.5" />
          <rect x="240" y="118" width="6" height="2" fill="#D18C39" />
          <rect x="246" y="120" width="6" height="4" fill="#E7D5AC" />
          <rect x="252" y="120" width="4" height="4" fill="#FFFFFF" />
        </g>
      </svg>
    </div>

    <!-- Main Content Container -->
    <div class="relative z-10 mx-auto flex max-w-[1040px] flex-col gap-12">
      <!-- Retro Arcade / Terminal Header -->
      <div class="max-w-[780px]">
        <div
          aria-hidden="true"
          class="mb-4 inline-flex flex-wrap items-center gap-2 border-2 border-[#31515A] bg-[#1D303B] px-3 py-1.5 font-mono text-xs tracking-widest uppercase shadow-[4px_4px_0px_#080C10]"
        >
          <span class="inline-block h-2.5 w-2.5 bg-[#D18C39] star-blink-1"></span>
          <span class="font-bold text-[#D18C39]">STAGE CLEAR</span>
          <span class="text-[#31515A]">::</span>
          <span class="text-[#E7D5AC]/80">LOG_FINAL_SONIFICATION.EXE</span>
        </div>

        <h2
          id="conclusion-title"
          class="pixel-title mb-5 text-2xl leading-snug font-black tracking-wider text-[#E7D5AC] uppercase sm:text-3xl lg:text-4xl"
        >
          Conclusion: <span class="text-[#D18C39]">Hearing the Invisible</span>
        </h2>

        <p class="text-sm leading-relaxed text-[#E7D5AC]/90 sm:text-base">
          This project demonstrates that the modern web can transcend the purely visual. By fusing
          the interactive nostalgia of an
          <strong class="bg-[#D18C39]/20 px-1.5 py-0.5 font-bold text-[#D18C39]">8-bit jukebox</strong>
          with
          <strong class="bg-[#D18C39]/20 px-1.5 py-0.5 font-bold text-[#D18C39]">image sonification</strong>
          algorithms, we succeed in translating the silent beauty of outer space and terrestrial
          ecosystems into a universal language: sound.
        </p>
      </div>

      <!-- Pixel Art RPG Window Cards -->
      <div class="grid grid-cols-1 gap-7 md:grid-cols-3" role="list">
        <div
          v-for="(pilar, index) in pilaresConclusion"
          :key="pilar.id"
          role="listitem"
          tabindex="0"
          class="pixel-card group relative flex flex-col border-2 border-[#31515A] bg-[#1D303B]/90 p-6 transition-transform duration-75 hover:-translate-x-1 hover:-translate-y-1 hover:border-[#D18C39] hover:bg-[#1D303B] focus-visible:-translate-x-1 focus-visible:-translate-y-1 focus-visible:border-[#D18C39] focus-visible:outline-none"
        >
          <!-- Corner Pixel Rivets -->
          <span aria-hidden="true" class=" absolute top-1 left-1 h-1.5 w-1.5 bg-[#31515A] group-hover:bg-[#D18C39]"></span>
          <span aria-hidden="true" class=" absolute top-1 right-1 h-1.5 w-1.5 bg-[#31515A] group-hover:bg-[#D18C39]"></span>
          <span aria-hidden="true" class=" absolute bottom-1 left-1 h-1.5 w-1.5 bg-[#31515A] group-hover:bg-[#D18C39]"></span>
          <span aria-hidden="true" class=" absolute right-1 bottom-1 h-1.5 w-1.5 bg-[#31515A] group-hover:bg-[#D18C39]"></span>

          <!-- Retro Window Top Bar -->
          <div class="mb-4 flex items-center justify-between border-b-2 border-[#31515A] pb-2.5 group-hover:border-[#D18C39]/60">
            <span
              aria-hidden="true"
              class="font-mono text-[0.7rem] font-bold tracking-widest text-[#D18C39] uppercase"
            >
              {{ pilar.codigo || `SLOT_0${index + 1}` }}
            </span>
            <div aria-hidden="true" class="flex gap-1">
              <span class="h-2 w-2 bg-[#31515A] group-hover:bg-[#E7D5AC]"></span>
              <span class="h-2 w-2 bg-[#D18C39]"></span>
            </div>
          </div>

          <h3
            class="mb-3 text-base font-extrabold tracking-wide text-[#E7D5AC] uppercase transition-colors group-hover:text-white sm:text-lg"
          >
            {{ pilar.titulo }}
          </h3>

          <p
            class="text-xs leading-relaxed text-[#E7D5AC]/80 group-hover:text-[#E7D5AC] sm:text-sm"
          >
            {{ pilar.descripcion }}
          </p>
        </div>
      </div>

      <!-- RPG Dialogue Box (Final Transmission Quote) -->
      <div
        class="pixel-dialogue relative border-2 border-[#E7D5AC] bg-[#1D303B]/95 px-6 py-6 sm:px-8 sm:py-7"
      >
        <!-- Pixelated Badge Header -->
        <div
          aria-hidden="true"
          class="mb-3 inline-flex items-center gap-2 bg-[#D18C39] px-2.5 py-1 font-mono text-[0.68rem] font-black tracking-[0.18em] text-[#101820] uppercase"
        >
          <span>▶</span>
          <span>FINAL TRANSMISSION // DESIGN PRINCIPLE</span>
        </div>

        <p class="m-0 font-mono text-sm leading-relaxed text-[#E7D5AC] sm:text-base">
          “When we design with those who perceive the world differently in mind, we don't just build
          accessible software; we expand the senses of all humanity.”
          <span
            aria-hidden="true"
            class="ml-1 inline-block h-4 w-2.5 translate-y-0.5 bg-[#D18C39] star-blink-1"
          ></span>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Hard 8-bit shadows & pixel borders */
.pixel-title {
  text-shadow: 3px 3px 0px #080c10;
}

.pixel-card {
  box-shadow:
    inset 0 0 0 2px #101820,
    6px 6px 0px #080c10;
}

.pixel-card:hover,
.pixel-card:focus-visible {
  box-shadow:
    inset 0 0 0 2px #101820,
    8px 8px 0px #d18c39;
}

.pixel-dialogue {
  box-shadow:
    inset 0 0 0 3px #101820,
    8px 8px 0px #080c10;
}

/* Stepped 8-bit animations (no smooth interpolation) */
@keyframes pixel-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

@keyframes nebula-step-move {
  0%,
  100% {
    transform: translate(0px, 0px);
  }
  50% {
    transform: translate(4px, -4px);
  }
}

@keyframes comet-step-run {
  0%,
  70% {
    transform: translate(-32px, -16px);
    opacity: 0;
  }
  75% {
    opacity: 1;
  }
  92% {
    transform: translate(88px, 44px);
    opacity: 1;
  }
  96%,
  100% {
    transform: translate(104px, 52px);
    opacity: 0;
  }
}

.star-blink-1 {
  animation: pixel-blink 1.6s steps(2, end) infinite;
}

.star-blink-2 {
  animation: pixel-blink 2.4s steps(2, end) infinite 0.6s;
}

.star-blink-3 {
  animation: pixel-blink 2s steps(2, end) infinite 1.1s;
}

.galaxy-step {
  animation: pixel-blink 4s steps(2, end) infinite;
}

.nebula-step-1 {
  animation: nebula-step-move 6s steps(2, end) infinite;
}

.nebula-step-2 {
  animation: nebula-step-move 8s steps(2, end) infinite reverse;
}

.pixel-comet-1 {
  animation: comet-step-run 10s steps(12, end) infinite 1s;
}

.pixel-comet-2 {
  animation: comet-step-run 14s steps(12, end) infinite 6s;
}
</style>