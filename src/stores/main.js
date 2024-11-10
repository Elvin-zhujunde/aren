import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMainStore = defineStore('main', () => {
  // state
  const count = ref(0)
  const name = ref('Vue')
  const loading = ref(false)

  // getters
  const doubleCount = computed(() => count.value * 2)
  const nameLength = computed(() => name.value.length)

  // actions
  function increment() {
    count.value++
  }

  async function fetchUserData() {
    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      name.value = '新数据'
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    count,
    name,
    loading,
    doubleCount,
    nameLength,
    increment,
    fetchUserData
  }
}) 