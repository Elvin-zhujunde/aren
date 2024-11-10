import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const token = ref('')

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken
  }

  function logout() {
    token.value = ''
    userInfo.value = null
  }

  async function getUserInfo() {
    try {
      // 这里可以添加实际的API调用
      const response = await mockApiCall()
      userInfo.value = response
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  // 模拟API调用
  const mockApiCall = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 1,
          username: '测试用户',
          email: 'test@example.com'
        })
      }, 1000)
    })
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    setToken,
    logout,
    getUserInfo
  }
}) 