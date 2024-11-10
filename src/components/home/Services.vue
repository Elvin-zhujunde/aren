<template>
  <div class="services-section">
    <div class="section-header">
      <h2>{{ t('home.services.title') }}</h2>
      <p>{{ t('home.services.subtitle') }}</p>
    </div>
    <div class="services-grid">
      <a-row :gutter="[32, 32]">
        <a-col v-for="service in services" :key="service.key" :xs="24" :sm="12" :md="8">
          <div class="service-card">
            <div class="service-icon" :style="{ backgroundColor: service.color }">
              <component :is="service.icon" />
            </div>
            <h3>{{ t(`home.services.items.${service.key}.title`) }}</h3>
            <p>{{ t(`home.services.items.${service.key}.description`) }}</p>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {
  CodeOutlined,
  LayoutOutlined,
  MobileOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()

const services = [
  {
    key: 'design',
    icon: LayoutOutlined,
    color: '#FFE0E0'
  },
  {
    key: 'development',
    icon: CodeOutlined,
    color: '#E0F0FF'
  },
  {
    key: 'mobile',
    icon: MobileOutlined,
    color: '#E0FFE0'
  }
]
</script>

<style scoped>
.services-section {
  padding: 100px 50px;
  background: #f8f9fa;
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

.service-card {
  text-align: center;
  padding: 40px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.service-card:hover {
  transform: translateY(-5px);
}

.service-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.service-icon :deep(svg) {
  font-size: 32px;
}

.service-card h3 {
  margin-bottom: 16px;
  font-size: 20px;
}

.service-card p {
  color: #666;
  margin: 0;
  line-height: 1.6;
}
</style> 