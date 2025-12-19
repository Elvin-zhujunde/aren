import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref('light')
  
  const isDarkMode = computed(() => currentTheme.value === 'dark')
  
  function toggleTheme() {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }
  
  return {
    currentTheme,
    isDarkMode,
    toggleTheme
  }
}) 