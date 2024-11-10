<template>
  <section class="about-section section bg-light">
    <div class="container">
      <a-row :gutter="[32, 32]" align="middle">
        <a-col :lg="12" :md="24">
          <a-skeleton :loading="loading" active :paragraph="{ rows: 4 }" v-if="loading">
            <div style="height: 400px"></div>
          </a-skeleton>

          <template v-else>
            <div class="about-content wow fadeInRight">
              <section-header
                :title="t('about.title')"
                :subtitle="t('about.subtitle')"
              />
              <p>{{ t('about.description') }}</p>
              <div class="skills-progress mt-4">
                <div v-for="skill in skills" :key="skill.name" class="skill-item">
                  <span class="skill-name">{{ skill.name }}</span>
                  <a-progress 
                    :percent="skill.percent" 
                    :stroke-color="skill.color"
                    :show-info="false"
                  />
                </div>
              </div>
              <a-button type="primary" size="large" class="mt-4">
                {{ t('about.button') }}
              </a-button>
            </div>
          </template>
        </a-col>
        <a-col :lg="12" :md="24">
          <gradient-card 
            :gradient="aboutGradient"
            height="400px"
          />
        </a-col>
      </a-row>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SectionHeader from '@/components/common/SectionHeader.vue'
import GradientCard from '@/components/common/GradientCard.vue'
import type { Skill } from '@/types/api'

const { t } = useI18n()

defineProps<{
  skills: Skill[]
  aboutGradient: string
  loading?: boolean
}>()
</script>

<style lang="less" scoped>
.about-section {
  .about-content {
    p {
      color: #666;
      font-size: 1.1rem;
      line-height: 1.8;
      margin-bottom: 2rem;
    }

    .skill-item {
      margin-bottom: 2rem;

      .skill-name {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
    }
  }
}
</style> 