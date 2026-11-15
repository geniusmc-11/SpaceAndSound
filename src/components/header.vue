<script setup lang="ts">
const teamLogoPath = '/images/AvatarC.jpg';
const projectLogoPath = '/images/avatar.png';
</script>

<template>
  <div class="relative mx-auto w-[calc(100%-2rem)] max-w-[1040px]">
    <!-- Resplandores ambientales detrás del cristal para refracción -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -top-3 left-10 h-16 w-48 rounded-full bg-[#D18C39]/20 blur-2xl"
    ></div>
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -bottom-3 right-12 h-16 w-56 rounded-full bg-[#31515A]/50 blur-2xl"
    ></div>

    <header
      aria-label="Identidad del proyecto SpaceAndSound y del equipo SynapseTrinity"
      class="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-t-[#E7D5AC]/25 border-r-[#31515A]/70 border-b-[#31515A]/50 border-l-[#E7D5AC]/15 bg-[#1D303B]/45 px-4 py-3 text-[#E7D5AC] shadow-[inset_0_1px_1px_rgba(231,213,172,0.22),0_20px_44px_rgba(0,0,0,0.55)] backdrop-blur-xl backdrop-saturate-150 sm:rounded-full sm:px-8"
    >
      <!-- Micro-retícula técnica interna -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#31515A1f_1px,transparent_1px),linear-gradient(to_bottom,#31515A1f_1px,transparent_1px)] bg-[size:20px_20px]"
      ></div>

      <!-- Efecto discreto de onda acústica continua dentro del cristal -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden opacity-60 [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"
      >
        <!-- Onda primaria ámbar de baja amplitud -->
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

        <!-- Onda secundaria armónica en azul acero -->
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

      <!-- Reflejo especular diagonal de vidrio -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#E7D5AC]/[0.09] via-transparent to-[#31515A]/[0.14]"
      ></div>

      <!-- Remaches industriales laterales -->
      <span
        aria-hidden="true"
        class="absolute top-1/2 left-3 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full border border-[#31515A] bg-[#101820] sm:block"
      ></span>
      <span
        aria-hidden="true"
        class="absolute top-1/2 right-3 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full border border-[#31515A] bg-[#101820] sm:block"
      ></span>

      <!-- Módulo izquierdo: Identidad del Proyecto -->
      <div class="relative z-10 flex items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D18C39]/85 bg-[#101820]/75 p-0.5 shadow-[inset_0_1px_1px_rgba(231,213,172,0.25),0_0_14px_rgba(209,140,57,0.28)] backdrop-blur-md"
        >
          <img
            v-if="projectLogoPath"
            :src="projectLogoPath"
            alt="Logo del proyecto SpaceAndSound"
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
            Rockola de Sonificación
          </span>
        </div>
      </div>

      <!-- Módulo central: Telemetría acústica con micro-onda animada -->
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
          Rockola
        </span>
      </div>

      <!-- Módulo derecho: Identidad del Equipo -->
      <div
        class="relative z-10 flex items-center gap-2.5 rounded-full border border-[#31515A] border-t-[#E7D5AC]/20 bg-[#101820]/75 py-1 pr-1.5 pl-4 shadow-[inset_0_1px_0_rgba(231,213,172,0.12)] backdrop-blur-md transition-colors duration-200 hover:border-[#D18C39]/70"
      >
        <div class="flex flex-col text-right">
          <span
            class="font-mono text-[0.58rem] font-bold tracking-widest text-[#D18C39] uppercase"
          >
            Equipo
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
            alt="Logo del equipo SynapseTrinity"
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
</style>