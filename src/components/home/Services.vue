<template>
  <div class="services-section">
    <div class="section-header">
      <h2>{{ t('home.services.title') }}</h2>
      <p>{{ t('home.services.subtitle') }}</p>
    </div>
    <div class="services-grid">
      <a-row :gutter="[32, 32]">
        <a-col v-for="service in services" :key="service.key" :xs="24" :sm="12" :md="8">
          <div 
            class="service-card"
            :data-aos="service.animation"
            :data-aos-delay="service.delay"
          >
            <div class="service-icon-wrapper">
              <div class="service-icon" :style="{ backgroundColor: service.color }">
                <component :is="service.icon" />
              </div>
              <div class="service-icon-bg" :style="{ backgroundColor: service.color }"></div>
            </div>
            <h3>{{ t(`home.services.items.${service.key}.title`) }}</h3>
            <p>{{ t(`home.services.items.${service.key}.description`) }}</p>
            <ul class="service-features">
              <li v-for="(feature, index) in service.features" :key="index">
                <CheckOutlined class="feature-icon" />
                {{ t(`home.services.items.${service.key}.features.${feature}`) }}
              </li>
            </ul>
            <a-button type="link" class="learn-more">
              {{ t('home.services.learnMore') }}
              <RightOutlined />
            </a-button>
          </div>
        </a-col>
      </a-row>
    </div>
    <div class="services-cta">
      <h3>{{ t('home.services.cta.title') }}</h3>
      <p>{{ t('home.services.cta.description') }}</p>
      <a-button type="primary" size="large" shape="round">
        {{ t('home.services.cta.button') }}
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {
  CodeOutlined,
  LayoutOutlined,
  MobileOutlined,
  CheckOutlined,
  RightOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()

const services = [
  {
    key: 'design',
    icon: LayoutOutlined,
    color: '#1890ff',
    features: ['responsive', 'userCentric', 'modern'],
    animation: 'fade-up',
    delay: '0'
  },
  {
    key: 'development',
    icon: CodeOutlined,
    color: '#52c41a',
    features: ['performance', 'scalable', 'secure'],
    animation: 'fade-up',
    delay: '200'
  },
  {
    key: 'mobile',
    icon: MobileOutlined,
    color: '#722ed1',
    features: ['native', 'crossPlatform', 'offline'],
    animation: 'fade-up',
    delay: '400'
  }
]
</script>

<style scoped>
.services-section {
  padding: 100px 50px;
  background: #f8f9fa;
  overflow: hidden;
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
  background: #fff;
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.service-card:hover {
  transform: translateY(-10px);
}

.service-icon-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 30px;
}

.service-icon {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.service-icon-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  top: 8px;
  left: 8px;
  opacity: 0.2;
  transition: all 0.3s ease;
}

.service-card:hover .service-icon-bg {
  transform: translate(-4px, -4px);
}

.service-icon :deep(svg) {
  font-size: 32px;
  color: #fff;
}

.service-card h3 {
  font-size: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

.service-card p {
  color: #666;
  margin-bottom: 24px;
  line-height: 1.6;
}

.service-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
}

.service-features li {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: #666;
}

.feature-icon {
  color: #52c41a;
  margin-right: 8px;
}

.learn-more {
  padding: 0;
  height: auto;
  font-weight: 500;
}

.learn-more :deep(svg) {
  transition: transform 0.3s ease;
}

.learn-more:hover :deep(svg) {
  transform: translateX(4px);
}

.services-cta {
  text-align: center;
  margin-top: 80px;
  padding: 60px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.services-cta h3 {
  font-size: 28px;
  margin-bottom: 16px;
  font-weight: 600;
}

.services-cta p {
  color: #666;
  margin-bottom: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 768px) {
  .services-section {
    padding: 60px 20px;
  }
  
  .services-cta {
    padding: 40px 20px;
    margin-top: 60px;
  }
}
</style> 