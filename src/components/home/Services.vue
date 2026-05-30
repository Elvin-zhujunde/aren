<template>
  <section class="services-section">
    <div class="home-section-shell">
      <div class="home-section-heading section-heading-centered">
        <h2>{{ t('home.services.title') }}</h2>
        <p>{{ t('home.services.subtitle') }}</p>
      </div>

      <div class="services-grid">
        <article v-for="service in services" :key="service.key" class="service-card">
          <div class="service-head">
            <div class="service-icon">
              <component :is="service.icon" />
            </div>
            <h3>{{ t(`home.services.items.${service.key}.title`) }}</h3>
          </div>

          <p>{{ t(`home.services.items.${service.key}.description`) }}</p>

          <ul class="service-features">
            <li v-for="feature in service.features" :key="feature">
              <CheckOutlined />
              <span>{{ t(`home.services.items.${service.key}.features.${feature}`) }}</span>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {
  CodeOutlined,
  LayoutOutlined,
  MobileOutlined,
  CheckOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()

const services = [
  {
    key: 'design',
    icon: LayoutOutlined,
    features: ['responsive', 'userCentric', 'modern']
  },
  {
    key: 'development',
    icon: CodeOutlined,
    features: ['performance', 'scalable', 'secure']
  },
  {
    key: 'mobile',
    icon: MobileOutlined,
    features: ['native', 'crossPlatform', 'offline']
  }
]
</script>

<style scoped>
.services-section {
  padding: clamp(72px, 8vw, 112px) 0;
  background: #fff;
}

.section-heading-centered {
  margin-inline: auto;
  text-align: center;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.service-card {
  display: flex;
  flex-direction: column;
  min-height: 320px;
  border: 1px solid @home-border;
  border-radius: 24px;
  padding: 28px;
  background: @home-bg;
  transition: border-color 0.24s @home-ease, transform 0.24s @home-ease;
}

.service-card:hover {
  border-color: rgba(24, 144, 255, 0.34);
  transform: translateY(-3px);
}

.service-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.service-icon {
  width: 48px;
  height: 48px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: @home-brand-soft;
  color: @home-brand-dark;
}

.service-icon :deep(svg) {
  font-size: 22px;
}

.service-card h3 {
  margin: 0;
  color: @home-ink;
  font-size: 22px;
  line-height: 1.2;
}

.service-card p {
  margin: 0 0 22px;
  color: @home-muted;
  line-height: 1.7;
}

.service-features {
  display: grid;
  gap: 12px;
  margin: auto 0 0;
  padding: 0;
  list-style: none;
}

.service-features li {
  display: flex;
  align-items: center;
  gap: 9px;
  color: @home-ink-soft;
  font-weight: 650;
}

.service-features :deep(svg) {
  flex: none;
  color: @home-brand;
}

@media (max-width: 980px) {
  .services-grid {
    grid-template-columns: 1fr;
  }

  .service-card {
    min-height: 0;
  }
}

@media (max-width: 640px) {
  .services-section {
    padding: 64px 0;
  }

  .service-card {
    padding: 22px;
  }
}
</style>
