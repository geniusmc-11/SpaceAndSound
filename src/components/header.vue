<script setup lang="ts">
const teamLogoPath = '/images/AvatarC.jpg';
const projectLogoPath = '/images/avatar.png';
</script>

<template>
  <div class="relative mx-auto w-[calc(100%-2rem)] max-w-[1040px]">
    <!-- Resplandores ambientales detrás del cristal para refracción -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -top-2 left-12 h-14 w-44 rounded-full bg-[#D18C39]/20 blur-2xl"
    ></div>
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -bottom-2 right-12 h-14 w-52 rounded-full bg-[#31515A]/45 blur-2xl"
    ></div>

    <header
      aria-label="Identidad del proyecto SpaceAndSound y del equipo SynapseTrinity"
      class="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-t-[#E7D5AC]/25 border-r-[#31515A]/60 border-b-[#31515A]/40 border-l-[#E7D5AC]/15 bg-[#1D303B]/40 px-4 py-2.5 shadow-[inset_0_1px_1px_rgba(231,213,172,0.22),0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl backdrop-saturate-150 sm:rounded-full sm:px-6"
    >
      <!-- Reflejo especular diagonal de vidrio -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#E7D5AC]/[0.09] via-transparent to-[#31515A]/[0.12]"
      ></div>

      <!-- Identidad del Proyecto -->
      <div class="relative z-10 flex items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D18C39]/80 bg-[#101820]/60 p-0.5 shadow-[inset_0_1px_1px_rgba(231,213,172,0.25),0_0_14px_rgba(209,140,57,0.28)] backdrop-blur-md"
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
            <span
              aria-hidden="true"
              class="h-2 w-2 rounded-full bg-[#D18C39] shadow-[0_0_10px_#D18C39]"
            ></span>
            <span class="text-sm font-extrabold tracking-wide text-[#E7D5AC] sm:text-base">
              SpaceAndSound
            </span>
          </div>
          <span
            class="hidden text-[0.68rem] font-medium tracking-widest text-[#E7D5AC]/65 uppercase sm:inline"
          >
            Rockola de Sonificación
          </span>
        </div>
      </div>

      <!-- Indicador visual estilo consola acústica en cápsula de cristal -->
      <div
        aria-hidden="true"
        class="relative z-10 hidden items-center gap-1.5 rounded-full border border-[#E7D5AC]/15 bg-[#101820]/45 px-3.5 py-1 shadow-[inset_0_1px_0_rgba(231,213,172,0.15)] backdrop-blur-md md:flex"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-[#31515A]"></span>
        <span class="h-2.5 w-0.5 rounded-full bg-[#D18C39]/60"></span>
        <span class="h-3.5 w-0.5 rounded-full bg-[#D18C39] shadow-[0_0_6px_#D18C39]"></span>
        <span class="h-2 w-0.5 rounded-full bg-[#D18C39]/75"></span>
        <span class="h-1.5 w-1.5 rounded-full bg-[#31515A]"></span>
        <span class="ml-1.5 text-[0.65rem] font-semibold tracking-[0.2em] text-[#E7D5AC]/65 uppercase">
          SYS // AUDIO-OPTIC
        </span>
      </div>

      <!-- Identidad del Equipo en cápsula de cristal -->
      <div
        class="relative z-10 flex items-center gap-2.5 rounded-full border border-[#E7D5AC]/15 bg-[#101820]/45 py-1 pr-1.5 pl-3.5 shadow-[inset_0_1px_0_rgba(231,213,172,0.15)] backdrop-blur-md"
      >
        <div class="flex flex-col text-right">
          <span class="text-[0.6rem] font-semibold tracking-wider text-[#D18C39] uppercase">
            Equipo
          </span>
          <span class="text-xs font-bold tracking-wide text-[#E7D5AC] sm:text-sm">
            SynapseTrinity
          </span>
        </div>

        <div
          class="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#E7D5AC]/25 bg-[#1D303B]/70"
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