<template>
  <transition
    name="fade"
    mode="out-in"
    appear
  >
    <slot></slot>
  </transition>
</template>

<script setup lang="ts">
// No props or logic needed
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 