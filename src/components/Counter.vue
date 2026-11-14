<script setup lang="ts">
import { ref } from 'vue';
const count = ref(0)
</script>

<template>
  <button
    class="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
    @click="count++"
  >
    Clicks: {{ count }}
  </button>
</template>
