<template>
  <section class="counter-section section" ref="sectionRef" :class="{ visible: isVisible }">
    <div class="container">
      <a-row :gutter="[32, 32]">
        <a-col :lg="6" :md="12" :sm="24">
          <div class="counter-item">
            <h5>{{ t('counter.join') }}</h5>
          </div>
        </a-col>
        <a-col :lg="6" :md="12" :sm="24" v-for="stat in stats" :key="stat.label">
          <div class="counter-item">
            <h2 class="counter">{{ stat.value }}</h2>
            <p>{{ t(stat.label) }}</p>
          </div>
        </a-col>
      </a-row>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

const { t } = useI18n()

defineProps<{
  stats: Array<{
    value: string
    label: string
  }>
}>()

const sectionRef = ref<HTMLElement | null>(null)
const { isVisible, observe } = useIntersectionObserver({
  threshold: 0.2
})

onMounted(() => {
  if (sectionRef.value) {
    observe(sectionRef.value)
  }
})
</script>

<style lang="less" scoped>
.counter-section {
  background: #f8f9fa;
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.6s ease-out;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.counter-item {
  text-align: center;
  padding: 30px;
  
  h2 {
    font-size: 3rem;
    font-weight: 700;
    color: @primary-color;
    margin-bottom: 1rem;
  }
  
  h5 {
    font-size: 1.5rem;
    color: @text-color;
    margin-bottom: 0;
  }
  
  p {
    color: #666;
    margin: 0;
  }
}
</style> 