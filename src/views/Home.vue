<template>
  <div class="home">
    <a-typography-title>首页</a-typography-title>
    
    <div class="counter">
      <a-card title="计数器示例">
        <p>计数: {{ mainStore.count }}</p>
        <p>双倍计数: {{ mainStore.doubleCount }}</p>
        <a-button type="primary" @click="mainStore.increment">增加</a-button>
      </a-card>
    </div>

    <a-card class="user-info" :bordered="false">
      <template v-if="userStore.isLoggedIn">
        <p>用户已登录</p>
        <a-button danger @click="userStore.logout">退出登录</a-button>
      </template>
      <template v-else>
        <a-button type="primary" @click="login">登录</a-button>
      </template>
    </a-card>
  </div>
</template>

<script setup>
import { useMainStore, useUserStore } from '@/stores'
import { useLocalStorage } from '@vueuse/core'
import { debounce } from 'lodash'

const mainStore = useMainStore()
const userStore = useUserStore()

const theme = useLocalStorage('theme', 'light')

const handleInput = debounce((e) => {
  console.log(e.target.value)
}, 300)

const login = () => {
  userStore.setToken('mock-token')
}
</script>

<style lang="less" scoped>
.home {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;

  .counter {
    margin-top: 20px;
  }

  .user-info {
    margin-top: 20px;
  }
}
</style>