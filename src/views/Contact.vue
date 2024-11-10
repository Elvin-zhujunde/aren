<template>
  <div class="contact-page">
    <h1>{{ t('menu.contact') }}</h1>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.contact-page {
  padding-top: 64px;
  min-height: 100vh;
}
</style> 