<template>
  <div class="home-container">
    <hero />
    <works />
    <services />
    <skills />
    <contact />
  </div>
</template>

<script setup>
import Hero from '@/components/home/Hero.vue'
import Works from '@/components/home/Works.vue'
import Services from '@/components/home/Services.vue'
import Skills from '@/components/home/Skills.vue'
import Contact from '@/components/home/Contact.vue'
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #fff;
}
</style>