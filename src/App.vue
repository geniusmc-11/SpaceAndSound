<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSonifier } from '@/composables/useSonifier'
import DiscVault from '@/components/DiscVault.vue'
import GameCanvas from '@/components/GameCanvas.vue'
import NasaPlayer from '@/components/NasaPlayer.vue'

const gameStore = useGameStore()
const sonifier = useSonifier()
const carouselRef = ref(null)

/**
 * Desbloqueo Dinámico del Layout Horizontal:
 * Cuando el jugador recoge su primer disco, las secciones laterales (v-show)
 * se descolapsan en el DOM. Usamos nextTick() + ajuste instantáneo de scrollLeft
 * al índice central (1) para que la vista actual del juego 3D jamás salte ni se mueva bruscamente.
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

/**
 * Desplazamiento suave hacia la sección indicada:
 * 0 = Izquierda (Bóveda de Discos)
 * 1 = Centro (Juego 3D 2.5D)
 * 2 = Derecha (Reproductor/Visualizador NASA)
 */
function scrollToSection(sectionIndex, smooth = true) {
  if (!gameStore.layoutUnlocked || !carouselRef.value) return
  const clamped = Math.max(0, Math.min(2, sectionIndex))
  const viewportWidth = carouselRef.value.clientWidth || window.innerWidth
  carouselRef.value.style.scrollBehavior = smooth ? 'smooth' : 'auto'
  carouselRef.value.scrollTo({
    left: clamped * viewportWidth,
    behavior: smooth ? 'smooth' : 'auto',
  })
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
 * Navegación por teclado en el menú/carrusel:
 * 'A' para ir a la izquierda, 'D' para ir a la derecha
 * (activa cuando estamos en las secciones laterales o con modo menú navMode activo).
 */
function handleMenuKeyNavigation(e) {
  if (!gameStore.layoutUnlocked) return

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
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleMenuKeyNavigation)
})
</script>

<template>
  <div class="relative h-dvh w-screen overflow-hidden bg-[#050811] text-[#e2f1ff]">
    <!-- Contenedor Principal: Carrusel Horizontal (100vw x 100dvh) con scroll-snap-type: x mandatory -->
    <main
      ref="carouselRef"
      data-testid="main-carousel"
      class="no-scrollbar flex h-dvh w-screen snap-x snap-mandatory"
      :class="gameStore.layoutUnlocked ? 'overflow-x-auto' : 'overflow-x-hidden'"
      style="scroll-snap-type: x mandatory"
      @scroll.passive="handleCarouselScroll"
    >
      <!-- SECCIÓN IZQUIERDA (Índice 0): Bóveda de Discos (Oculta inicialmente con v-show) -->
      <div
        v-show="gameStore.layoutUnlocked"
        data-testid="section-vault"
        class="h-dvh w-screen shrink-0 snap-center"
      >
        <DiscVault
          @navigate-to-game="scrollToSection(1, true)"
          @navigate-to-player="scrollToSection(2, true)"
        />
      </div>

      <!-- SECCIÓN CENTRAL (Índice 1): El Juego 3D 2.5D (100% de la pantalla al iniciar) -->
      <div
        data-testid="section-game"
        class="h-dvh w-screen shrink-0 snap-center"
      >
        <GameCanvas
          @navigate-left="scrollToSection(0, true)"
          @navigate-right="scrollToSection(2, true)"
        />
      </div>

      <!-- SECCIÓN DERECHA (Índice 2): Reproductor/Visualizador NASA (Oculta inicialmente con v-show) -->
      <div
        v-show="gameStore.layoutUnlocked"
        data-testid="section-player"
        class="h-dvh w-screen shrink-0 snap-center"
      >
        <NasaPlayer
          @navigate-to-game="scrollToSection(1, true)"
          @navigate-to-vault="scrollToSection(0, true)"
        />
      </div>
    </main>

    <!-- Indicadores Visuales Discretos Estilo 32-bits en los Bordes (Solo tras desbloquear el primer disco) -->
    <template v-if="gameStore.layoutUnlocked">
      <!-- Indicador Borde Izquierdo -->
      <button
        v-if="gameStore.activeSection > 0"
        type="button"
        data-testid="edge-indicator-left"
        class=" fixed top-1/2 left-1.5 z-30 -translate-y-1/2 border-2 border-sky-400/80 bg-[#070f20]/90 px-2 py-3 text-[10px] font-black uppercase tracking-widest text-sky-300 shadow-[3px_3px_0px_#000] transition hover:bg-sky-900"
        @click="scrollToSection(gameStore.activeSection - 1, true)"
      >
        ◄ [A] {{ gameStore.activeSection === 1 ? 'BÓVEDA' : 'JUEGO' }}
      </button>

      <!-- Indicador Borde Derecho -->
      <button
        v-if="gameStore.activeSection < 2"
        type="button"
        data-testid="edge-indicator-right"
        class="fixed top-1/2 right-1.5 z-30 -translate-y-1/2 border-2 border-amber-400/80 bg-[#070f20]/90 px-2 py-3 text-[10px] font-black uppercase tracking-widest text-amber-300 shadow-[3px_3px_0px_#000] transition hover:bg-amber-900"
        @click="scrollToSection(gameStore.activeSection + 1, true)"
      >
        {{ gameStore.activeSection === 1 ? 'NASA LAB' : 'JUEGO' }} [D] ►
      </button>
    </template>
  </div>
</template>
