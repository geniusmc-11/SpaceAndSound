<script setup lang="ts"></script>

<template>
  <!-- Adaptive main container aligned with Header, Conclusion & Footer -->
  <div class="relative mx-auto w-[calc(100%-2rem)] max-w-[1040px] py-6 md:py-10">
    <!-- Ambient glows behind the glass for realistic refraction -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute top-4 left-12 h-28 w-56 rounded-full bg-[#D18C39]/15 blur-3xl"
    ></div>
    <div
      aria-hidden="true"
      class="pointer-events-none absolute right-14 bottom-4 h-32 w-64 rounded-full bg-[#31515A]/45 blur-3xl"
    ></div>

    <article
      aria-labelledby="mission-briefing-title"
      class="relative overflow-hidden rounded-3xl border border-t-[#E7D5AC]/25 border-r-[#31515A]/70 border-b-[#31515A]/50 border-l-[#E7D5AC]/15 bg-[#1D303B]/45 p-6 font-sans text-base leading-relaxed text-[#E7D5AC]/85 shadow-[inset_0_1px_1px_rgba(231,213,172,0.22),0_20px_44px_rgba(0,0,0,0.55)] backdrop-blur-xl backdrop-saturate-150 sm:p-9 sm:text-lg md:p-11"
    >
      <!-- Subtle deep-space starfield (no grid, non-intrusive to reading) -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,rgba(0,0,0,0.45)_35%,black_100%)]"
      >
        <svg
          viewBox="0 0 1000 420"
          preserveAspectRatio="xMidYMid slice"
          class="h-full w-full"
        >
          <!-- Layer 1: Gentle twinkling beige stars -->
          <g class="star-twinkle-1 motion-reduce:animate-none" fill="#E7D5AC">
            <circle cx="68" cy="48" r="1.2" opacity="0.75" />
            <circle cx="195" cy="92" r="0.9" opacity="0.55" />
            <circle cx="340" cy="34" r="1.3" opacity="0.7" />
            <circle cx="512" cy="64" r="0.9" opacity="0.5" />
            <circle cx="675" cy="42" r="1.4" opacity="0.8" />
            <circle cx="890" cy="58" r="1.1" opacity="0.65" />
            <circle cx="945" cy="142" r="1.5" opacity="0.8" />
            <circle cx="44" cy="215" r="1.1" opacity="0.6" />
            <circle cx="132" cy="340" r="1.4" opacity="0.75" />
            <circle cx="295" cy="382" r="1" opacity="0.6" />
            <circle cx="610" cy="368" r="1.2" opacity="0.65" />
            <circle cx="825" cy="355" r="1.4" opacity="0.75" />
            <circle cx="962" cy="310" r="1" opacity="0.6" />
          </g>

          <!-- Layer 2: Offset twinkling stars -->
          <g class="star-twinkle-2 motion-reduce:animate-none" fill="#E7D5AC">
            <circle cx="118" cy="135" r="1" opacity="0.6" />
            <circle cx="265" cy="55" r="1.1" opacity="0.65" />
            <circle cx="430" cy="110" r="0.8" opacity="0.45" />
            <circle cx="590" cy="28" r="1.2" opacity="0.7" />
            <circle cx="760" cy="88" r="1" opacity="0.6" />
            <circle cx="842" cy="195" r="1.2" opacity="0.65" />
            <circle cx="88" cy="285" r="0.9" opacity="0.55" />
            <circle cx="220" cy="312" r="1.2" opacity="0.6" />
            <circle cx="468" cy="350" r="0.9" opacity="0.5" />
            <circle cx="715" cy="315" r="1.1" opacity="0.6" />
            <circle cx="918" cy="385" r="1.3" opacity="0.7" />
          </g>

          <!-- Layer 3: Warm amber micro-stars & subtle 4-point glints -->
          <g class="star-twinkle-3 motion-reduce:animate-none" fill="#D18C39">
            <circle cx="156" cy="40" r="1.3" opacity="0.75" />
            <circle cx="632" cy="76" r="1.2" opacity="0.65" />
            <circle cx="930" cy="96" r="1.4" opacity="0.8" />
            <circle cx="58" cy="365" r="1.3" opacity="0.75" />
            <circle cx="545" cy="388" r="1.1" opacity="0.6" />
            <circle cx="870" cy="272" r="1.3" opacity="0.7" />

            <!-- Delicate 4-point star sparkles in outer corners -->
            <path
              d="M915 34 L916.4 39.6 L922 41 L916.4 42.4 L915 48 L913.6 42.4 L908 41 L913.6 39.6 Z"
              opacity="0.7"
            />
            <path
              d="M78 318 L79.1 322.4 L83.5 323.5 L79.1 324.6 L78 329 L76.9 324.6 L72.5 323.5 L76.9 322.4 Z"
              opacity="0.6"
            />
          </g>
        </svg>
      </div>

      <!-- Diagonal specular glass sheen -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#E7D5AC]/[0.08] via-transparent to-[#31515A]/[0.14]"
      ></div>

      <!-- Industrial corner rivets -->
      <span
        aria-hidden="true"
        class="absolute top-3.5 left-3.5 h-1.5 w-1.5 rounded-full border border-[#31515A] bg-[#101820]"
      ></span>
      <span
        aria-hidden="true"
        class="absolute top-3.5 right-3.5 h-1.5 w-1.5 rounded-full border border-[#31515A] bg-[#101820]"
      ></span>
      <span
        aria-hidden="true"
        class="absolute bottom-3.5 left-3.5 h-1.5 w-1.5 rounded-full border border-[#31515A] bg-[#101820]"
      ></span>
      <span
        aria-hidden="true"
        class="absolute bottom-3.5 right-3.5 h-1.5 w-1.5 rounded-full border border-[#31515A] bg-[#101820]"
      ></span>

      <div class="relative z-10">
        <!-- Telemetry header bar -->
        <div class="mb-6 flex items-center gap-3">
          <div
            class="inline-flex items-center gap-2.5 rounded-full border border-[#31515A] border-t-[#E7D5AC]/20 bg-[#101820]/75 px-4 py-1.5 shadow-[inset_0_1px_0_rgba(231,213,172,0.12)] backdrop-blur-md"
          >
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

          <div
            aria-hidden="true"
            class="hidden h-px flex-1 bg-gradient-to-r from-[#31515A]/80 via-[#31515A]/30 to-transparent sm:block"
          ></div>
        </div>

        <!-- First text block -->
        <p class="mb-5">
          <strong class="font-bold text-[#E7D5AC]">Space&amp;Sound</strong> is an open-source 3D
          pixel-art video game developed by a three-member team for the
          <strong class="font-semibold text-[#D18C39]">NASA Space Apps Challenge</strong> in the
          <strong class="font-semibold text-[#D18C39]">Jukebox</strong> category. Space is
          traditionally experienced through visuals, creating an invisible barrier for people with
          visual impairments. <strong class="font-bold text-[#E7D5AC]">Space&amp;Sound</strong>
          breaks down that barrier by transforming astronomical imagery into dynamic, interactive
          audio—turning data from the cosmos into an experience that everyone can perceive.
        </p>

        <!-- Floating optical viewport image + Second text block -->
        <div class="clearfix">
          <figure
            class="hover-tremble group float-none mx-auto mb-5 w-60 cursor-pointer overflow-hidden rounded-2xl border border-[#31515A] border-t-[#E7D5AC]/25 bg-[#101820]/80 p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:border-[#D18C39] hover:shadow-[0_0_24px_rgba(209,140,57,0.4)] sm:float-right sm:mb-2 sm:ml-7 sm:w-64 md:w-72"
          >
            <div class="overflow-hidden rounded-xl">
              <img
                src="./print.jpg"
                alt="Globular star cluster sonified in Space&Sound"
                class="block aspect-video w-full object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:brightness-125"
              />
            </div>
            <figcaption
              aria-hidden="true"
              class="mt-1.5 flex items-center justify-between px-1.5 font-mono text-[0.62rem] tracking-widest text-[#E7D5AC]/65 uppercase transition-colors duration-200 group-hover:text-[#D18C39]"
            >
              <span>OPTIC // STAR-CLUSTER</span>
              <span class="h-1.5 w-1.5 rounded-full bg-[#31515A] group-hover:bg-[#D18C39]"></span>
            </figcaption>
          </figure>

          <p>
            Players explore nostalgic 3D pixel-art environments to discover and collect cosmic
            records, unlocking a dynamic information screen for each disc that reveals the story
            and science behind the celestial object it represents. As a fully open-source
            initiative, <strong class="font-bold text-[#E7D5AC]">Space&amp;Sound</strong> invites
            developers, educators, and space enthusiasts worldwide to play, adapt, and expand the
            way we sense the stars.
          </p>
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

.hover-tremble:hover {
  animation: wiggle 0.45s ease-in-out infinite;
}

.star-twinkle-1 {
  animation: star-twinkle 4.5s ease-in-out infinite;
}

.star-twinkle-2 {
  animation: star-twinkle 6s ease-in-out infinite 1.8s;
}

.star-twinkle-3 {
  animation: star-twinkle 5.2s ease-in-out infinite 0.9s;
}
</style>