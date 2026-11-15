<template>
  <!-- Adaptive main container following Deep Space Operations palette -->
  <div class="w-full px-4 py-6 sm:px-6 md:py-10">
    <article
      class="mx-auto w-full max-w-[1040px] rounded-2xl border border-[#31515A] bg-[#1D303B] p-6 sm:p-8 md:p-10 font-sans text-base sm:text-lg leading-relaxed text-[#E7D5AC]/85 shadow-[0_16px_36px_rgba(0,0,0,0.45)] backdrop-blur-md"
    >
      <div class="mb-4 flex items-center gap-2">
        <span
          aria-hidden="true"
          class="inline-block rounded-full border border-[#31515A] bg-[#101820] px-3.5 py-1 text-xs font-bold tracking-widest text-[#D18C39] uppercase"
        >
          Mission Briefing // Deep Space Operations
        </span>
      </div>

      <!-- First text block -->
      <p class="mb-5">
        <strong class="font-semibold text-[#E7D5AC]">Space&amp;Sound</strong> is an open-source 3D pixel-art video game developed by a three-member team for the <strong class="font-semibold text-[#D18C39]">NASA Space Apps Challenge</strong> in the <strong class="font-semibold text-[#D18C39]">Jukebox</strong> category. Space is traditionally experienced through visuals, creating an invisible barrier for people with visual impairments. <strong class="font-semibold text-[#E7D5AC]">Space&amp;Sound</strong> breaks down that barrier by transforming astronomical imagery into dynamic, interactive audio—turning data from the cosmos into an experience that everyone can perceive.
      </p>

      <!-- Line break + Floating image + Second text block -->
      <div class="clearfix">
        <img
          src="./print.jpg"
          alt="Globular star cluster sonified in Space&Sound"
          class="hover-tremble float-none mx-auto mb-4 block aspect-video w-56 rounded-xl object-cover ring-1 ring-[#31515A] sm:float-right sm:ml-6 sm:mb-2 sm:w-56 md:w-64 cursor-pointer transition-all duration-300 hover:brightness-125 hover:ring-[#D18C39] hover:drop-shadow-[0_0_20px_rgba(209,140,57,0.65)]"
        />

        <p>
          Players explore nostalgic 3D pixel-art environments to discover and collect cosmic records, unlocking a dynamic information screen for each disc that reveals the story and science behind the celestial object it represents. As a fully open-source initiative, <strong class="font-semibold text-[#E7D5AC]">Space&amp;Sound</strong> invites developers, educators, and space enthusiasts worldwide to play, adapt, and expand the way we sense the stars.
        </p>
      </div>
    </article>
  </div>
</template>

<script setup>
</script>

<style>
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg) scale(1.03); }
  25% { transform: rotate(-2deg) scale(1.03); }
  50% { transform: rotate(2deg) scale(1.03); }
  75% { transform: rotate(-1.2deg) scale(1.03); }
}
.hover-tremble:hover {
  animation: wiggle 0.45s ease-in-out infinite;
}
</style>
