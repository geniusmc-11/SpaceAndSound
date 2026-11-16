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

/**
 * Dynamic Horizontal Layout Unlock:
 * When the player collects their first disc, the side sections (v-show)
 * uncollapse in the DOM. We use nextTick() + instant scrollLeft adjustment
 * to the center index (1) so the 3D game view never jumps abruptly.
 */
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

/**
 * Smooth scroll to the target section:
 * 0 = Left (Disc Gallery)
 * 1 = Center (3D 2.5D Game)
 * 2 = Right (LAB / NASA Visualizer)
 */
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

function handleCarouselScroll() {
  if (!gameStore.layoutUnlocked || !carouselRef.value) return
  const viewportWidth = carouselRef.value.clientWidth || window.innerWidth
  if (viewportWidth <= 0) return
  const currentIdx = Math.round(carouselRef.value.scrollLeft / viewportWidth)
  if (currentIdx !== gameStore.activeSection) {
    gameStore.setActiveSection(currentIdx)
  }
}

/**
 * Keyboard navigation between sections:
 * - '1' / 'G': Gallery (0) — or back to Game if already in Gallery with 'G'
 * - '2': 3D Game (1)
 * - '3' / 'L': LAB (2) — or back to Game if already in LAB with 'L'
 * - 'A' / 'D': left/right in side sections or when navMode is active.
 */
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
  <div class="min-h-dvh w-full bg-[#101820] text-[#E7D5AC]">
    <!-- 1. Project & Team Header -->
    <HeaderBar />

    <!-- 2. Introduction Text -->
    <IntroductionText />

    <!-- 3. Fallout / Deep Space Operations Jukebox Cabinet containing the Game Canvas (Centered with low padding) -->
    <section
      aria-label="Interactive Cosmic Sonification Jukebox"
      class="mx-auto w-[calc(100%-1rem)] max-w-[1040px] px-1 py-2 sm:px-2 sm:py-4"
    >
      <div
        data-testid="jukebox-cabinet"
        class="relative overflow-hidden rounded-t-[2.75rem] rounded-b-3xl border-2 border-[#31515A] bg-[#1D303B] p-2 sm:p-3 shadow-[0_24px_60px_rgba(0,0,0,0.75),inset_0_2px_0_rgba(231,213,172,0.2)]"
      >
        <!-- Ambient Fallout Vacuum-Tube Glows -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -top-10 left-1/2 h-28 w-3/4 -translate-x-1/2 rounded-full bg-[#D18C39]/20 blur-3xl"
        ></div>

        <!-- SVG Fallout Jukebox Arch Crown & Speaker Grille -->
        <div class="relative mb-2 overflow-hidden rounded-t-[2.2rem] border border-[#31515A] bg-[#101820] px-3 py-2">
          <svg
            aria-hidden="true"
            viewBox="0 0 800 68"
            class="h-11 w-full sm:h-14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Outer Metallic Arch -->
            <path
              d="M8 62 C8 22, 120 6, 400 6 C680 6, 792 22, 792 62 Z"
              fill="#1D303B"
              stroke="#31515A"
              stroke-width="3"
            />
            <!-- Glowing Amber Jukebox Neon Tube Arch -->
            <path
              d="M28 58 C28 28, 140 14, 400 14 C660 14, 772 28, 772 58"
              stroke="#D18C39"
              stroke-width="2.5"
              stroke-dasharray="14 6"
            />
            <!-- Left Speaker Grille Ribs -->
            <g stroke="#31515A" stroke-width="2.5" stroke-linecap="round">
              <line x1="75" y1="36" x2="175" y2="36" />
              <line x1="65" y1="44" x2="175" y2="44" />
              <line x1="55" y1="52" x2="175" y2="52" />
              <!-- Right Speaker Grille Ribs -->
              <line x1="625" y1="36" x2="725" y2="36" />
              <line x1="625" y1="44" x2="735" y2="44" />
              <line x1="625" y1="52" x2="745" y2="52" />
            </g>
            <!-- Left & Right Vacuum Tube Indicators -->
            <circle
              cx="210"
              cy="42"
              r="7"
              :fill="leftButtonLit ? '#D18C39' : '#101820'"
              stroke="#D18C39"
              stroke-width="2"
            />
            <circle
              cx="590"
              cy="42"
              r="7"
              :fill="rightButtonLit ? '#D18C39' : '#101820'"
              stroke="#D18C39"
              stroke-width="2"
            />
            <!-- Center Fallout / Deep Space Operations Badge Plate -->
            <rect
              x="245"
              y="24"
              width="310"
              height="32"
              rx="8"
              fill="#101820"
              stroke="#D18C39"
              stroke-width="2"
            />
            <text
              x="400"
              y="44"
              text-anchor="middle"
              fill="#E7D5AC"
              font-family="monospace"
              font-size="13"
              font-weight="bold"
              letter-spacing="3"
            >
              DEEP SPACE // JUKEBOX MK-IV
            </text>
          </svg>
        </div>

        <!-- Jukebox CRT Screen Frame (Contains the 3D Game Canvas & Horizontal Sections) -->
        <div
          ref="jukeboxScreenRef"
          data-testid="jukebox-screen"
          :class="
            isGameFullscreen
              ? 'fixed inset-0 z-50 flex h-dvh w-screen flex-col bg-[#101820]'
              : 'relative h-[520px] w-full overflow-hidden rounded-xl border-2 border-[#31515A] bg-[#101820] shadow-[inset_0_0_24px_rgba(0,0,0,0.85)] sm:h-[600px] md:h-[650px]'
          "
        >
          <!-- Exit Fullscreen Button when in Fullscreen Mode -->
          <button
            v-if="isGameFullscreen && isGamePoweredOn"
            type="button"
            data-testid="exit-fullscreen-btn"
            class="fixed top-3 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full border-2 border-[#D18C39] bg-[#101820]/95 px-4 py-1 text-xs font-extrabold tracking-wider text-[#E7D5AC] uppercase shadow-[0_0_16px_rgba(209,140,57,0.5)] hover:bg-[#D18C39] hover:text-[#101820]"
            @click="exitGameFullscreen"
          >
            ✕ Exit Fullscreen [ESC]
          </button>

          <div class="relative h-full w-full overflow-hidden">
            <!-- Main Horizontal Carousel (Gallery [0] | 3D Game [1] | LAB [2]) -->
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
            <!-- LEFT SECTION (Index 0): Disc Gallery (Hidden initially with v-show) -->
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

            <!-- RIGHT SECTION (Index 2): LAB / NASA Visualizer (Hidden initially with v-show) -->
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

            <div
              v-if="!isGamePoweredOn && !isPoweringOff"
              data-testid="game-off-screen"
              aria-label="Game powered off"
              class="crt-scanlines absolute inset-0 grid place-items-center bg-[#030506] text-xs font-bold tracking-[0.4em] text-[#D18C39]/40"
            >
              SYSTEM STANDBY
              <span
                aria-hidden="true"
                class="absolute right-5 bottom-5 h-2 w-2 rounded-full bg-[#D18C39]/70 shadow-[0_0_8px_rgba(209,140,57,0.65)]"
              ></span>
            </div>
          </div>

          <!-- 32-Bit Edge Navigation Buttons (Touch + Keyboard Shortcut Indicators after unlocking first disc) -->
          <template v-if="isGamePoweredOn && gameStore.layoutUnlocked">
            <!-- Left Edge Indicator -->
            <button
              v-if="gameStore.activeSection > 0"
              type="button"
              data-testid="edge-indicator-left"
              class="absolute top-1/2 left-1.5 z-30 -translate-y-1/2 border-2 border-[#D18C39] bg-[#101820]/95 px-2 py-3 text-[10px] font-black uppercase tracking-widest text-[#E7D5AC] shadow-[3px_3px_0px_#000] transition hover:bg-[#D18C39] hover:text-[#101820]"
              @click="scrollToSection(gameStore.activeSection - 1, true)"
            >
              ◄ {{ gameStore.activeSection === 1 ? 'GALLERY [G/1]' : 'GAME [2]' }}
            </button>

            <!-- Right Edge Indicator -->
            <button
              v-if="gameStore.activeSection < 2"
              type="button"
              data-testid="edge-indicator-right"
              class="absolute top-1/2 right-1.5 z-30 -translate-y-1/2 border-2 border-[#D18C39] bg-[#101820]/95 px-2 py-3 text-[10px] font-black uppercase tracking-widest text-[#D18C39] shadow-[3px_3px_0px_#000] transition hover:bg-[#D18C39] hover:text-[#101820]"
              @click="scrollToSection(gameStore.activeSection + 1, true)"
            >
              {{ gameStore.activeSection === 1 ? 'LAB [L/3]' : 'GAME [2]' }} ►
            </button>
          </template>
        </div>

        <!-- Bottom Jukebox Control Deck: Left Illuminated Button + Center "Try it out!" Fullscreen Play Button + Right Illuminated Button -->
        <div
          class="mt-2.5 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border border-[#31515A] bg-[#101820] px-4 py-3 sm:px-8"
        >
          <!-- Left Fallout Jukebox Button (Illuminates when pressed) -->
          <button
            type="button"
            data-testid="jukebox-btn-left"
            aria-label="Tube A knob"
            :aria-pressed="leftButtonLit"
            class="inline-flex h-16 w-16 cursor-pointer items-center justify-center rounded-full p-0 transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D18C39]"
            :class="
              leftButtonLit
                ? 'drop-shadow-[0_0_12px_rgba(209,140,57,0.9)]'
                : 'hover:drop-shadow-[0_0_8px_rgba(209,140,57,0.65)]'
            "
            @click="toggleLeftJukeboxButton"
          >
            <img
              src="/sprites/perilla1.gif"
              alt="Tube A knob"
              class="pixelated h-full w-full object-contain"
            />
          </button>

          <!-- Center "Try it out!" Play / Fullscreen Button -->
          <button
            type="button"
            data-testid="jukebox-try-it-out-btn"
            :aria-label="isGamePoweredOn ? 'Turn game off' : 'Try it out in fullscreen'"
            :aria-pressed="isGamePoweredOn"
            class="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-[#E7D5AC]/40 bg-[#D18C39] px-7 py-3 text-sm font-black tracking-wider text-[#101820] uppercase shadow-[0_0_24px_rgba(209,140,57,0.55),inset_0_1px_1px_rgba(231,213,172,0.5)] transition-all duration-200 hover:scale-105 hover:brightness-110 hover:shadow-[0_0_32px_rgba(209,140,57,0.85)] active:scale-95 sm:text-base"
            @click="handleTryItOutFullscreen"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              class="h-5 w-5 shrink-0"
            >
              <path
                v-if="!isGamePoweredOn"
                d="M8 5v14l11-7z"
                fill="currentColor"
              />
              <template v-else>
                <path
                  d="M12 2v10"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2.5"
                />
                <path
                  d="M18.36 6.64a8 8 0 1 1-12.72 0"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2.5"
                />
              </template>
            </svg>
            <span>{{ isGamePoweredOn ? 'Turn off' : 'Try it out!' }}</span>
          </button>

          <!-- Right Fallout Jukebox Button (Illuminates when pressed) -->
          <button
            type="button"
            data-testid="jukebox-btn-right"
            aria-label="Tube B knob"
            :aria-pressed="rightButtonLit"
            class="inline-flex h-16 w-16 cursor-pointer items-center justify-center rounded-full p-0 transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D18C39]"
            :class="
              rightButtonLit
                ? 'drop-shadow-[0_0_12px_rgba(209,140,57,0.9)]'
                : 'hover:drop-shadow-[0_0_8px_rgba(209,140,57,0.65)]'
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
    <FooterBar />
  </div>
</template>
