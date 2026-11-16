<script setup lang="ts">
const teamLogoPath = '/images/logoSS.svg';
const projectLogoPath = '/images/PATATAIMAGEN.jpeg';
</script>

<template>
  <div class="relative mx-auto w-[calc(100%-1.5rem)] max-w-[1040px] sm:w-[calc(90%-2rem)] md:w-[calc(80%-2rem)]">
    <!-- Fluctuating ambient glows behind the glass for refraction -->
    <div
      aria-hidden="true"
      class="nebula-drift-1 pointer-events-none absolute -top-3 left-10 h-20 w-56 rounded-full bg-[#D18C39]/25 blur-2xl motion-reduce:animate-none"
    ></div>
    <div
      aria-hidden="true"
      class="nebula-drift-2 pointer-events-none absolute -bottom-3 right-12 h-20 w-64 rounded-full bg-[#31515A]/55 blur-2xl motion-reduce:animate-none"
    ></div>

    <header
      aria-label="SpaceAndSound project and SynapseTrinity team identity"
      class="relative flex items-center justify-between gap-2 overflow-hidden rounded-2xl border border-t-[#E7D5AC]/25 border-r-[#31515A]/70 border-b-[#31515A]/50 border-l-[#E7D5AC]/15 bg-[#1D303B]/45 px-3 py-2.5 text-[#E7D5AC] shadow-[inset_0_1px_1px_rgba(231,213,172,0.22),0_20px_44px_rgba(0,0,0,0.55)] backdrop-blur-xl backdrop-saturate-150 sm:gap-4 sm:rounded-full sm:px-8 sm:py-3"
    >
      <!-- Internal technical micro-grid -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#31515A1f_1px,transparent_1px),linear-gradient(to_bottom,#31515A1f_1px,transparent_1px)] bg-[size:20px_20px]"
      ></div>

      <!-- Internal subtle nebula fluctuation -->
      <div
        aria-hidden="true"
        class="nebula-drift-2 pointer-events-none absolute -top-8 left-1/3 h-24 w-48 rounded-full bg-[#D18C39]/[0.1] blur-2xl motion-reduce:animate-none"
      ></div>

      <!-- ESTRELLAS PIXELADAS: Solo esta sección tiene el estilo 8-bit -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
      >
        <svg
          viewBox="0 0 1040 80"
          preserveAspectRatio="xMidYMid slice"
          class="h-full w-full"
          shape-rendering="crispEdges"
        >
          <defs>
            <filter id="pixel-bloom" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Galaxia Espiral 8-bit -->
          <g transform="translate(738, 42)" class="galaxy-rotate motion-reduce:animate-none">
            <!-- Núcleo brillante -->
            <rect x="-4" y="-4" width="8" height="8" fill="#E7D5AC" filter="url(#pixel-bloom)" />
            <!-- Brazos principales -->
            <rect x="4" y="-2" width="6" height="4" fill="#D18C39" />
            <rect x="10" y="2" width="4" height="6" fill="#D18C39" />
            <rect x="-10" y="-2" width="6" height="4" fill="#D18C39" />
            <rect x="-14" y="-8" width="4" height="6" fill="#D18C39" />
            <!-- Polvo estelar pixelado -->
            <rect x="14" y="8" width="2" height="2" fill="#31515A" />
            <rect x="-16" y="-12" width="2" height="2" fill="#31515A" />
            <rect x="-2" y="8" width="4" height="4" fill="#31515A" />
          </g>

          <!-- Capa 1: Estrellas brillantes y cruces (destellos) -->
          <g class="star-blink-1 motion-reduce:animate-none" fill="#E7D5AC">
            <!-- Originales -->
            <path d="M154 16h4v4h-4z M156 14h-2v-4h4v4z M156 20h-2v4h4v-4z M152 16h-4v4h4v-4z M158 16h4v4h-4v-4z" transform="translate(110, 5)" opacity="0.9" filter="url(#pixel-bloom)" />
            <rect x="348" y="58" width="4" height="4" opacity="0.85" />
            <rect x="495" y="14" width="2" height="2" opacity="0.65" />
            <path d="M654 20h4v4h-4z M656 18h-2v-4h4v4z M656 24h-2v4h4v-4z M652 20h-4v4h4v-4z M658 20h4v4h-4v-4z" opacity="0.9" filter="url(#pixel-bloom)" />
            <rect x="885" y="18" width="4" height="4" opacity="0.7" />
            <!-- Nuevas estrellas brillantes -->
            <rect x="30" y="25" width="2" height="2" opacity="0.8" />
            <rect x="90" y="70" width="4" height="4" opacity="0.9" filter="url(#pixel-bloom)" />
            <rect x="420" y="10" width="2" height="2" opacity="0.85" />
            <rect x="520" y="45" width="4" height="4" opacity="0.75" />
            <rect x="710" y="35" width="2" height="2" opacity="0.9" />
            <rect x="850" y="55" width="4" height="4" filter="url(#pixel-bloom)" />
            <rect x="950" y="25" width="2" height="2" opacity="0.8" />
            <rect x="1010" y="60" width="2" height="2" opacity="0.7" />
            <!-- Nuevas cruces destellantes -->
            <path d="M424 40h4v4h-4z M426 38h-2v-4h4v4z M426 44h-2v4h4v-4z M422 40h-4v4h4v-4z M428 40h4v4h-4v-4z" opacity="0.7" filter="url(#pixel-bloom)" />
            <path d="M824 30h4v4h-4z M826 28h-2v-4h4v4z M826 34h-2v4h4v-4z M822 30h-4v4h4v-4z M828 30h4v4h-4v-4z" opacity="0.6" filter="url(#pixel-bloom)" />
            <path d="M74 46h4v4h-4z M76 44h-2v-4h4v4z M76 50h-2v4h4v-4z M72 46h-4v4h4v-4z M78 46h4v4h-4v-4z" opacity="0.8" filter="url(#pixel-bloom)" />
          </g>

          <!-- Capa 2: Estrellas lejanas simples (Capa muy densa) -->
          <g class="star-blink-2 motion-reduce:animate-none" fill="#E7D5AC">
            <!-- Originales -->
            <rect x="110" y="64" width="2" height="2" opacity="0.5" />
            <rect x="242" y="54" width="2" height="2" opacity="0.7" />
            <rect x="385" y="26" width="2" height="2" opacity="0.6" />
            <rect x="565" y="66" width="4" height="4" opacity="0.5" />
            <rect x="792" y="62" width="2" height="2" opacity="0.8" />
            <!-- Nuevas estrellas lejanas -->
            <rect x="15" y="40" width="2" height="2" opacity="0.6" />
            <rect x="55" y="15" width="2" height="2" opacity="0.4" />
            <rect x="180" y="75" width="2" height="2" opacity="0.5" />
            <rect x="210" y="20" width="4" height="4" opacity="0.3" />
            <rect x="290" y="45" width="2" height="2" opacity="0.7" />
            <rect x="320" y="65" width="2" height="2" opacity="0.4" />
            <rect x="450" y="30" width="2" height="2" opacity="0.5" />
            <rect x="480" y="70" width="4" height="4" opacity="0.3" />
            <rect x="580" y="15" width="2" height="2" opacity="0.6" />
            <rect x="620" y="55" width="2" height="2" opacity="0.4" />
            <rect x="675" y="25" width="2" height="2" opacity="0.5" />
            <rect x="730" y="20" width="2" height="2" opacity="0.5" />
            <rect x="760" y="75" width="4" height="4" opacity="0.4" />
            <rect x="880" y="45" width="2" height="2" opacity="0.6" />
            <rect x="920" y="10" width="2" height="2" opacity="0.5" />
            <rect x="980" y="65" width="2" height="2" opacity="0.7" />
            <rect x="1020" y="35" width="4" height="4" opacity="0.3" />
          </g>

          <!-- Capa 3: Estrellas Ámbar (Destellos cálidos) -->
          <g class="star-blink-3 motion-reduce:animate-none" fill="#D18C39">
            <!-- Originales -->
            <rect x="315" y="18" width="4" height="4" filter="url(#pixel-bloom)" />
            <rect x="668" y="46" width="2" height="2" opacity="0.85" />
            <rect x="775" y="16" width="4" height="4" opacity="0.7" />
            <!-- Nuevas estrellas ámbar -->
            <rect x="40" y="60" width="2" height="2" opacity="0.8" />
            <rect x="130" y="30" width="4" height="4" filter="url(#pixel-bloom)" opacity="0.9" />
            <rect x="260" y="10" width="2" height="2" opacity="0.7" />
            <rect x="400" y="55" width="4" height="4" filter="url(#pixel-bloom)" opacity="0.8" />
            <rect x="550" y="25" width="2" height="2" opacity="0.9" />
            <rect x="690" y="70" width="2" height="2" opacity="0.7" />
            <rect x="860" y="35" width="4" height="4" filter="url(#pixel-bloom)" opacity="0.8" />
            <rect x="990" y="15" width="2" height="2" opacity="0.9" />
          </g>

          <!-- Cometa / Estrella Fugaz en pasos (8-bit style) -->
          <g class="pixel-meteor motion-reduce:hidden">
            <rect x="230" y="15" width="4" height="4" fill="#31515A" opacity="0.2"/>
            <rect x="238" y="19" width="4" height="4" fill="#31515A" opacity="0.4"/>
            <rect x="246" y="23" width="6" height="6" fill="#D18C39" opacity="0.6"/>
            <rect x="256" y="28" width="6" height="6" fill="#E7D5AC" opacity="0.8"/>
            <rect x="266" y="33" width="8" height="8" fill="#FFFFFF" filter="url(#pixel-bloom)"/>
          </g>
        </svg>
      </div>

      <!-- Subtle continuous acoustic wave inside the glass (ORIGINAL SMOOTH) -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden opacity-60 [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"
      >
        <svg
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          class="wave-flow-fast absolute top-0 left-0 h-full w-[200%] motion-reduce:animate-none"
        >
          <path
            d="M 0 30 Q 75 12, 150 30 T 300 30 T 450 30 T 600 30 T 750 30 T 900 30 T 1050 30 T 1200 30"
            fill="none"
            stroke="#D18C39"
            stroke-opacity="0.28"
            stroke-width="1.25"
          />
        </svg>

        <svg
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          class="wave-flow-slow absolute top-0 left-0 h-full w-[200%] motion-reduce:animate-none"
        >
          <path
            d="M 0 30 Q 150 48, 300 30 T 600 30 T 900 30 T 1200 30"
            fill="none"
            stroke="#E7D5AC"
            stroke-opacity="0.14"
            stroke-width="1"
          />
        </svg>
      </div>

      <!-- Diagonal specular glass sheen -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#E7D5AC]/[0.09] via-transparent to-[#31515A]/[0.14]"
      ></div>

      <!-- Industrial side rivets -->
      <span
        aria-hidden="true"
        class="absolute top-1/2 left-3 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full border border-[#31515A] bg-[#101820] sm:block"
      ></span>
      <span
        aria-hidden="true"
        class="absolute top-1/2 right-3 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full border border-[#31515A] bg-[#101820] sm:block"
      ></span>

      <!-- Left Module: Project Identity (ORIGINAL REDONDEADO) -->
      <div class="relative z-10 flex min-w-0 items-center gap-2 sm:gap-3">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D18C39]/85 bg-[#101820]/75 p-0.5 shadow-[inset_0_1px_1px_rgba(231,213,172,0.25),0_0_14px_rgba(209,140,57,0.28)] backdrop-blur-md sm:h-10 sm:w-10"
        >
          <img
            v-if="projectLogoPath"
            :src="projectLogoPath"
            alt="SpaceAndSound project logo"
            class="h-full w-full rounded-full object-cover"
          />
        </div>

        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5 items-center justify-center" aria-hidden="true">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D18C39] opacity-60"
              ></span>
              <span
                class="relative inline-flex h-2 w-2 rounded-full bg-[#D18C39] shadow-[0_0_8px_#D18C39]"
              ></span>
            </span>
            <span class="truncate text-xs font-extrabold tracking-wide text-[#E7D5AC] sm:text-base">
              SpaceAndSound
            </span>
          </div>
          <span
            class="hidden font-mono text-[0.65rem] font-medium tracking-widest text-[#E7D5AC]/65 uppercase sm:inline"
          >
            Sonification Jukebox
          </span>
        </div>
      </div>

      <!-- Center Module: Acoustic Telemetry (ORIGINAL FLUIDO) -->
      <div
        aria-hidden="true"
        class="relative z-10 hidden items-center gap-1 rounded-full border border-[#31515A] border-t-[#E7D5AC]/20 bg-[#101820]/75 px-4 py-1.5 shadow-[inset_0_1px_0_rgba(231,213,172,0.12)] backdrop-blur-md md:flex"
      >
        <div class="flex h-3.5 items-center gap-[3px]">
          <span class="eq-bar h-3 w-0.5 rounded-full bg-[#31515A]" style="animation-delay: 0ms"></span>
          <span class="eq-bar h-3 w-0.5 rounded-full bg-[#D18C39]/75" style="animation-delay: 180ms"></span>
          <span class="eq-bar h-3.5 w-0.5 rounded-full bg-[#D18C39] shadow-[0_0_6px_#D18C39]" style="animation-delay: 360ms"></span>
          <span class="eq-bar h-3 w-0.5 rounded-full bg-[#E7D5AC]/80" style="animation-delay: 540ms"></span>
          <span class="eq-bar h-3 w-0.5 rounded-full bg-[#D18C39]/75" style="animation-delay: 720ms"></span>
          <span class="eq-bar h-2.5 w-0.5 rounded-full bg-[#31515A]" style="animation-delay: 900ms"></span>
        </div>
        <span
          class="ml-2 font-mono text-[0.65rem] font-semibold tracking-[0.2em] text-[#E7D5AC]/70 uppercase"
        >
          SYS // AUDIO-OPTIC
        </span>
      </div>

      <!-- Right Module: Team Identity (ORIGINAL REDONDEADO) -->
      <div
        class="relative z-10 flex shrink-0 items-center gap-2 rounded-full border border-[#31515A] border-t-[#E7D5AC]/20 bg-[#101820]/75 py-1 pr-1 pl-2.5 shadow-[inset_0_1px_0_rgba(231,213,172,0.12)] backdrop-blur-md transition-colors duration-200 hover:border-[#D18C39]/70 sm:gap-2.5 sm:pr-1.5 sm:pl-4"
      >
        <div class="flex flex-col text-right">
          <span
            class="font-mono text-[0.52rem] font-bold tracking-widest text-[#D18C39] uppercase sm:text-[0.58rem]"
          >
            Team
          </span>
          <span class="text-[0.7rem] font-extrabold tracking-wide text-[#E7D5AC] sm:text-sm">
            SynapseTrinity
          </span>
        </div>

        <div
          class="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[#D18C39]/45 bg-[#1D303B]/80 shadow-[0_0_10px_rgba(0,0,0,0.4)] sm:h-8 sm:w-8"
        >
          <img
            v-if="teamLogoPath"
            :src="teamLogoPath"
            alt="SynapseTrinity team logo"
            class="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  </div>
</template>

<style scoped>
/* =========================
   ANIMACIONES FLUIDAS (UI Original) 
   ========================= */
.wave-flow-fast { animation: acoustic-drift 9s linear infinite; }
.wave-flow-slow { animation: acoustic-drift 15s linear infinite reverse; }
.eq-bar {
  transform-origin: center;
  animation: eq-breathe 1.6s ease-in-out infinite;
}
.nebula-drift-1 { animation: nebula-fluctuate 10s ease-in-out infinite; }
.nebula-drift-2 { animation: nebula-fluctuate 13s ease-in-out infinite reverse; }

@keyframes acoustic-drift {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes eq-breathe {
  0%, 100% { transform: scaleY(0.35); opacity: 0.65; }
  50% { transform: scaleY(1); opacity: 1; }
}
@keyframes nebula-fluctuate {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.75; }
  50% { transform: translate3d(12px, -4px, 0) scale(1.12); opacity: 1; }
}

/* =========================
   ANIMACIONES 8-BIT / PIXEL (Solo para el fondo)
   ========================= */
.star-blink-1 { animation: star-blink 2s steps(2, start) infinite; }
.star-blink-2 { animation: star-blink 3s steps(2, start) infinite 1s; }
.star-blink-3 { animation: star-blink 2.5s steps(2, start) infinite 0.5s; }
.galaxy-rotate { animation: pixel-spin 6s steps(8, end) infinite; }
.pixel-meteor { animation: meteor-dash 8s steps(12, end) infinite 3s; }

@keyframes star-blink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
@keyframes pixel-spin {
  0% { transform: translate(738px, 42px) rotate(0deg); }
  100% { transform: translate(738px, 42px) rotate(360deg); }
}
@keyframes meteor-dash {
  0%, 80% {
    transform: translate3d(-60px, -20px, 0);
    opacity: 0;
  }
  81% { opacity: 1; }
  94% {
    transform: translate3d(140px, 45px, 0);
    opacity: 1;
  }
  95%, 100% {
    transform: translate3d(140px, 45px, 0);
    opacity: 0;
  }
}
</style>