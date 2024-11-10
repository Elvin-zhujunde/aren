<template>
  <div class="skills-section">
    <div class="section-header">
      <h2>{{ t('home.skills.title') }}</h2>
      <p>{{ t('home.skills.subtitle') }}</p>
    </div>
    <div class="skills-grid">
      <a-row :gutter="[24, 24]">
        <a-col v-for="(category, index) in skillCategories" :key="index" :xs="24" :md="12">
          <div class="skill-category">
            <h3>{{ t(`home.skills.categories.${category.key}.title`) }}</h3>
            <div class="skill-list">
              <div v-for="skill in category.skills" :key="skill.name" class="skill-item">
                <div class="skill-info">
                  <span class="skill-name">{{ skill.name }}</span>
                  <span class="skill-percentage">{{ skill.percentage }}%</span>
                </div>
                <a-progress :percent="skill.percentage" :show-info="false" />
              </div>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const skillCategories = [
  {
    key: 'design',
    skills: [
      { name: 'Figma', percentage: 90 },
      { name: 'Adobe XD', percentage: 85 },
      { name: 'Photoshop', percentage: 80 }
    ]
  },
  {
    key: 'development',
    skills: [
      { name: 'Vue.js', percentage: 95 },
      { name: 'React', percentage: 85 },
      { name: 'Node.js', percentage: 80 }
    ]
  }
]
</script>

<style scoped>
.skills-section {
  padding: 100px 50px;
  background: #fff;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: 36px;
  margin-bottom: 16px;
  font-weight: bold;
}

.section-header p {
  font-size: 18px;
  color: #666;
}

.skill-category {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.skill-category h3 {
  margin-bottom: 24px;
  font-size: 24px;
  color: #333;
}

.skill-item {
  margin-bottom: 20px;
}

.skill-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.skill-name {
  font-weight: 500;
}

.skill-percentage {
  color: #666;
}

:deep(.ant-progress-bg) {
  height: 8px !important;
  border-radius: 4px !important;
}
</style> 