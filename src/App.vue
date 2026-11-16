<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSonifier } from '@/composables/useSonifier'
import HeaderBar from '@/components/header.vue'
import IntroductionText from '@/components/IntroductionText.vue'
import DiscVault from '@/components/DiscVault.vue'
import GameCanvas from '@/components/GameCanvas.vue'
import NasaPlayer from '@/components/NasaPlayer.vue'
import ConclusionSection from '@/components/conclusionv.vue'
import FooterBar from '@/components/Footer.vue'

const gameStore = useGameStore()
const sonifier = useSonifier()
const carouselRef = ref(null)
const jukeboxScreenRef = ref(null)

// Power and fullscreen state for the game screen
const isGameFullscreen = ref(false)
const isGamePoweredOn = ref(false)
const isPoweringOff = ref(false)

// Left and right Fallout jukebox console buttons that illuminate when pressed
const leftButtonLit = ref(false)
const rightButtonLit = ref(false)

function toggleLeftJukeboxButton() {
  leftButtonLit.value = !leftButtonLit.value
}

function toggleRightJukeboxButton() {
  rightButtonLit.value = !rightButtonLit.value
}

function realignCarouselInstant() {
  if (!carouselRef.value) return
  const viewportWidth = carouselRef.value.clientWidth || window.innerWidth
  carouselRef.value.style.scrollBehavior = 'auto'
  carouselRef.value.scrollLeft = gameStore.activeSection * viewportWidth
}

async function handleTryItOutFullscreen() {
  if (isGamePoweredOn.value) {
    isPoweringOff.value = true
    isGamePoweredOn.value = false
    return
  }

  isGamePoweredOn.value = true
  await nextTick()
  if (gameStore.layoutUnlocked) {
    scrollToSection(1, false)
  } else {
    realignCarouselInstant()
  }

  if (jukeboxScreenRef.value && typeof jukeboxScreenRef.value.requestFullscreen === 'function') {
    try {
      isGameFullscreen.value = true
      if (!document.fullscreenElement) {
        await jukeboxScreenRef.value.requestFullscreen()
      }
    } catch {
      // Fallback to fixed CSS fullscreen if Fullscreen API is blocked in current environment
    }
  }
}

function handleGamePowerOffAnimationEnd() {
  isPoweringOff.value = false
  exitGameFullscreen()
}

async function exitGameFullscreen() {
  isGameFullscreen.value = false
  if (typeof document !== 'undefined' && document.fullscreenElement) {
    try {
      await document.exitFullscreen?.()
    } catch {
      // noop
    }
  }
  if (typeof document !== 'undefined' && document.pointerLockElement) {
    try {
      document.exitPointerLock?.()
    } catch {
      // noop
    }
  }
  await nextTick()
  realignCarouselInstant()
}

function handleFullscreenChange() {
  if (typeof document !== 'undefined' && !document.fullscreenElement && isGameFullscreen.value) {
    isGameFullscreen.value = false
    nextTick(() => realignCarouselInstant())
  } else {
    nextTick(() => realignCarouselInstant())
  }
}

watch(
  () => gameStore.layoutUnlocked,
  async (unlocked) => {
    if (!unlocked) return
    await nextTick()
    if (carouselRef.value) {
      const viewportWidth = carouselRef.value.clientWidth || window.innerWidth
      carouselRef.value.style.scrollBehavior = 'auto'
      carouselRef.value.scrollLeft = viewportWidth
      gameStore.setActiveSection(1)
    }
    if (gameStore.currentDisc && gameStore.isPlayingAudio) {
      sonifier.start(gameStore.currentDisc)
    }
  }
)

watch(
  () => gameStore.activeSection,
  (sec) => {
    if (sec !== 1 && typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock?.()
    }
  }
)

function scrollToSection(sectionIndex, smooth = true) {
  if (!gameStore.layoutUnlocked || !carouselRef.value) return
  const clamped = Math.max(0, Math.min(2, sectionIndex))
  const viewportWidth = carouselRef.value.clientWidth || window.innerWidth
  carouselRef.value.style.scrollBehavior = smooth ? 'smooth' : 'auto'
  if (typeof carouselRef.value.scrollTo === 'function') {
    carouselRef.value.scrollTo({
      left: clamped * viewportWidth,
      behavior: smooth ? 'smooth' : 'auto',
    })
  } else {
    carouselRef.value.scrollLeft = clamped * viewportWidth
  }
  gameStore.setActiveSection(clamped)
}

function openGalleryFromFooter() {
  if (!gameStore.layoutUnlocked) return
  jukeboxScreenRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  scrollToSection(0, true)
}

function handleCarouselScroll() {
  if (!gameStore.layoutUnlocked || !carouselRef.value) return
  const viewportWidth = carouselRef.value.clientWidth || window.innerWidth
  if (viewportWidth <= 0) return
  const currentIdx = Math.round(carouselRef.value.scrollLeft / viewportWidth)
  if (currentIdx !== gameStore.activeSection) {
    gameStore.setActiveSection(currentIdx)
  }
}

function handleMenuKeyNavigation(e) {
  if (e.code === 'Escape' && isGameFullscreen.value && !document.fullscreenElement) {
    exitGameFullscreen()
    return
  }

  if (!gameStore.layoutUnlocked) return

  const tag = e.target?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return

  if (e.code === 'Digit1') {
    e.preventDefault()
    scrollToSection(0, true)
    return
  }
  if (e.code === 'Digit2') {
    e.preventDefault()
    scrollToSection(1, true)
    return
  }
  if (e.code === 'Digit3') {
    e.preventDefault()
    scrollToSection(2, true)
    return
  }
  if (e.code === 'KeyG') {
    e.preventDefault()
    scrollToSection(gameStore.activeSection === 0 ? 1 : 0, true)
    return
  }
  if (e.code === 'KeyL') {
    e.preventDefault()
    scrollToSection(gameStore.activeSection === 2 ? 1 : 2, true)
    return
  }

  const inSidePanel = gameStore.activeSection !== 1
  if (!inSidePanel && !gameStore.navMode) return

  if (e.code === 'KeyA') {
    e.preventDefault()
    scrollToSection(gameStore.activeSection - 1, true)
  } else if (e.code === 'KeyD') {
    e.preventDefault()
    scrollToSection(gameStore.activeSection + 1, true)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleMenuKeyNavigation)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleMenuKeyNavigation)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<template>
  <div class="pixel-global min-h-dvh w-full bg-[#101820] text-[#E7D5AC]">
    <!-- 1. Project & Team Header -->
    <HeaderBar />

    <!-- 2. Introduction Text -->
    <IntroductionText />

    <!-- 3. Pixel Art Deep Space Operations Jukebox Cabinet con Fondo Estelar -->
    <section
      aria-label="Interactive Cosmic Sonification Jukebox"
      class="star-bg relative mx-auto w-full px-1 py-10 sm:px-2"
    >
      <!-- El contenedor de la máquina -->
      <div
        data-testid="jukebox-cabinet"
        class="relative mx-auto max-w-[1040px] border-4 border-[#31515A] bg-[#1D303B] p-2 shadow-[16px_16px_0px_rgba(0,0,0,0.6)] sm:p-4 z-10"
      >

        <!-- SVG 8-Bit Jukebox Arch Crown & Speaker Grille -->
        <div class="relative mb-4 bg-[#101820] px-3 py-3 border-4 border-[#31515A]">
          <svg
            aria-hidden="true"
            viewBox="0 0 800 68"
            class="h-11 w-full sm:h-14"
            fill="none"
            shape-rendering="crispEdges"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Outer Blocky Arch -->
            <path
              d="M 20 68 L 20 36 L 60 36 L 60 16 L 140 16 L 140 4 L 660 4 L 660 16 L 740 16 L 740 36 L 780 36 L 780 68"
              fill="#1D303B"
              stroke="#31515A"
              stroke-width="4"
            />
            <!-- Glowing Amber Jukebox Neon Tube (Stepped Dashed) -->
            <path
              d="M 36 68 L 36 44 L 76 44 L 76 24 L 156 24 L 156 12 L 644 12 L 644 24 L 724 24 L 724 44 L 764 44 L 764 68"
              stroke="#D18C39"
              stroke-width="4"
              stroke-dasharray="16 8"
            />
            <!-- Left Speaker Grille Ribs -->
            <rect x="90" y="32" width="90" height="4" fill="#31515A" />
            <rect x="80" y="44" width="100" height="4" fill="#31515A" />
            <rect x="70" y="56" width="110" height="4" fill="#31515A" />
            
            <!-- Right Speaker Grille Ribs -->
            <rect x="620" y="32" width="90" height="4" fill="#31515A" />
            <rect x="620" y="44" width="100" height="4" fill="#31515A" />
            <rect x="620" y="56" width="110" height="4" fill="#31515A" />

            <!-- Left & Right Square Vacuum Tube Indicators -->
            <rect
              x="200"
              y="40"
              width="12"
              height="12"
              :fill="leftButtonLit ? '#D18C39' : '#101820'"
              stroke="#D18C39"
              stroke-width="4"
            />
            <rect
              x="588"
              y="40"
              width="12"
              height="12"
              :fill="rightButtonLit ? '#D18C39' : '#101820'"
              stroke="#D18C39"
              stroke-width="4"
            />

            <!-- Center Pixel Badge Plate -->
            <rect
              x="230"
              y="24"
              width="340"
              height="36"
              fill="#101820"
              stroke="#D18C39"
              stroke-width="4"
            />
            <text
              x="400"
              y="48"
              text-anchor="middle"
              fill="#E7D5AC"
              font-family="'VT323', monospace"
              font-size="20"
              letter-spacing="2"
            >
              DEEP SPACE // JUKEBOX MK-IV
            </text>
          </svg>
        </div>

        <!-- Jukebox CRT Screen Frame with Plasma Pillars -->
        <div class="flex flex-row gap-2">
          <!-- Pilares Laterales Izquierdos (Estilo Rocola) -->
          <div class="hidden w-6 sm:flex flex-col items-center justify-between border-4 border-[#101820] bg-[#101820] py-2 shadow-[inset_4px_4px_0px_rgba(0,0,0,0.85)]">
            <div class="h-full w-2 bg-[#D18C39] opacity-80 plasma-tube blur-[1px]"></div>
          </div>

          <!-- PANTALLA PRINCIPAL -->
          <div
            ref="jukeboxScreenRef"
            data-testid="jukebox-screen"
            class="flex-1"
            :class="
              isGameFullscreen
                ? 'fixed inset-0 z-50 flex h-dvh w-screen flex-col bg-[#101820]'
                : 'relative h-[520px] w-full overflow-hidden border-4 border-[#101820] bg-[#101820] shadow-[inset_4px_4px_0px_rgba(0,0,0,0.85)] sm:h-[600px] md:h-[650px]'
            "
          >
            <!-- Exit Fullscreen Button when in Fullscreen Mode -->
            <button
              v-if="isGameFullscreen && isGamePoweredOn"
              type="button"
              data-testid="exit-fullscreen-btn"
              class="retro-text fixed top-4 left-1/2 z-50 -translate-x-1/2 cursor-pointer border-4 border-[#D18C39] bg-[#101820] px-6 py-2 text-sm font-bold tracking-widest text-[#E7D5AC] uppercase shadow-[6px_6px_0px_#000] hover:bg-[#D18C39] hover:text-[#101820]"
              @click="exitGameFullscreen"
            >
              ✕ Exit Fullscreen [ESC]
            </button>

            <div class="relative h-full w-full overflow-hidden">
              <!-- Main Horizontal Carousel -->
              <Transition
                name="crt-power"
                :duration="420"
                @after-leave="handleGamePowerOffAnimationEnd"
              >
                <main
                  v-if="isGamePoweredOn"
                  ref="carouselRef"
                  data-testid="main-carousel"
                  class="crt-power-screen no-scrollbar absolute inset-0 flex h-full w-full snap-x snap-mandatory"
                  :class="gameStore.layoutUnlocked ? 'overflow-x-auto' : 'overflow-x-hidden'"
                  style="scroll-snap-type: x mandatory"
                  @scroll.passive="handleCarouselScroll"
                >
                  <!-- LEFT SECTION (Index 0): Disc Gallery -->
                  <div
                    v-show="gameStore.layoutUnlocked"
                    data-testid="section-vault"
                    class="h-full w-full shrink-0 snap-center"
                  >
                    <DiscVault
                      @navigate-to-game="scrollToSection(1, true)"
                      @navigate-to-player="scrollToSection(2, true)"
                    />
                  </div>

                  <!-- CENTER SECTION (Index 1): 3D 2.5D Game -->
                  <div
                    data-testid="section-game"
                    class="h-full w-full shrink-0 snap-center"
                  >
                    <GameCanvas
                      @navigate-left="scrollToSection(0, true)"
                      @navigate-right="scrollToSection(2, true)"
                    />
                  </div>

                  <!-- RIGHT SECTION (Index 2): LAB / NASA Visualizer -->
                  <div
                    v-show="gameStore.layoutUnlocked"
                    data-testid="section-player"
                    class="h-full w-full shrink-0 snap-center"
                  >
                    <NasaPlayer
                      @navigate-to-game="scrollToSection(1, true)"
                      @navigate-to-vault="scrollToSection(0, true)"
                    />
                  </div>
                </main>
              </Transition>

              <!-- Retro Standby Screen -->
              <div
                v-if="!isGamePoweredOn && !isPoweringOff"
                data-testid="game-off-screen"
                aria-label="Game powered off"
                class="retro-text absolute inset-0 grid place-items-center bg-[#030506] text-xl font-bold tracking-[0.2em] text-[#D18C39]/60"
              >
                SYSTEM_STANDBY...
                <span
                  aria-hidden="true"
                  class="pixel-blink absolute right-6 bottom-6 block h-4 w-4 bg-[#D18C39]"
                ></span>
              </div>
            </div>

            <!-- 32-Bit Edge Navigation Buttons -->
            <template v-if="isGamePoweredOn && gameStore.layoutUnlocked">
              <!-- From the game, GALLERY is accessed from the footer (next to NASA Data Credits) -->
              <button
                v-if="gameStore.activeSection === 2"
                type="button"
                data-testid="edge-indicator-left"
                class="retro-text absolute top-1/2 left-2 z-30 -translate-y-1/2 border-4 border-[#D18C39] bg-[#101820]/95 px-3 py-4 text-xs font-black uppercase tracking-widest text-[#E7D5AC] shadow-[4px_4px_0px_#000] transition-colors hover:bg-[#D18C39] hover:text-[#101820]"
                @click="scrollToSection(gameStore.activeSection - 1, true)"
              >
                ◄ GAME [2]
              </button>

              <button
                v-if="gameStore.activeSection < 2"
                type="button"
                data-testid="edge-indicator-right"
                class="retro-text absolute top-1/2 right-2 z-30 -translate-y-1/2 border-4 border-[#D18C39] bg-[#101820]/95 px-3 py-4 text-xs font-black uppercase tracking-widest text-[#D18C39] shadow-[4px_4px_0px_#000] transition-colors hover:bg-[#D18C39] hover:text-[#101820]"
                @click="scrollToSection(gameStore.activeSection + 1, true)"
              >
                {{ gameStore.activeSection === 1 ? 'LAB [L/3]' : 'GAME [2]' }} ►
              </button>
            </template>
          </div>

          <!-- Pilares Laterales Derechos -->
          <div class="hidden w-6 sm:flex flex-col items-center justify-between border-4 border-[#101820] bg-[#101820] py-2 shadow-[inset_4px_4px_0px_rgba(0,0,0,0.85)]">
            <div class="h-full w-2 bg-[#D18C39] opacity-80 plasma-tube blur-[1px]" style="animation-delay: -1s;"></div>
          </div>
        </div>

        <!-- Bottom Jukebox Control Deck (Pixel Art Buttons) -->
        <div
          class="mt-4 flex flex-wrap items-center justify-between gap-4 border-t-4 border-[#101820] bg-[#101820] px-4 py-4 sm:px-8"
        >
          <!-- Left Fallout Jukebox Button -->
          <button
            type="button"
            data-testid="jukebox-btn-left"
            aria-label="Tube A knob"
            :aria-pressed="leftButtonLit"
            class="group flex h-16 w-16 cursor-pointer items-center justify-center border-4 bg-[#1D303B] p-1 transition-all"
            :class="
              leftButtonLit
                ? 'border-[#D18C39] shadow-[0_0_0_4px_#D18C39]'
                : 'border-[#31515A] hover:border-[#E7D5AC]'
            "
            @click="toggleLeftJukeboxButton"
          >
            <img
              src="/sprites/perilla1.gif"
              alt="Tube A knob"
              class="pixelated h-full w-full object-contain"
            />
          </button>

          <!-- Zona Central: Botón y Display de Créditos -->
          <div class="flex flex-col items-center gap-2">
            <!-- Center "Try it out!" Play / Fullscreen Button -->
            <button
              type="button"
              data-testid="jukebox-try-it-out-btn"
              :aria-label="isGamePoweredOn ? 'Turn game off' : 'Try it out in fullscreen'"
              :aria-pressed="isGamePoweredOn"
              class="retro-text inline-flex cursor-pointer items-center gap-3 border-4 border-[#101820] bg-[#D18C39] px-8 py-3 text-lg font-black tracking-wider text-[#101820] uppercase shadow-[6px_6px_0px_#31515A] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:bg-[#E7D5AC] hover:shadow-[10px_10px_0px_#31515A] active:translate-x-[4px] active:translate-y-[4px] active:bg-[#D18C39] active:shadow-[2px_2px_0px_#31515A]"
              @click="handleTryItOutFullscreen"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                class="h-6 w-6 shrink-0"
                shape-rendering="crispEdges"
              >
                <path v-if="!isGamePoweredOn" d="M6 4 L6 20 L18 12 Z" fill="currentColor" />
                <template v-else>
                  <rect x="6" y="5" width="4" height="14" fill="currentColor" />
                  <rect x="14" y="5" width="4" height="14" fill="currentColor" />
                </template>
              </svg>
              <span>{{ isGamePoweredOn ? 'TURN OFF' : 'TRY IT OUT!' }}</span>
            </button>

            <!-- Retro Coin / Credit Display -->
            <div class="retro-text flex items-center justify-center border-2 border-[#31515A] bg-[#030506] px-4 py-1 text-sm tracking-widest text-[#D18C39]">
              <span class="opacity-60">INSERT TOKEN</span>
              <span class="pixel-blink ml-2 block h-3 w-3 bg-[#D18C39]"></span>
            </div>
          </div>

          <!-- Right Fallout Jukebox Button -->
          <button
            type="button"
            data-testid="jukebox-btn-right"
            aria-label="Tube B knob"
            :aria-pressed="rightButtonLit"
            class="group flex h-16 w-16 cursor-pointer items-center justify-center border-4 bg-[#1D303B] p-1 transition-all"
            :class="
              rightButtonLit
                ? 'border-[#D18C39] shadow-[0_0_0_4px_#D18C39]'
                : 'border-[#31515A] hover:border-[#E7D5AC]'
            "
            @click="toggleRightJukeboxButton"
          >
            <img
              src="/sprites/perilla2.gif"
              alt="Tube B knob"
              class="pixelated h-full w-full object-contain"
            />
          </button>
        </div>
      </div>
    </section>

    <!-- 4. Conclusion Section -->
    <ConclusionSection />

    <!-- 5. Footer -->
    <FooterBar
      :gallery-available="isGamePoweredOn && gameStore.layoutUnlocked"
      @open-gallery="openGalleryFromFooter"
    />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

.retro-text {
  font-family: 'VT323', monospace;
}

.pixelated, .pixel-global img {
  image-rendering: pixelated;
}

/* Animación de parpadeo fuerte (Standby y Cursor) */
@keyframes blink-step {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.pixel-blink {
  animation: blink-step 1.2s steps(2, end) infinite;
}

/* Ocultar barra de scroll en Webkit pero mantener funcionalidad */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Fondo Estelar 8-Bits Generado con CSS */
@keyframes twinkle-bg {
  0%, 100% { background-position: 0 0; opacity: 1; }
  50% { opacity: 0.8; }
}
.star-bg {
  background-color: #101820;
  background-image: 
    radial-gradient(2px 2px at 40px 60px, #E7D5AC, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 120px 20px, #ffffff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 200px 100px, #D18C39, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 280px 40px, #ffffff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 320px 180px, #E7D5AC, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 40px 220px, #D18C39, rgba(0,0,0,0));
  background-repeat: repeat;
  background-size: 350px 350px;
  animation: twinkle-bg 4s infinite alternate;
}

/* Animación de los tubos de plasma de la rocola */
@keyframes plasma-flow {
  0% { transform: scaleY(0.9); opacity: 0.6; }
  50% { transform: scaleY(1); opacity: 1; }
  100% { transform: scaleY(0.9); opacity: 0.6; }
}
.plasma-tube {
  animation: plasma-flow 2s infinite ease-in-out;
  box-shadow: 0 0 10px #D18C39;
}
</style>