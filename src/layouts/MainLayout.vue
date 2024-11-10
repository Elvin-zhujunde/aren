<template>
  <a-layout class="main-layout">
    <a-layout-header :class="{ 'header-fixed': isHeaderFixed }">
      <div class="header-content">
        <div class="logo">
          <router-link to="/">
            <div class="logo-text">阿亻skills</div>
          </router-link>
        </div>
        
        <div class="header-right">
          <language-switch />
          <a-menu
            v-model:selectedKeys="selectedKeys"
            mode="horizontal"
            class="desktop-menu"
          >
            <a-menu-item key="home">
              <router-link to="/">{{ t('nav.home') }}</router-link>
            </a-menu-item>
            <a-sub-menu key="portfolio">
              <template #title>{{ t('nav.portfolio') }}</template>
              <a-menu-item key="portfolio-grid">
                <router-link to="/portfolio">{{ t('portfolio.title') }}</router-link>
              </a-menu-item>
            </a-sub-menu>
            <a-sub-menu key="pages">
              <template #title>{{ t('nav.pages') }}</template>
              <a-menu-item key="about">
                <router-link to="/about">{{ t('nav.about') }}</router-link>
              </a-menu-item>
              <a-menu-item key="services">
                <router-link to="/services">{{ t('nav.services') }}</router-link>
              </a-menu-item>
            </a-sub-menu>
            <a-sub-menu key="blog">
              <template #title>{{ t('nav.blog') }}</template>
              <a-menu-item key="blog-grid">
                <router-link to="/blog">{{ t('blog.title') }}</router-link>
              </a-menu-item>
            </a-sub-menu>
            <a-menu-item key="contact">
              <router-link to="/contact">{{ t('nav.contact') }}</router-link>
            </a-menu-item>
          </a-menu>

          <a-button type="primary" class="download-cv">
            Download CV
            <template #icon><DownloadOutlined /></template>
          </a-button>

          <!-- Mobile Menu Trigger -->
          <div class="mobile-trigger" @click="showMobileMenu = true">
            <MenuOutlined />
          </div>
        </div>
      </div>
    </a-layout-header>

    <!-- Mobile Menu Drawer -->
    <a-drawer
      v-model:visible="showMobileMenu"
      placement="right"
      :closable="false"
      class="mobile-menu-drawer"
    >
      <a-menu mode="inline">
        <!-- Same menu items as desktop -->
      </a-menu>
    </a-drawer>

    <a-layout-content>
      <router-view></router-view>
    </a-layout-content>

    <a-layout-footer>
      <div class="footer-content">
        <div class="footer-main">
          <h2>Let's build something together</h2>
          <div class="contact-info">
            <p>Location: Your Location</p>
            <p>Email: your.email@example.com</p>
            <p>Phone: (+1) 123-456-7890</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2024 Your Name. All rights reserved.</p>
          <div class="social-links">
            <a href="#"><FacebookOutlined /></a>
            <a href="#"><TwitterOutlined /></a>
            <a href="#"><InstagramOutlined /></a>
            <a href="#"><LinkedinOutlined /></a>
          </div>
        </div>
      </div>
    </a-layout-footer>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  MenuOutlined,
  DownloadOutlined,
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  LinkedinOutlined
} from '@ant-design/icons-vue'
import LanguageSwitch from '@/components/common/LanguageSwitch.vue'

const { t } = useI18n()
const route = useRoute()
const selectedKeys = ref<string[]>([])
const showMobileMenu = ref(false)
const isHeaderFixed = ref(false)

// Update selected menu item based on route
watch(
  () => route.path,
  (path) => {
    selectedKeys.value = [path.split('/')[1] || 'home']
  },
  { immediate: true }
)

// Header scroll behavior
const handleScroll = () => {
  isHeaderFixed.value = window.scrollY > 100
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="less" scoped>
.main-layout {
  min-height: 100vh;

  :deep(.ant-layout-header) {
    background: #ffffff !important;
    padding: 0;
    height: 80px;
    line-height: 80px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
}

.header-fixed {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  background: #ffffff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: @container-max-width;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 @container-padding;
  height: 100%;
}

.logo {
  .logo-text {
    font-size: 24px;
    font-weight: 700;
    color: @heading-color;
    letter-spacing: 1px;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
  justify-content: flex-end;
}

.desktop-menu {
  min-width: 500px;
  background: transparent;
  border: none;
  
  :deep(.ant-menu) {
    background: transparent;
  }
  
  :deep(.ant-menu-item),
  :deep(.ant-menu-submenu) {
    background: #ffffff;
    color: @text-color;
    font-weight: 500;
    
    &:hover,
    &-active,
    &-selected {
      color: @primary-color !important;
      background: #ffffff !important;
      
      &::after {
        border-bottom-color: @primary-color !important;
      }
    }
  }

  @media (max-width: 768px) {
    display: none;
  }
}

.download-cv {
  height: 40px;
  padding: 0 24px;
  border-radius: @border-radius-base;
  font-weight: 500;
  
  .anticon {
    margin-left: 8px;
  }
}

.mobile-trigger {
  display: none;
  font-size: 24px;
  cursor: pointer;
  color: @text-color;
  
  @media (max-width: 768px) {
    display: block;
  }
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
  text-align: center;

  .footer-main {
    margin-bottom: 40px;
    
    h2 {
      font-size: 2.5em;
      margin-bottom: 30px;
    }
  }

  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20px;
    border-top: 1px solid #eee;

    .social-links {
      a {
        margin-left: 20px;
        font-size: 20px;
        color: #666;
        
        &:hover {
          color: @primary-color;
        }
      }
    }
  }
}
</style> 