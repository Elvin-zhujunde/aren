<template>
  <div class="hero">
    <div class="content">
      <div class="text-content">
        <h3 class="subtitle">{{ t('home.hero.hey') }}</h3>
        <h1 class="title">{{ t('home.hero.name') }}</h1>
        <p class="description">{{ t('home.hero.description') }}</p>
        <div class="roles">
          <div 
            v-for="(role, index) in roles" 
            :key="index"
            class="role-item"
          >
            {{ t(`home.hero.roles.${role}`) }}
          </div>
        </div>
        <div class="cta-group">
          <a-button type="primary" size="large" class="cta-button">
            {{ t('home.hero.contact') }}
          </a-button>
          <a-button size="large" class="cta-button-secondary">
            {{ t('home.hero.download') }}
          </a-button>
        </div>
        <div class="social-links">
          <a-tooltip v-for="item in socialLinks" :key="item.key" :title="item.title">
            <div class="social-icon" :style="{ backgroundColor: item.color }">
              <component :is="item.icon" />
            </div>
          </a-tooltip>
        </div>
      </div>
      <div class="stats-cards">
        <div v-for="stat in stats" :key="stat.key" class="stat-card">
          <div class="stat-number">{{ stat.number }}+</div>
          <div class="stat-label">{{ t(`home.hero.stats.${stat.key}`) }}</div>
        </div>
      </div>
    </div>
    <div class="scroll-indicator">
      <div class="mouse">
        <div class="wheel"></div>
      </div>
      <div class="scroll-text">{{ t('home.hero.scroll') }}</div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {
  GithubOutlined,
  LinkedinOutlined,
  TwitterOutlined,
  BehanceOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()
const roles = ['designer', 'developer', 'wordpress']

const socialLinks = [
  {
    key: 'github',
    icon: GithubOutlined,
    title: 'GitHub',
    color: '#24292e'
  },
  {
    key: 'linkedin',
    icon: LinkedinOutlined,
    title: 'LinkedIn',
    color: '#0077b5'
  },
  {
    key: 'twitter',
    icon: TwitterOutlined,
    title: 'Twitter',
    color: '#1da1f2'
  },
  {
    key: 'behance',
    icon: BehanceOutlined,
    title: 'Behance',
    color: '#1769ff'
  }
]

const stats = [
  {
    key: 'experience',
    number: '5'
  },
  {
    key: 'projects',
    number: '50'
  },
  {
    key: 'clients',
    number: '30'
  }
]
</script>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 100px 50px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  position: relative;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 60px;
}

.text-content {
  flex: 1;
}

.subtitle {
  font-size: 24px;
  color: #666;
  margin-bottom: 20px;
  animation: fadeInUp 0.6s ease;
}

.title {
  font-size: 64px;
  font-weight: bold;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #1890ff, #722ed1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fadeInUp 0.6s ease 0.2s both;
}

.description {
  font-size: 18px;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
  animation: fadeInUp 0.6s ease 0.3s both;
}

.roles {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  animation: fadeInUp 0.6s ease 0.4s both;
}

.role-item {
  padding: 10px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.role-item:hover {
  transform: translateY(-5px);
}

.cta-group {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  animation: fadeInUp 0.6s ease 0.5s both;
}

.cta-button-secondary {
  background: #fff;
}

.social-links {
  display: flex;
  gap: 15px;
  animation: fadeInUp 0.6s ease 0.6s both;
}

.social-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.social-icon:hover {
  transform: translateY(-3px);
}

.social-icon :deep(svg) {
  font-size: 20px;
  color: #fff;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 20px;
  animation: fadeInRight 0.6s ease 0.7s both;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
}

.scroll-indicator {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeInUp 0.6s ease 0.8s both;
}

.mouse {
  width: 30px;
  height: 50px;
  border: 2px solid #666;
  border-radius: 15px;
  position: relative;
  margin-bottom: 10px;
}

.wheel {
  width: 4px;
  height: 8px;
  background: #666;
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 2px;
  animation: scroll 1.5s infinite;
}

.scroll-text {
  color: #666;
  font-size: 14px;
}

@keyframes scroll {
  0% {
    transform: translate(-50%, 0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .content {
    flex-direction: column;
  }
  
  .title {
    font-size: 48px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
    width: 100%;
  }
}
</style> 