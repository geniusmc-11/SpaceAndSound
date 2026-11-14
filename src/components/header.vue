<script setup lang="ts">
const teamLogoPath = '/public/images/AvatarC.jpg';
const projectLogoPath = '/public/images/avatar.png';
</script>

<template>
  <header class="team-header" aria-label="Identidad del equipo y del proyecto" >
    <span class="team-name">SynapseTrinity</span>

    <div class="logo-group">
      <img
        v-if="teamLogoPath"
        class="logo"
        :src="teamLogoPath"
        alt="Logo de SynapseTrinity"
      />

      <img
        v-if="projectLogoPath"
        class="logo"
        :src="projectLogoPath"
        alt="Logo del proyecto"
      />
    </div>
  </header>
</template>

<style scoped>
.team-header {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.9rem;
  min-height: 3.25rem;
  padding: 0.55rem 0.75rem 0.55rem 1rem;
  border: 1px solid #31515A;
  border-radius: 9999px;
  background: #1D303B;
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.08);
}

.team-name {
  color: #E7D5AC;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.logo-group {
  display: flex;
  align-items: center;
  gap: 65.0rem;
}

.logo {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
}
</style>