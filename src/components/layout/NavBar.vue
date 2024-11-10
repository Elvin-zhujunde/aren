<template>
  <a-layout-header class="header">
    <div class="logo">LOGO</div>
    <div class="nav-content">
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="horizontal"
        :items="menuItems"
        @click="handleMenuClick"
      />
      <div class="nav-right">
        <a-select
          v-model:value="currentLang"
          style="width: 100px"
          size="small"
          bordered="false"
          @change="handleLangChange"
        >
          <a-select-option value="zh-CN">中文</a-select-option>
          <a-select-option value="en-US">English</a-select-option>
        </a-select>
      </div>
    </div>
  </a-layout-header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLanguage } from '@/locales'

const { t } = useI18n()
const router = useRouter()
const { locale, changeLanguage } = useLanguage()

const selectedKeys = ref(['home'])
const currentLang = ref(locale.value)

const menuItems = [
  {
    key: 'home',
    label: t('menu.home')
  },
  {
    key: 'portfolio',
    label: t('menu.portfolio'),
    children: [
      {
        key: 'portfolio-list',
        label: t('menu.portfolioList')
      },
      {
        key: 'portfolio-details',
        label: t('menu.portfolioDetails')
      }
    ]
  },
  {
    key: 'contact',
    label: t('menu.contact')
  }
]

const handleMenuClick = ({ key }) => {
  router.push({ name: key })
}

const handleLangChange = (value) => {
  changeLanguage(value)
  currentLang.value = value
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 50px;
}

.logo {
  margin-right: 40px;
  font-size: 20px;
  font-weight: bold;
}

.nav-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.ant-menu) {
  flex: 1;
  border-bottom: none;
}

.nav-right {
  margin-left: 20px;
  display: flex;
  align-items: center;
}

:deep(.ant-select-selector) {
  padding: 0 8px !important;
}

:deep(.ant-select-selection-item) {
  font-size: 14px;
}
</style> 