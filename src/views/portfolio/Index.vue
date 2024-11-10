<template>
  <div class="portfolio-page">
    <h1>{{ t('menu.portfolio') }}</h1>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.portfolio-page {
  padding-top: 64px;
  min-height: 100vh;
}
</style> 