<script setup lang="ts"></script>

<template>
  <!-- Adaptive main container aligned with Header, Conclusion & Footer -->
  <div class="relative mx-auto w-[calc(100%-2rem)] max-w-[1040px] py-6 md:py-10">
    <!-- Fluctuating ambient glows behind the glass for realistic refraction -->
    <div
      aria-hidden="true"
      class="nebula-drift-1 pointer-events-none absolute top-2 left-8 h-36 w-64 rounded-full bg-[#D18C39]/20 blur-3xl motion-reduce:animate-none"
    ></div>
    <div
      aria-hidden="true"
      class="nebula-drift-2 pointer-events-none absolute right-10 bottom-2 h-40 w-72 rounded-full bg-[#31515A]/55 blur-3xl motion-reduce:animate-none"
    ></div>

    <article
      aria-labelledby="mission-briefing-title"
      class="relative overflow-hidden rounded-2xl border border-[#31515A]/75 border-t-[#E7D5AC]/25 bg-[#1D303B]/40 font-sans text-base leading-relaxed text-[#E7D5AC]/85 shadow-[inset_0_1px_1px_rgba(231,213,172,0.2),0_22px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl backdrop-saturate-150 sm:rounded-3xl sm:text-lg"
    >
      <!-- Internal cosmic nebula fluctuations -->
      <div
        aria-hidden="true"
        class="nebula-drift-2 pointer-events-none absolute -top-20 right-1/4 h-64 w-64 rounded-full bg-[#D18C39]/[0.09] blur-3xl motion-reduce:animate-none"
      ></div>
      <div
        aria-hidden="true"
        class="nebula-drift-1 pointer-events-none absolute -bottom-24 left-12 h-72 w-80 rounded-full bg-[#31515A]/30 blur-3xl motion-reduce:animate-none"
      ></div>

      <!-- Deep-space starfield, constellation, distant galaxies & shooting star -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_38%_52%,rgba(0,0,0,0.58)_20%,black_85%)]"
      >
        <svg
          viewBox="0 0 1000 460"
          preserveAspectRatio="xMidYMid slice"
          class="h-full w-full"
        >
          <defs>
            <!-- Unique IDs to avoid DOM collisions with Header & Conclusion -->
            <filter id="mb-star-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <radialGradient id="mb-galaxy-amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#E7D5AC" stop-opacity="0.85" />
              <stop offset="25%" stop-color="#D18C39" stop-opacity="0.42" />
              <stop offset="62%" stop-color="#31515A" stop-opacity="0.2" />
              <stop offset="100%" stop-color="#101820" stop-opacity="0" />
            </radialGradient>

            <radialGradient id="mb-galaxy-teal" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#E7D5AC" stop-opacity="0.7" />
              <stop offset="35%" stop-color="#31515A" stop-opacity="0.45" />
              <stop offset="100%" stop-color="#101820" stop-opacity="0" />
            </radialGradient>

            <linearGradient id="mb-meteor-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#E7D5AC" stop-opacity="0" />
              <stop offset="72%" stop-color="#D18C39" stop-opacity="0.55" />
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.95" />
            </linearGradient>
          </defs>

          <!-- Faint geometric constellation lines (upper-left / center sky) -->
          <g stroke="#E7D5AC" stroke-width="0.65" stroke-dasharray="2 3" opacity="0.24" fill="none">
            <polyline points="68,68 195,112 265,75 340,54 430,122" />
            <line x1="195" y1="112" x2="148" y2="165" />
          </g>

          <!-- Distant Galaxies -->
          <g class="galaxy-pulse motion-reduce:animate-none">
            <!-- 1. Spiral Galaxy (Upper-right behind viewport) -->
            <g transform="translate(885, 92) rotate(-24)">
              <ellipse cx="0" cy="0" rx="64" ry="22" fill="url(#mb-galaxy-amber)" />
              <path
                d="M -5 -1.5 C -22 -11, -46 -6, -54 3 M 5 1.5 C 22 11, 46 6, 54 -3"
                fill="none"
                stroke="#E7D5AC"
                stroke-width="1"
                stroke-linecap="round"
                opacity="0.5"
              />
              <circle cx="0" cy="0" r="2" fill="#E7D5AC" />
            </g>

            <!-- 2. Edge-on Galaxy (Lower-left corner) -->
            <g transform="translate(95, 405) rotate(18)">
              <ellipse cx="0" cy="0" rx="58" ry="12" fill="url(#mb-galaxy-teal)" />
              <line
                x1="-40"
                y1="0.5"
                x2="40"
                y2="-0.5"
                stroke="#101820"
                stroke-width="1.3"
                opacity="0.6"
              />
              <circle cx="0" cy="0" r="1.7" fill="#E7D5AC" opacity="0.85" />
            </g>
          </g>

          <!-- Layer 1: High-luminance beige stars -->
          <g class="star-twinkle-1 motion-reduce:animate-none" fill="#E7D5AC">
            <circle cx="68" cy="68" r="1.7" filter="url(#mb-star-glow)" />
            <circle cx="195" cy="112" r="1.4" opacity="0.85" />
            <circle cx="340" cy="54" r="1.8" filter="url(#mb-star-glow)" />
            <circle cx="512" cy="84" r="1.3" opacity="0.75" />
            <circle cx="675" cy="62" r="1.9" filter="url(#mb-star-glow)" />
            <circle cx="945" cy="162" r="2" filter="url(#mb-star-glow)" />
            <circle cx="44" cy="235" r="1.5" opacity="0.85" />
            <circle cx="295" cy="415" r="1.5" opacity="0.85" />
            <circle cx="610" cy="398" r="1.7" filter="url(#mb-star-glow)" />
            <circle cx="825" cy="385" r="1.9" filter="url(#mb-star-glow)" />
            <circle cx="962" cy="330" r="1.4" opacity="0.85" />
          </g>

          <!-- Layer 2: Staggered secondary stars -->
          <g class="star-twinkle-2 motion-reduce:animate-none" fill="#E7D5AC">
            <circle cx="148" cy="165" r="1.3" opacity="0.8" />
            <circle cx="265" cy="75" r="1.6" filter="url(#mb-star-glow)" />
            <circle cx="430" cy="122" r="1.3" opacity="0.75" />
            <circle cx="590" cy="48" r="1.7" filter="url(#mb-star-glow)" />
            <circle cx="760" cy="108" r="1.4" opacity="0.85" />
            <circle cx="88" cy="305" r="1.3" opacity="0.8" />
            <circle cx="220" cy="342" r="1.6" opacity="0.85" />
            <circle cx="468" cy="380" r="1.3" opacity="0.75" />
            <circle cx="715" cy="345" r="1.5" opacity="0.85" />
            <circle cx="918" cy="415" r="1.8" filter="url(#mb-star-glow)" />
          </g>

          <!-- Layer 3: Warm amber stars & 4-point sparkles -->
          <g class="star-twinkle-3 motion-reduce:animate-none" fill="#D18C39">
            <circle cx="156" cy="56" r="1.8" filter="url(#mb-star-glow)" />
            <circle cx="632" cy="96" r="1.6" opacity="0.9" />
            <circle cx="930" cy="116" r="1.9" filter="url(#mb-star-glow)" />
            <circle cx="545" cy="422" r="1.6" opacity="0.85" />
            <circle cx="870" cy="292" r="1.7" filter="url(#mb-star-glow)" />

            <!-- 4-point star sparkles -->
            <path
              d="M952 54 L953.6 60.4 L960 62 L953.6 63.6 L952 70 L950.4 63.6 L944 62 L950.4 60.4 Z"
              filter="url(#mb-star-glow)"
            />
            <path
              d="M52 346 L53.4 351.6 L59 353 L53.4 354.4 L52 360 L50.6 354.4 L45 353 L50.6 351.6 Z"
              filter="url(#mb-star-glow)"
            />
            <path
              d="M578 24 L579.2 28.8 L584 30 L579.2 31.2 L578 36 L576.8 31.2 L572 30 L576.8 28.8 Z"
              fill="#E7D5AC"
              opacity="0.9"
            />
          </g>

          <!-- Periodic shooting star -->
          <g class="mb-shooting-star motion-reduce:hidden">
            <line
              x1="380"
              y1="38"
              x2="465"
              y2="82"
              stroke="url(#mb-meteor-grad)"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <circle cx="465" cy="82" r="1.6" fill="#FFFFFF" filter="url(#mb-star-glow)" />
          </g>
        </svg>
      </div>

      <!-- Diagonal specular glass sheen -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#E7D5AC]/[0.07] via-transparent to-[#31515A]/[0.16]"
      ></div>

      <!-- HUD Corner Brackets (distinct from Header/Conclusion rivets) -->
      <span
        aria-hidden="true"
        class="pointer-events-none absolute top-3 left-3 h-3 w-3 rounded-tl-md border-t-2 border-l-2 border-[#D18C39]/70"
      ></span>
      <span
        aria-hidden="true"
        class="pointer-events-none absolute top-3 right-3 h-3 w-3 rounded-tr-md border-t-2 border-r-2 border-[#D18C39]/70"
      ></span>
      <span
        aria-hidden="true"
        class="pointer-events-none absolute bottom-3 left-3 h-3 w-3 rounded-bl-md border-b-2 border-l-2 border-[#E7D5AC]/35"
      ></span>
      <span
        aria-hidden="true"
        class="pointer-events-none absolute right-3 bottom-3 h-3 w-3 rounded-br-md border-r-2 border-b-2 border-[#E7D5AC]/35"
      ></span>

      <!-- Top Observation Deck Strip (full-width integrated bar) -->
      <div
        class="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-[#31515A]/55 bg-[#101820]/45 px-6 py-3.5 sm:px-9 md:px-11"
      >
        <div class="flex items-center gap-2.5">
          <span class="relative flex h-2 w-2 items-center justify-center" aria-hidden="true">
            <span
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D18C39] opacity-60"
            ></span>
            <span
              class="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#D18C39] shadow-[0_0_8px_#D18C39]"
            ></span>
          </span>
          <h2
            id="mission-briefing-title"
            class="font-mono text-xs font-bold tracking-widest text-[#D18C39] uppercase"
          >
            Mission Briefing // Deep Space Operations
          </h2>
        </div>

        <span
          aria-hidden="true"
          class="hidden font-mono text-[0.65rem] tracking-[0.18em] text-[#E7D5AC]/55 uppercase sm:inline"
        >
          SECTOR // JUKEBOX-01
        </span>
      </div>

      <!-- Asymmetric 12-Column Split Layout -->
      <div
        class="relative z-10 grid grid-cols-1 items-center gap-8 p-6 sm:p-9 md:p-11 lg:grid-cols-12 lg:gap-10"
      >
        <!-- Left Column: Narrative & Mission Specs (7 cols) -->
        <div class="lg:col-span-7">
          <div class="space-y-5 border-l-2 border-[#31515A]/80 pl-4 sm:pl-6">
            <p>
              <strong class="font-bold text-[#E7D5AC]">Space&amp;Sound</strong> is an open-source 3D
              pixel-art video game developed by a three-member team for the
              <strong class="font-semibold text-[#D18C39]">NASA Space Apps Challenge</strong> in the
              <strong class="font-semibold text-[#D18C39]">Jukebox</strong> category. Space is
              traditionally experienced through visuals, creating an invisible barrier for people
              with visual impairments. <strong class="font-bold text-[#E7D5AC]">Space&amp;Sound</strong>
              breaks down that barrier by transforming astronomical imagery into dynamic,
              interactive audio—turning data from the cosmos into an experience that everyone can
              perceive.
            </p>

            <p>
              Players explore nostalgic 3D pixel-art environments to discover and collect cosmic
              records, unlocking a dynamic information screen for each disc that reveals the story
              and science behind the celestial object it represents. As a fully open-source
              initiative, <strong class="font-bold text-[#E7D5AC]">Space&amp;Sound</strong> invites
              developers, educators, and space enthusiasts worldwide to play, adapt, and expand the
              way we sense the stars.
            </p>
          </div>

          <!-- Compact Mission Metadata Chips -->
          <div
            aria-label="Project highlights"
            class="mt-6 flex flex-wrap items-center gap-2.5 pl-4 sm:pl-6"
          >
            <span
              class="rounded-lg border border-[#31515A]/80 bg-[#101820]/65 px-3 py-1 font-mono text-[0.68rem] font-semibold tracking-wider text-[#E7D5AC]/80 uppercase"
            >
              3D Pixel-Art
            </span>
            <span
              class="rounded-lg border border-[#D18C39]/40 bg-[#D18C39]/10 px-3 py-1 font-mono text-[0.68rem] font-semibold tracking-wider text-[#D18C39] uppercase"
            >
              NASA Space Apps
            </span>
            <span
              class="rounded-lg border border-[#31515A]/80 bg-[#101820]/65 px-3 py-1 font-mono text-[0.68rem] font-semibold tracking-wider text-[#E7D5AC]/80 uppercase"
            >
              Open-Source
            </span>
          </div>
        </div>

        <!-- Right Column: Dedicated Optical Sensor Viewport (5 cols) -->
        <div class="flex justify-center lg:col-span-5">
          <div class="relative w-full max-w-[330px]">
            <!-- Subtle decorative orbital ring behind the optical frame -->
            <div
              aria-hidden="true"
              class="pointer-events-none absolute -inset-3 rounded-3xl border border-dashed border-[#31515A]/55"
            ></div>

            <figure
              class="hover-tremble group relative cursor-pointer overflow-hidden rounded-2xl border border-[#31515A] border-t-[#E7D5AC]/30 bg-[#101820]/85 p-2 shadow-[0_16px_36px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 hover:border-[#D18C39] hover:shadow-[0_0_28px_rgba(209,140,57,0.38)]"
            >
              <!-- Image container with optical reticle overlays -->
              <div class="relative overflow-hidden rounded-xl">
                <img
                  src="./print.jpg"
                  alt="Globular star cluster sonified in Space&Sound"
                  class="block aspect-video w-full object-cover transition-all duration-300 group-hover:scale-[1.04] group-hover:brightness-125"
                />

                <!-- Subtle HUD crosshair corners inside image -->
                <span
                  aria-hidden="true"
                  class="pointer-events-none absolute top-2 left-2 h-2.5 w-2.5 border-t border-l border-[#E7D5AC]/75 transition-colors group-hover:border-[#D18C39]"
                ></span>
                <span
                  aria-hidden="true"
                  class="pointer-events-none absolute top-2 right-2 h-2.5 w-2.5 border-t border-r border-[#E7D5AC]/75 transition-colors group-hover:border-[#D18C39]"
                ></span>
                <span
                  aria-hidden="true"
                  class="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 border-b border-l border-[#E7D5AC]/75 transition-colors group-hover:border-[#D18C39]"
                ></span>
                <span
                  aria-hidden="true"
                  class="pointer-events-none absolute right-2 bottom-2 h-2.5 w-2.5 border-r border-b border-[#E7D5AC]/75 transition-colors group-hover:border-[#D18C39]"
                ></span>
              </div>

              <!-- Dual-row telemetry caption -->
              <figcaption
                aria-hidden="true"
                class="mt-2 flex items-center justify-between border-t border-[#31515A]/50 px-1.5 pt-2 font-mono text-[0.65rem] tracking-widest text-[#E7D5AC]/70 uppercase transition-colors duration-200 group-hover:text-[#D18C39]"
              >
                <span>OPTIC // STAR-CLUSTER</span>
                <span class="flex items-center gap-1.5">
                  <span class="text-[0.58rem] text-[#E7D5AC]/45 group-hover:text-[#D18C39]/80">
                    SONIFIED
                  </span>
                  <span
                    class="h-1.5 w-1.5 rounded-full bg-[#31515A] transition-colors group-hover:bg-[#D18C39]"
                  ></span>
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
@keyframes wiggle {
  0%,
  100% {
    transform: rotate(0deg) scale(1.02);
  }
  25% {
    transform: rotate(-1.8deg) scale(1.02);
  }
  50% {
    transform: rotate(1.8deg) scale(1.02);
  }
  75% {
    transform: rotate(-1deg) scale(1.02);
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
    transform: translate3d(16px, -10px, 0) scale(1.12);
    opacity: 1;
  }
}

@keyframes shooting-streak {
  0%,
  80% {
    transform: translate3d(-40px, -20px, 0);
    opacity: 0;
  }
  84% {
    opacity: 1;
  }
  94% {
    transform: translate3d(135px, 68px, 0);
    opacity: 0;
  }
  100% {
    transform: translate3d(135px, 68px, 0);
    opacity: 0;
  }
}

.hover-tremble:hover {
  animation: wiggle 0.45s ease-in-out infinite;
}

.star-twinkle-1 {
  animation: star-twinkle 4.2s ease-in-out infinite;
}

.star-twinkle-2 {
  animation: star-twinkle 5.8s ease-in-out infinite 1.6s;
}

.star-twinkle-3 {
  animation: star-twinkle 4.6s ease-in-out infinite 0.8s;
}

.galaxy-pulse {
  animation: galaxy-breathe 9s ease-in-out infinite;
}

.nebula-drift-1 {
  animation: nebula-fluctuate 11s ease-in-out infinite;
}

.nebula-drift-2 {
  animation: nebula-fluctuate 14s ease-in-out infinite reverse;
}

.mb-shooting-star {
  animation: shooting-streak 13s cubic-bezier(0.25, 0.1, 0.25, 1) infinite 2.5s;
}
</style>