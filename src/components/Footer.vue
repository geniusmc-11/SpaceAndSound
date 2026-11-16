<script setup>
import { CURATED_NASA_DISCS } from '@/game/NasaDatasetGenerator'

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="relative mx-auto mt-10 pb-8 w-[calc(100%-2rem)] max-w-[1040px]">
    <!-- Ambient glows behind glass for real refraction -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -top-2 left-10 h-14 w-44 rounded-full bg-[#D18C39]/20 blur-2xl"
    ></div>
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -bottom-2 right-12 h-14 w-52 rounded-full bg-[#31515A]/45 blur-2xl"
    ></div>

    <footer
      aria-label="SpaceAndSound project footer"
      class="relative overflow-hidden rounded-2xl border border-t-[#E7D5AC]/25 border-r-[#31515A]/60 border-b-[#31515A]/40 border-l-[#E7D5AC]/15 bg-[#1D303B]/40 px-5 py-4 text-[#E7D5AC] shadow-[inset_0_1px_1px_rgba(231,213,172,0.22),0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl backdrop-saturate-150 sm:px-6 sm:py-4"
    >
      <!-- Diagonal glass specular reflection -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#E7D5AC]/[0.09] via-transparent to-[#31515A]/[0.12]"
      ></div>

      <div class="relative z-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <!-- Left module: System status -->
        <div class="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            class="h-2 w-2 rounded-full bg-[#D18C39] shadow-[0_0_10px_#D18C39]"
          ></span>
          <span class="text-xs font-bold tracking-wider text-[#E7D5AC] uppercase">
            SpaceAndSound
          </span>
          <span class="hidden text-[#E7D5AC]/25 md:inline" aria-hidden="true">//</span>
          <span class="hidden text-[0.7rem] tracking-widest text-[#E7D5AC]/65 uppercase md:inline">
            Jukebox
          </span>
        </div>

        <!-- Center module: Team credits -->
        <p class="text-center text-xs text-[#E7D5AC]/85 sm:text-sm">
          © 2026 <strong class="font-semibold text-[#E7D5AC]">SynapseTrinity</strong>. All rights
          reserved.
        </p>

        <!-- Right module: Interactive glass capsules -->
        <div class="flex items-center gap-2">
          <a
            href="https://github.com/geniusmc-11/SpaceAndSound"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View SpaceAndSound repository on GitHub (opens in a new tab)"
            class="inline-flex items-center gap-2 rounded-full border border-[#E7D5AC]/15 bg-[#101820]/45 px-3.5 py-1.5 text-xs font-semibold text-[#E7D5AC] shadow-[inset_0_1px_0_rgba(231,213,172,0.15)] backdrop-blur-md transition-all duration-200 hover:border-[#D18C39]/80 hover:bg-[#D18C39]/15 hover:text-[#D18C39] hover:shadow-[0_0_14px_rgba(209,140,57,0.28)] focus-visible:ring-2 focus-visible:ring-[#D18C39] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101820] focus-visible:outline-none"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-4 w-4 shrink-0"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
          </a>

          <button
            type="button"
            aria-label="Back to top of page"
            title="Back to top"
            class="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#E7D5AC]/15 bg-[#101820]/45 text-xs font-bold text-[#E7D5AC] shadow-[inset_0_1px_0_rgba(231,213,172,0.15)] backdrop-blur-md transition-all duration-200 hover:border-[#D18C39]/80 hover:bg-[#D18C39]/15 hover:text-[#D18C39] hover:shadow-[0_0_14px_rgba(209,140,57,0.28)] focus-visible:ring-2 focus-visible:ring-[#D18C39] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101820] focus-visible:outline-none"
            @click="scrollToTop"
          >
            ↑
          </button>
        </div>
      </div>

      <details class="relative z-10 mt-4 border-t border-[#31515A]/70 pt-3">
        <summary
          class="w-fit cursor-pointer text-xs font-bold tracking-wider text-[#E7D5AC]/85 transition-colors hover:text-[#D18C39] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D18C39]"
        >
          NASA Data Credits
          <span class="font-normal text-[#E7D5AC]/60">
            — NASA Scientific Visualization Studio ({{ CURATED_NASA_DISCS.length }} datasets)
          </span>
        </summary>
        <ul class="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="disc in CURATED_NASA_DISCS"
            :key="disc.svsId"
            class="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-[#31515A]/50 bg-[#101820]/35 px-3 py-2"
          >
            <a
              :href="disc.svsUrl"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`${disc.title} on NASA SVS (opens in a new tab)`"
              class="min-w-0 truncate text-[#E7D5AC]/85 underline decoration-[#D18C39]/50 underline-offset-2 transition-colors hover:text-[#D18C39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D18C39]"
            >
              {{ disc.title }}
            </a>
            <a
              :href="disc.svsApiUrl"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`NASA SVS API record ${disc.svsId} (opens in a new tab)`"
              class="shrink-0 rounded border border-[#31515A] px-1.5 py-1 font-mono text-[0.65rem] text-[#D18C39] transition-colors hover:border-[#D18C39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D18C39]"
            >
              API ↗
            </a>
          </li>
        </ul>
        <p class="mt-3 text-[0.7rem] leading-relaxed text-[#E7D5AC]/60">
          Dataset descriptions, imagery, and scientific context are provided by NASA SVS. Each
          source page and corresponding API record is linked above.
        </p>
      </details>

    </footer>
  </div>
</template>
