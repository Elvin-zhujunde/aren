<template>
  <section 
    class="portfolio-section section section-scroll-animation"
    ref="sectionRef"
    :class="{ visible: isVisible }"
  >
    <div class="container">
      <section-header
        :title="t('portfolio.title')"
        :subtitle="t('portfolio.subtitle')"
      />
      
      <a-skeleton :loading="loading" active :paragraph="{ rows: 4 }" v-if="loading">
        <a-row :gutter="[24, 24]">
          <a-col :xs="24" :sm="12" :md="8" v-for="i in 3" :key="i">
            <div style="height: 300px"></div>
          </a-col>
        </a-row>
      </a-skeleton>

      <template v-else>
        <a-row :gutter="[24, 24]">
          <a-col :xs="24" :sm="12" :md="8" v-for="work in works" :key="work.id">
            <portfolio-card :work="work" />
          </a-col>
        </a-row>

        <div class="text-center mt-4">
          <router-link to="/portfolio">
            <a-button type="primary" size="large">{{ t('portfolio.viewAll') }}</a-button>
          </router-link>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SectionHeader from '@/components/common/SectionHeader.vue'
import PortfolioCard from '@/components/portfolio/PortfolioCard.vue'
import type { Portfolio } from '@/types/api'
import { ref, onMounted } from 'vue'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

const { t } = useI18n()

defineProps<{
  works: Portfolio[]
  loading?: boolean
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
.portfolio-section {
  background: #fff;
}

.section-scroll-animation {
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.6s ease-out;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 