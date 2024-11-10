<template>
  <div class="section-header text-center">
    <h5>{{ t(subtitle) }}</h5>
    <h1>{{ t(title) }}</h1>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  title: string
  subtitle: string
}>()
</script>

<style lang="less" scoped>
.section-header {
  margin-bottom: 60px;
  
  h5 {
    color: @primary-color;
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
  
  h1 {
    font-size: 3rem;
    font-weight: 700;
    color: @text-color;
  }
}
</style> 