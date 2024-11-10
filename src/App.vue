<script setup lang="ts">
import { theme } from 'ant-design-vue'
import { ref } from 'vue'
import 'ant-design-vue/dist/reset.css'
import '@/styles/global.less'

const themeConfig = ref({
  token: {
    colorPrimary: '#2d5bff',
    borderRadius: 8,
    colorBgContainer: '#ffffff',
    colorText: '#2c3e50',
    colorTextSecondary: '#718096',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 16,
    controlHeight: 40,
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      paddingInline: 20,
    },
    Card: {
      borderRadius: 8,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },
    Menu: {
      itemHeight: 50,
      itemHoverColor: '#2d5bff',
      itemSelectedColor: '#2d5bff',
    }
  }
})
</script>

<template>
  <a-config-provider :theme="theme">
    <router-view></router-view>
  </a-config-provider>
</template>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
