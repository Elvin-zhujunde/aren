<template>
  <div class="portfolio-container">
    <section class="portfolio-header">
      <a-row justify="center">
        <a-col :span="16" class="text-center">
          <h5>OUR WORKS</h5>
          <h1>My Latest Design</h1>
        </a-col>
      </a-row>
    </section>

    <section class="portfolio-grid">
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :sm="12" :md="8" v-for="work in works" :key="work.id">
          <div class="portfolio-item wow fadeInUp">
            <div class="portfolio-image-placeholder" :style="{ background: work.gradient }">
              <div class="shape-circle"></div>
              <div class="shape-square"></div>
            </div>
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
        </a-col>
      </a-row>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { HeartOutlined } from '@ant-design/icons-vue'
import { usePortfolioStore } from '@/stores/portfolio'

const portfolioStore = usePortfolioStore()
const works = ref([
  {
    id: 1,
    title: 'Design for Marketing Agency Startup',
    category: 'Web Design',
    likes: 254,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 2,
    title: 'Website Design for Marketing',
    category: 'Web Design',
    likes: 254,
    gradient: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)'
  },
  {
    id: 3,
    title: 'Design for Technology & Services',
    category: 'Web Design',
    likes: 254,
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
  }
])

onMounted(() => {
  portfolioStore.fetchWorks()
})
</script>

<style lang="less" scoped>
.portfolio-container {
  padding: 100px 0;

  .portfolio-header {
    text-align: center;
    margin-bottom: 60px;

    h5 {
      color: @primary-color;
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 3rem;
      font-weight: 700;
      color: @text-color;
    }
  }

  .portfolio-item {
    background: #fff;
    border-radius: @border-radius-base;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
    }

    .portfolio-image-placeholder {
      position: relative;
      height: 300px;
      overflow: hidden;
      border-radius: @border-radius-base @border-radius-base 0 0;

      .shape-circle,
      .shape-square {
        position: absolute;
        opacity: 0.2;
        background: #fff;
        transition: transform 0.3s ease;
      }

      .shape-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        top: -20px;
        right: -20px;
      }

      .shape-square {
        width: 80px;
        height: 80px;
        transform: rotate(45deg);
        bottom: -20px;
        left: -20px;
      }

      &:hover {
        .shape-circle {
          transform: scale(1.2);
        }
        .shape-square {
          transform: rotate(45deg) scale(1.2);
        }
      }
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
}
</style> 