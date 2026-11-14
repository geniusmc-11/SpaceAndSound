<template>
<!-- Contenedor principal adaptativo -->
<div class="w-full px-4 py-6 sm:px-6 md:py-10">
  
  <article 
    class="mx-auto w-full max-w-prose md:max-w-2xl lg:max-w-3xl 
           rounded-2xl bg-slate-800 p-6 sm:p-8 md:p-10 
           text-base sm:text-lg leading-relaxed text-cyan-900 
           shadow-xl ring-1 ring-white/10 backdrop-blur-md"
  >
    <!-- Primer bloque de texto hasta "perceive." -->
    <p class="mb-5">
      <strong class="font-semibold text-white">Space&amp;Sound</strong> is an open-source 3D pixel-art video game developed by a three-member team for the <strong class="text-indigo-300">NASA Space Apps Challenge</strong> in the <strong class="text-indigo-300">Jukebox</strong> category. Space is traditionally experienced through visuals, creating an invisible barrier for people with visual impairments. <strong class="font-semibold text-white">Space&amp;Sound</strong> breaks down that barrier by transforming astronomical imagery into dynamic, interactive audio—turning data from the cosmos into an experience that everyone can perceive.
    </p>

    <!-- Salto de línea + Imagen flotante a la izquierda + Segundo bloque -->
    <div class="clearfix">
      <img
        src="./print.jpg"
        alt="Globular star cluster sonified in Space&Sound"
        class="hover-tremble float-none mx-auto mb-4 block aspect-video w-56 rounded-xl object-cover 
               ring-1 ring-white/20
               sm:float-right sm:mr-6 sm:mb-2 sm:w-56 md:w-64 
               cursor-pointer transition-all duration-300 
               hover:brightness-125 hover:ring-amber-300/60 
               hover:drop-shadow-[0_0_20px_rgba(147,197,253,0.85)]"
      />

      <p>
        Players explore nostalgic 3D pixel-art environments to discover and collect cosmic records, unlocking a dynamic information screen for each disc that reveals the story and science behind the celestial object it represents. As a fully open-source initiative, <strong class="font-semibold text-white">Space&amp;Sound</strong> invites developers, educators, and space enthusiasts worldwide to play, adapt, and expand the way we sense the stars.
      </p>
    </div>

  </article>
</div>
</template>

<script>

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
