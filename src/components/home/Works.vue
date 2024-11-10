<template>
  <div class="works-section">
    <div class="section-header">
      <h2>{{ t('home.works.title') }}</h2>
      <p>{{ t('home.works.subtitle') }}</p>
    </div>
    <div class="works-grid">
      <a-row :gutter="[24, 24]">
        <a-col v-for="work in works" :key="work.id" :xs="24" :sm="12" :md="8">
          <div class="work-card" @click="handleWorkClick(work)">
            <div 
              class="work-image" 
              :style="{ backgroundColor: work.bgColor }"
            >
              <span class="work-category">{{ t(`home.works.categories.${work.category}`) }}</span>
            </div>
            <div class="work-info">
              <h3>{{ work.title }}</h3>
              <p>{{ work.description }}</p>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const works = [
  {
    id: 1,
    title: 'Project One',
    description: 'UI/UX Design',
    category: 'design',
    bgColor: '#FFE0E0'
  },
  {
    id: 2,
    title: 'Project Two',
    description: 'Web Development',
    category: 'development',
    bgColor: '#E0F0FF'
  },
  {
    id: 3,
    title: 'Project Three',
    description: 'Mobile App',
    category: 'mobile',
    bgColor: '#E0FFE0'
  }
]

const handleWorkClick = (work) => {
  router.push({
    name: 'portfolio-details',
    query: { id: work.id }
  })
}
</script>

<style scoped>
.works-section {
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

.work-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease;
}

.work-card:hover {
  transform: translateY(-5px);
}

.work-image {
  height: 240px;
  display: flex;
  align-items: flex-end;
  padding: 20px;
}

.work-category {
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.work-info {
  padding: 20px;
  background: #fff;
}

.work-info h3 {
  margin-bottom: 8px;
  font-size: 20px;
}

.work-info p {
  color: #666;
  margin: 0;
}
</style> 