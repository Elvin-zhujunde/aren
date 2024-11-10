<template>
  <div class="portfolio-item wow fadeInUp">
    <gradient-card :gradient="work.gradient" height="300px">
      <div class="shape-circle"></div>
      <div class="shape-square"></div>
    </gradient-card>
    <div class="portfolio-info">
      <span class="category">{{ work.category }}</span>
      <div class="likes">
        <HeartOutlined /> {{ work.likes }}
      </div>
    </div>
    <h3 class="title">
      <router-link :to="`/portfolio/${work.id}`">{{ work.title }}</router-link>
    </h3>
  </div>
</template>

<script setup lang="ts">
import { HeartOutlined } from '@ant-design/icons-vue'
import GradientCard from '@/components/common/GradientCard.vue'

defineProps<{
  work: {
    id: number
    title: string
    category: string
    likes: number
    gradient: string
  }
}>()
</script>

<style lang="less" scoped>
.portfolio-item {
  background: #fff;
  border-radius: @border-radius-base;
  overflow: hidden;
  box-shadow: @box-shadow;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: @box-shadow-lg;
  }

  .portfolio-info {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .category {
      color: @primary-color;
    }

    .likes {
      color: #666;
    }
  }

  .title {
    padding: 0 20px 20px;
    margin: 0;

    a {
      color: @text-color;
      text-decoration: none;

      &:hover {
        color: @primary-color;
      }
    }
  }
}
</style> 