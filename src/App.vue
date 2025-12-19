<script setup>
import NavBar from '@/components/layout/NavBar.vue'
</script>

<template>
  <a-config-provider>
    <div class="app-container">
      <nav-bar />
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </a-config-provider>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
