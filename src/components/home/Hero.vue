<template>
  <div class="hero">
    <div class="content">
      <h3 class="subtitle">{{ t('home.hero.hey') }}</h3>
      <h1 class="title">{{ t('home.hero.name') }}</h1>
      <div class="roles">
        <div 
          v-for="(role, index) in roles" 
          :key="index"
          class="role-item"
        >
          {{ t(`home.hero.roles.${role}`) }}
        </div>
      </div>
      <a-button type="primary" size="large" class="cta-button">
        {{ t('home.hero.contact') }}
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const roles = ['designer', 'developer', 'wordpress']
</script>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 100px 50px;
  background: #f8f9fa;
}

.content {
  max-width: 800px;
  margin: 0 auto;
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
  margin-bottom: 30px;
  animation: fadeInUp 0.6s ease 0.2s both;
}

.roles {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
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

.cta-button {
  animation: fadeInUp 0.6s ease 0.6s both;
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
</style> 