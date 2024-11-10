<template>
  <a-dropdown>
    <a class="language-switch" @click.prevent>
      {{ currentLocale === 'zh' ? '中文' : 'English' }}
      <DownOutlined />
    </a>
    <template #overlay>
      <a-menu @click="handleLocaleChange">
        <a-menu-item key="zh">
          中文
        </a-menu-item>
        <a-menu-item key="en">
          English
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DownOutlined } from '@ant-design/icons-vue'

const { locale } = useI18n()
const currentLocale = computed(() => locale.value)

const handleLocaleChange = ({ key }: { key: string }) => {
  locale.value = key
  localStorage.setItem('locale', key)
}
</script>

<style lang="less" scoped>
.language-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  color: @text-color;
  
  &:hover {
    color: @primary-color;
  }
}
</style>

export default {}