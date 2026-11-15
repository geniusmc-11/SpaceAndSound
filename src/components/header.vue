<script setup lang="ts">
const teamLogoPath = '/images/logoSS.svg';
const projectLogoPath = '/images/PATATAIMAGEN.jpeg';
</script>

<template>
  <div class="relative mx-auto w-[calc(80%-2rem)] max-w-[1040px]">
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
      class="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-t-[#E7D5AC]/25 border-r-[#31515A]/70 border-b-[#31515A]/50 border-l-[#E7D5AC]/15 bg-[#1D303B]/45 px-4 py-3 text-[#E7D5AC] shadow-[inset_0_1px_1px_rgba(231,213,172,0.22),0_20px_44px_rgba(0,0,0,0.55)] backdrop-blur-xl backdrop-saturate-150 sm:rounded-full sm:px-8"
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

      <!-- Cosmic starfield, mini spiral galaxy & shooting star -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
      >
        <svg
          viewBox="0 0 1040 80"
          preserveAspectRatio="xMidYMid slice"
          class="h-full w-full"
        >
          <defs>
            <!-- Unique IDs to prevent DOM collisions with other sections -->
            <filter id="header-star-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <radialGradient id="header-galaxy-amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#E7D5AC" stop-opacity="0.85" />
              <stop offset="28%" stop-color="#D18C39" stop-opacity="0.45" />
              <stop offset="65%" stop-color="#31515A" stop-opacity="0.2" />
              <stop offset="100%" stop-color="#101820" stop-opacity="0" />
            </radialGradient>

            <linearGradient id="header-meteor-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#E7D5AC" stop-opacity="0" />
              <stop offset="75%" stop-color="#D18C39" stop-opacity="0.6" />
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.95" />
            </linearGradient>
          </defs>

          <!-- Compact Spiral Galaxy tucked in the right breathing zone -->
          <g
            transform="translate(738, 42) rotate(-20)"
            class="galaxy-pulse motion-reduce:animate-none"
          >
            <ellipse cx="0" cy="0" rx="34" ry="12" fill="url(#header-galaxy-amber)" />
            <path
              d="M -3 -1 C -12 -6, -25 -3, -29 2 M 3 1 C 12 6, 25 3, 29 -2"
              fill="none"
              stroke="#E7D5AC"
              stroke-width="0.85"
              stroke-linecap="round"
              opacity="0.55"
            />
            <circle cx="0" cy="0" r="1.5" fill="#E7D5AC" />
          </g>

          <!-- Layer 1: Bright twinkling beige stars -->
          <g class="star-twinkle-1 motion-reduce:animate-none" fill="#E7D5AC">
            <circle cx="155" cy="16" r="1.2" opacity="0.75" />
            <circle cx="272" cy="22" r="1.6" filter="url(#header-star-glow)" />
            <circle cx="348" cy="58" r="1.4" opacity="0.85" />
            <circle cx="495" cy="14" r="1.2" opacity="0.65" />
            <circle cx="655" cy="20" r="1.5" filter="url(#header-star-glow)" />
            <circle cx="792" cy="62" r="1.3" opacity="0.8" />
            <circle cx="885" cy="18" r="1.2" opacity="0.7" />
          </g>

          <!-- Layer 2: Staggered secondary micro-stars -->
          <g class="star-twinkle-2 motion-reduce:animate-none" fill="#E7D5AC">
            <circle cx="110" cy="64" r="1.1" opacity="0.65" />
            <circle cx="242" cy="54" r="1.3" opacity="0.8" />
            <circle cx="385" cy="26" r="1.2" opacity="0.75" />
            <circle cx="565" cy="66" r="1.1" opacity="0.6" />
            <circle cx="688" cy="60" r="1.4" opacity="0.8" />
            <circle cx="812" cy="24" r="1.5" filter="url(#header-star-glow)" />
          </g>

          <!-- Layer 3: Warm amber glints & 4-point sparkles -->
          <g class="star-twinkle-3 motion-reduce:animate-none" fill="#D18C39">
            <circle cx="315" cy="18" r="1.5" filter="url(#header-star-glow)" />
            <circle cx="668" cy="46" r="1.4" opacity="0.85" />
            <circle cx="775" cy="16" r="1.6" filter="url(#header-star-glow)" />

            <!-- 4-point star sparkles in open gaps -->
            <path
              d="M302 42 L303.2 46.8 L308 48 L303.2 49.2 L302 54 L300.8 49.2 L296 48 L300.8 46.8 Z"
              filter="url(#header-star-glow)"
            />
            <path
              d="M682 14 L683 18 L687 19 L683 20 L682 24 L681 20 L677 19 L681 18 Z"
              fill="#E7D5AC"
              filter="url(#header-star-glow)"
            />
          </g>

          <!-- Periodic micro shooting star -->
          <g class="header-shooting-star motion-reduce:hidden">
            <line
              x1="245"
              y1="14"
              x2="310"
              y2="34"
              stroke="url(#header-meteor-grad)"
              stroke-width="1.2"
              stroke-linecap="round"
            />
            <circle cx="310" cy="34" r="1.3" fill="#FFFFFF" filter="url(#header-star-glow)" />
          </g>
        </svg>
      </div>

      <!-- Subtle continuous acoustic wave inside the glass -->
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

      <!-- Left Module: Project Identity -->
      <div class="relative z-10 flex items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D18C39]/85 bg-[#101820]/75 p-0.5 shadow-[inset_0_1px_1px_rgba(231,213,172,0.25),0_0_14px_rgba(209,140,57,0.28)] backdrop-blur-md"
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
            <span class="text-sm font-extrabold tracking-wide text-[#E7D5AC] sm:text-base">
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

      <!-- Center Module: Acoustic Telemetry -->
      <div
        aria-hidden="true"
        class="relative z-10 hidden items-center gap-1 rounded-full border border-[#31515A] border-t-[#E7D5AC]/20 bg-[#101820]/75 px-4 py-1.5 shadow-[inset_0_1px_0_rgba(231,213,172,0.12)] backdrop-blur-md md:flex"
      >
        <div class="flex h-3.5 items-center gap-[3px]">
          <span
            class="eq-bar h-3 w-0.5 rounded-full bg-[#31515A] motion-reduce:animate-none"
            style="animation-delay: 0ms"
          ></span>
          <span
            class="eq-bar h-3 w-0.5 rounded-full bg-[#D18C39]/75 motion-reduce:animate-none"
            style="animation-delay: 180ms"
          ></span>
          <span
            class="eq-bar h-3.5 w-0.5 rounded-full bg-[#D18C39] shadow-[0_0_6px_#D18C39] motion-reduce:animate-none"
            style="animation-delay: 360ms"
          ></span>
          <span
            class="eq-bar h-3 w-0.5 rounded-full bg-[#E7D5AC]/80 motion-reduce:animate-none"
            style="animation-delay: 540ms"
          ></span>
          <span
            class="eq-bar h-3 w-0.5 rounded-full bg-[#D18C39]/75 motion-reduce:animate-none"
            style="animation-delay: 720ms"
          ></span>
          <span
            class="eq-bar h-2.5 w-0.5 rounded-full bg-[#31515A] motion-reduce:animate-none"
            style="animation-delay: 900ms"
          ></span>
        </div>
        <span
          class="ml-2 font-mono text-[0.65rem] font-semibold tracking-[0.2em] text-[#E7D5AC]/70 uppercase"
        >
          SYS // AUDIO-OPTIC
        </span>
      </div>

      <!-- Right Module: Team Identity -->
      <div
        class="relative z-10 flex items-center gap-2.5 rounded-full border border-[#31515A] border-t-[#E7D5AC]/20 bg-[#101820]/75 py-1 pr-1.5 pl-4 shadow-[inset_0_1px_0_rgba(231,213,172,0.12)] backdrop-blur-md transition-colors duration-200 hover:border-[#D18C39]/70"
      >
        <div class="flex flex-col text-right">
          <span
            class="font-mono text-[0.58rem] font-bold tracking-widest text-[#D18C39] uppercase"
          >
            Team
          </span>
          <span class="text-xs font-extrabold tracking-wide text-[#E7D5AC] sm:text-sm">
            SynapseTrinity
          </span>
        </div>

        <div
          class="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#D18C39]/45 bg-[#1D303B]/80 shadow-[0_0_10px_rgba(0,0,0,0.4)]"
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
.wave-flow-fast {
  animation: acoustic-drift 9s linear infinite;
}

.wave-flow-slow {
  animation: acoustic-drift 15s linear infinite reverse;
}

.eq-bar {
  transform-origin: center;
  animation: eq-breathe 1.6s ease-in-out infinite;
}

.star-twinkle-1 {
  animation: star-twinkle 4s ease-in-out infinite;
}

.star-twinkle-2 {
  animation: star-twinkle 5.5s ease-in-out infinite 1.4s;
}

.star-twinkle-3 {
  animation: star-twinkle 4.6s ease-in-out infinite 0.7s;
}

.galaxy-pulse {
  animation: galaxy-breathe 8s ease-in-out infinite;
}

.nebula-drift-1 {
  animation: nebula-fluctuate 10s ease-in-out infinite;
}

.nebula-drift-2 {
  animation: nebula-fluctuate 13s ease-in-out infinite reverse;
}

.header-shooting-star {
  animation: header-meteor 11s cubic-bezier(0.25, 0.1, 0.25, 1) infinite 3s;
}

@keyframes acoustic-drift {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@keyframes eq-breathe {
  0%,
  100% {
    transform: scaleY(0.35);
    opacity: 0.65;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

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
    opacity: 0.75;
  }
  50% {
    transform: translate3d(12px, -4px, 0) scale(1.12);
    opacity: 1;
  }
}

@keyframes header-meteor {
  0%,
  80% {
    transform: translate3d(-30px, -10px, 0);
    opacity: 0;
  }
  84% {
    opacity: 1;
  }
  94% {
    transform: translate3d(110px, 32px, 0);
    opacity: 0;
  }
  100% {
    transform: translate3d(110px, 32px, 0);
    opacity: 0;
  }
}
</style>