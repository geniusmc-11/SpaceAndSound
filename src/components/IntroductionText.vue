<script setup lang="ts">
import { ref } from 'vue'
import { useSonifier } from '@/composables/useSonifier'
import printImgUrl from './print.jpg'

const sonifier = useSonifier()

const INTRO_STAR_DISC = {
  id: 'intro-globular-cluster',
  title: 'Globular Star Cluster',
  category: 'espacial',
  sonificationMode: 'espacial',
  rarity: 'legendario',
  imageUrl: printImgUrl,
}

const isHovering = ref(false)
const hoverNormX = ref(0.5)
const hoverNormY = ref(0.5)
const hoverNote = ref('')
let tapClearTimer: ReturnType<typeof setTimeout> | null = null

function clearTapTimer() {
  if (tapClearTimer !== null) {
    clearTimeout(tapClearTimer)
    tapClearTimer = null
  }
}

async function sonifyAtPointer(event: MouseEvent | TouchEvent) {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  const point = 'touches' in event ? event.touches[0] || event.changedTouches[0] : event
  if (!point) return

  clearTapTimer()
  const rect = target.getBoundingClientRect()
  const normX = Math.max(0, Math.min(1, (point.clientX - rect.left) / Math.max(1, rect.width)))
  const normY = Math.max(0, Math.min(1, (point.clientY - rect.top) / Math.max(1, rect.height)))
  hoverNormX.value = normX
  hoverNormY.value = normY
  isHovering.value = true
  sonifier.setHoverActive(true)

  const telemetry = await sonifier.probeHoverPixel(normX, normY, INTRO_STAR_DISC)
  if (isHovering.value && telemetry?.primaryNote) {
    hoverNote.value = telemetry.primaryNote
  }

  if (event.type === 'click' || event.type === 'touchstart') {
    tapClearTimer = setTimeout(() => {
      stopHoverSonify()
    }, 650)
  }
}

function stopHoverSonify() {
  clearTapTimer()
  isHovering.value = false
  hoverNote.value = ''
  sonifier.setHoverActive(false)
}
</script>

<template>
  <div class="relative mx-auto w-[calc(100%-2rem)] max-w-[1040px] py-6 md:py-10">
    
    <!-- Contenedor Principal Estilo 8-bits -->
    <article
      aria-labelledby="mission-briefing-title"
      class="pixel-box relative overflow-hidden border-4 border-[#31515A] bg-[#101820] text-[#E7D5AC] shadow-[8px_8px_0px_#000000]"
    >
      <!-- Fondo Estrellado Pixel Art -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <svg
          viewBox="0 0 1000 460"
          preserveAspectRatio="xMidYMid slice"
          class="h-full w-full"
        >
          <!-- Constelaciones (Líneas rectas y bloques) -->
          <g stroke="#E7D5AC" stroke-width="2" stroke-dasharray="4 4" opacity="0.4" fill="none">
            <polyline points="68,68 195,112 265,75 340,54 430,122" />
            <line x1="195" y1="112" x2="148" y2="165" />
          </g>

          <!-- Planetas / Galaxias Pixeladas (Sustituyen los gradientes) -->
          <g transform="translate(885, 92)" fill="#D18C39" opacity="0.8">
            <rect x="-10" y="-10" width="20" height="20" />
            <rect x="-15" y="-5" width="30" height="10" />
            <rect x="-5" y="-15" width="10" height="30" />
            <!-- Anillo -->
            <rect x="-25" y="-2" width="10" height="4" fill="#E7D5AC" />
            <rect x="15" y="-2" width="10" height="4" fill="#E7D5AC" />
          </g>

          <!-- Capa 1: Estrellas brillantes (Bloques blancos/beige) -->
          <g class="star-twinkle-1 motion-reduce:animate-none" fill="#FFFFFF">
            <rect x="68" y="68" width="4" height="4" />
            <rect x="195" y="112" width="2" height="2" />
            <rect x="340" y="54" width="4" height="4" />
            <rect x="675" y="62" width="4" height="4" />
            <rect x="945" y="162" width="4" height="4" />
            <rect x="295" y="415" width="2" height="2" />
            <rect x="825" y="385" width="4" height="4" />
            <rect x="450" y="250" width="2" height="2" />
            <rect x="780" y="30" width="4" height="4" />
            <rect x="150" y="380" width="4" height="4" />
            <rect x="380" y="350" width="4" height="4" />
          </g>

          <!-- Capa 2: Estrellas de fondo densas (Bloques pequeños) -->
          <g class="star-twinkle-2 motion-reduce:animate-none" fill="#E7D5AC" opacity="0.6">
            <rect x="148" y="165" width="2" height="2" />
            <rect x="265" y="75" width="2" height="2" />
            <rect x="430" y="122" width="2" height="2" />
            <rect x="590" y="48" width="2" height="2" />
            <rect x="760" y="108" width="2" height="2" />
            <rect x="88" y="305" width="2" height="2" />
            <rect x="220" y="342" width="2" height="2" />
            <rect x="715" y="345" width="2" height="2" />
            <rect x="918" y="415" width="2" height="2" />
            <rect x="115" y="220" width="2" height="2" />
            <rect x="340" y="270" width="2" height="2" />
            <rect x="630" y="220" width="2" height="2" />
            <rect x="870" y="350" width="2" height="2" />
          </g>

          <!-- Capa 3: Estrellas Naranjas (Bloques naranjas) -->
          <g class="star-twinkle-3 motion-reduce:animate-none" fill="#D18C39">
            <rect x="156" y="56" width="4" height="4" />
            <rect x="632" y="96" width="4" height="4" />
            <rect x="930" y="116" width="4" height="4" />
            <rect x="545" y="422" width="4" height="4" />
            <rect x="870" y="292" width="4" height="4" />
            <rect x="220" y="90" width="4" height="4" />
            <rect x="480" y="160" width="4" height="4" />
            <rect x="740" y="310" width="4" height="4" />
          </g>

          <!-- Estrella Fugaz (Línea sólida pixelada) -->
          <g class="mb-shooting-star motion-reduce:hidden">
            <rect x="380" y="38" width="40" height="4" fill="#D18C39" transform="rotate(25 380 38)" />
            <rect x="420" y="56" width="10" height="6" fill="#FFFFFF" transform="rotate(25 380 38)" />
          </g>
        </svg>
      </div>

      <!-- Barra Superior HUD Clásica -->
      <div
        class="relative z-10 flex flex-wrap items-center justify-between border-b-4 border-[#31515A] bg-[#1D303B] px-6 py-4"
      >
        <div class="flex items-center gap-4">
          <!-- Cuadrado parpadeante retro -->
          <span class="pixel-blink block h-4 w-4 bg-[#D18C39]"></span>
          <h2
            id="mission-briefing-title"
            class="retro-text text-lg font-bold text-[#D18C39]"
          >
            MISSION_BRIEFING.EXE //
          </h2>
        </div>

        <span class="retro-text hidden text-sm text-[#E7D5AC] sm:inline">
          LVL 1 - JUKEBOX
        </span>
      </div>

      <!-- Grid Principal -->
      <div
        class="relative z-10 grid grid-cols-1 items-center gap-8 p-6 sm:p-9 md:p-11 lg:grid-cols-12 lg:gap-10"
      >
        <!-- Columna Izquierda: Texto -->
        <div class="lg:col-span-7">
          <div class="space-y-6 border-l-4 border-[#31515A] pl-6 retro-text text-xl leading-relaxed">
            <p>
              <strong class="text-[#FFFFFF]">Space&amp;Sound</strong> is an open-source 3D
              pixel-art video game developed by a three-member team for the
              <strong class="text-[#D18C39]">NASA Space Apps Challenge</strong> in the
              <strong class="text-[#D18C39]">Jukebox</strong> category. Space is often
              experienced through sight alone. <strong class="text-[#FFFFFF]">Space&amp;Sound</strong>
              explores another way to connect with our planet and the cosmos...
            </p>

            <p>
              Players explore nostalgic 3D pixel-art environments to discover and collect cosmic
              records, unlocking a dynamic information screen for each disc that reveals the story
              and science behind the celestial object it represents.
            </p>
          </div>

          <!-- Etiquetas Retro (Chips) -->
          <div class="mt-8 flex flex-wrap items-center gap-4 pl-6">
            <span
              class="border-2 border-[#31515A] bg-[#101820] px-3 py-1.5 retro-text text-sm text-[#E7D5AC] shadow-[4px_4px_0px_#31515A]"
            >
              [3D PIXEL-ART]
            </span>
            <span
              class="border-2 border-[#D18C39] bg-[#D18C39]/10 px-3 py-1.5 retro-text text-sm text-[#D18C39] shadow-[4px_4px_0px_#D18C39]"
            >
              [NASA SPACE APPS]
            </span>
            <span
              class="border-2 border-[#31515A] bg-[#101820] px-3 py-1.5 retro-text text-sm text-[#E7D5AC] shadow-[4px_4px_0px_#31515A]"
            >
              [OPEN-SOURCE]
            </span>
          </div>
        </div>

        <!-- Columna Derecha: Contenedor de Imagen -->
        <div class="flex justify-center lg:col-span-5">
          <div class="relative w-full max-w-[340px]">
            <!-- Decoración de marco exterior retro -->
            <div
              aria-hidden="true"
              class="pointer-events-none absolute -inset-4 border-2 border-dashed border-[#31515A]"
            ></div>

            <figure
              class="pixel-hover group relative cursor-pointer border-4 border-[#31515A] bg-[#1D303B] p-3 shadow-[8px_8px_0px_#000000] transition-colors hover:border-[#D18C39]"
              @mouseenter="sonifyAtPointer"
              @mousemove="sonifyAtPointer"
              @click="sonifyAtPointer"
              @touchstart.passive="sonifyAtPointer"
              @mouseleave="stopHoverSonify"
            >
              <!-- Imagen intacta, pero con contenedor recto -->
              <div class="relative overflow-hidden border-2 border-[#101820]">
                <!-- Tu imagen original. Mantiene la calidad HD, pero encaja en el diseño -->
                <img
                  src="./print.jpg"
                  alt="Globular star cluster"
                  class="block aspect-video w-full object-cover transition-all duration-150"
                  :class="isHovering ? 'brightness-110 contrast-125 saturate-150' : ''"
                />

                <!-- Visualización sonificada al hacer hover (línea de escaneo + mira) -->
                <div
                  v-if="isHovering"
                  aria-hidden="true"
                  class="pointer-events-none absolute inset-0 bg-[#D18C39]/10"
                >
                  <div
                    class="absolute top-0 bottom-0 w-0.5 bg-[#D18C39] shadow-[0_0_8px_#D18C39]"
                    :style="{ left: `${hoverNormX * 100}%` }"
                  ></div>
                  <div
                    class="absolute right-0 left-0 h-px bg-[#E7D5AC]/50"
                    :style="{ top: `${hoverNormY * 100}%` }"
                  ></div>
                </div>

                <!-- Retícula HUD 8-bits -->
                <span class="absolute top-0 left-0 h-4 w-4 border-t-4 border-l-4 border-[#E7D5AC] transition-colors group-hover:border-[#D18C39]"></span>
                <span class="absolute top-0 right-0 h-4 w-4 border-t-4 border-r-4 border-[#E7D5AC] transition-colors group-hover:border-[#D18C39]"></span>
                <span class="absolute bottom-0 left-0 h-4 w-4 border-b-4 border-l-4 border-[#E7D5AC] transition-colors group-hover:border-[#D18C39]"></span>
                <span class="absolute right-0 bottom-0 h-4 w-4 border-r-4 border-b-4 border-[#E7D5AC] transition-colors group-hover:border-[#D18C39]"></span>
              </div>

              <!-- Pie de foto estilo Terminal -->
              <figcaption
                class="mt-3 flex items-center justify-between border-t-2 border-dashed border-[#31515A] pt-2 retro-text text-sm text-[#E7D5AC] group-hover:text-[#D18C39]"
              >
                <span>>_ IMG_DATA</span>
                <span class="flex items-center gap-2">
                  <span>{{ isHovering && hoverNote ? `♪ ${hoverNote}` : 'SONIFIED' }}</span>
                  <span class="block h-2 w-2 bg-[#31515A] group-hover:bg-[#D18C39]"></span>
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
/* Importamos la fuente Pixel Art desde Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

.retro-text {
  font-family: 'VT323', monospace;
  letter-spacing: 0.05em;
}

/* Forzar renderizado duro (bloques sin suavizado) a nivel de CSS */
* {
  image-rendering: pixelated;
}

/* Animación de "temblor" a cuadros (steps) simulando bajos FPS */
@keyframes pixel-wiggle {
  0%, 100% { transform: rotate(0deg) scale(1.02); }
  25% { transform: rotate(-2deg) scale(1.02); }
  50% { transform: rotate(2deg) scale(1.02); }
  75% { transform: rotate(-2deg) scale(1.02); }
}

.pixel-hover:hover {
  /* La función steps(4) le da el movimiento robótico de los 8-bits */
  animation: pixel-wiggle 0.5s steps(2) infinite;
}

/* Parpadeo clásico de cursor de terminal */
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.pixel-blink {
  animation: blink 1s steps(1) infinite;
}

/* Animación de estrellas a cuadros (apagado/prendido de golpe) */
@keyframes star-twinkle-retro {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}

.star-twinkle-1 { animation: star-twinkle-retro 1.5s steps(2) infinite; }
.star-twinkle-2 { animation: star-twinkle-retro 2s steps(2) infinite 0.5s; }
.star-twinkle-3 { animation: star-twinkle-retro 1.2s steps(2) infinite 1s; }

/* Animación estrella fugaz dura */
@keyframes shooting-streak-retro {
  0%, 80% { transform: translate3d(-100px, -50px, 0); opacity: 0; }
  85% { opacity: 1; transform: translate3d(50px, 25px, 0); }
  90% { transform: translate3d(200px, 100px, 0); opacity: 0; }
  100% { transform: translate3d(200px, 100px, 0); opacity: 0; }
}

.mb-shooting-star {
  animation: shooting-streak-retro 6s steps(4) infinite;
}
</style>