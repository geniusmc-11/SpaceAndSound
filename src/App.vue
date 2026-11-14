<script setup lang="ts">
import { RouterView } from 'vue-router';
import Footer from './components/Footer.vue';
import Header from './components/header.vue';
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#101820] text-[#E7D5AC]">
    <div class="flex w-full pt-5">
      <Header />
    </div>
    <main class="flex-1">
      <RouterView />
    </main>
    <Footer />
  </div>
</template>