<template>
  <div class="works-section">
    <div class="section-header">
      <h2>{{ t('home.works.title') }}</h2>
      <p>{{ t('home.works.subtitle') }}</p>
    </div>
    <div class="works-filter">
      <a-radio-group v-model:value="currentCategory" button-style="solid">
        <a-radio-button v-for="cat in categories" :key="cat.key" :value="cat.key">
          {{ t(`home.works.categories.${cat.key}`) }}
        </a-radio-button>
      </a-radio-group>
    </div>
    <div class="works-grid">
      <a-row :gutter="[24, 24]">
        <a-col 
          v-for="work in filteredWorks" 
          :key="work.id" 
          :xs="24" 
          :sm="12" 
          :md="8"
        >
          <div 
            class="work-card" 
            :data-aos="work.animation"
            @click="handleWorkClick(work)"
          >
            <div class="work-image" :style="{ backgroundColor: work.bgColor }">
              <div class="work-overlay">
                <a-button type="primary" shape="round">
                  {{ t('home.works.viewDetails') }}
                </a-button>
              </div>
              <span class="work-category">
                {{ t(`home.works.categories.${work.category}`) }}
              </span>
            </div>
            <div class="work-info">
              <h3>{{ t(`home.works.items.${work.key}.title`) }}</h3>
              <p>{{ t(`home.works.items.${work.key}.description`) }}</p>
              <div class="work-tags">
                <a-tag v-for="tag in work.tags" :key="tag">{{ tag }}</a-tag>
              </div>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>
    <div class="works-more">
      <a-button type="primary" shape="round" size="large">
        {{ t('home.works.viewMore') }}
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const categories = [
  { key: 'all', label: 'All' },
  { key: 'design', label: 'Design' },
  { key: 'development', label: 'Development' },
  { key: 'mobile', label: 'Mobile' }
]

const currentCategory = ref('all')

const works = [
  {
    id: 1,
    key: 'dashboard',
    category: 'design',
    bgColor: '#FFE0E0',
    tags: ['UI/UX', 'Figma', 'Dashboard'],
    animation: 'fade-up'
  },
  {
    id: 2,
    key: 'ecommerce',
    category: 'development',
    bgColor: '#E0F0FF',
    tags: ['Vue.js', 'Node.js', 'MongoDB'],
    animation: 'fade-up'
  },
  {
    id: 3,
    key: 'fitness',
    category: 'mobile',
    bgColor: '#E0FFE0',
    tags: ['React Native', 'Firebase'],
    animation: 'fade-up'
  },
  {
    id: 4,
    key: 'social',
    category: 'development',
    bgColor: '#F0E0FF',
    tags: ['Vue.js', 'GraphQL', 'AWS'],
    animation: 'fade-up'
  },
  {
    id: 5,
    key: 'travel',
    category: 'mobile',
    bgColor: '#FFE0B0',
    tags: ['Flutter', 'Firebase'],
    animation: 'fade-up'
  },
  {
    id: 6,
    key: 'portfolio',
    category: 'design',
    bgColor: '#E0FFE0',
    tags: ['UI/UX', 'Web Design'],
    animation: 'fade-up'
  }
]

const filteredWorks = computed(() => {
  if (currentCategory.value === 'all') {
    return works
  }
  return works.filter(work => work.category === currentCategory.value)
})

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
  margin-bottom: 40px;
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

.works-filter {
  text-align: center;
  margin-bottom: 40px;
}

.work-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
}

.work-card:hover {
  transform: translateY(-5px);
}

.work-card:hover .work-overlay {
  opacity: 1;
}

.work-image {
  height: 240px;
  position: relative;
  overflow: hidden;
}

.work-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.work-category {
  position: absolute;
  bottom: 20px;
  left: 20px;
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
  margin-bottom: 16px;
}

.work-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.works-more {
  text-align: center;
  margin-top: 60px;
}

@media (max-width: 768px) {
  .works-section {
    padding: 60px 20px;
  }
  
  .work-image {
    height: 200px;
  }
}
</style> 