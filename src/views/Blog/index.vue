<template>
  <div class="blog-container">
    <section class="blog-header">
      <a-row justify="center">
        <a-col :span="16" class="text-center">
          <h5>I am a Designer</h5>
          <h1>Recent blog posts</h1>
        </a-col>
      </a-row>
    </section>

    <section class="blog-grid">
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :md="8" v-for="post in blogPosts" :key="post.id">
          <div class="blog-card wow fadeInUp">
            <div class="blog-image-placeholder" :style="{ background: post.gradient }">
              <div class="shape-circle"></div>
              <div class="shape-square"></div>
            </div>
            <div class="blog-content">
              <div class="blog-meta">
                <a-tag>{{ post.category }}</a-tag>
              </div>
              <h3 class="blog-title">
                <router-link :to="`/blog/${post.id}`">{{ post.title }}</router-link>
              </h3>
              <div class="blog-footer">
                <span class="time">
                  <ClockCircleOutlined /> {{ post.date }}
                </span>
                <span class="author">
                  <UserOutlined /> {{ post.author }}
                </span>
              </div>
            </div>
          </div>
        </a-col>
      </a-row>
    </section>

    <!-- Pagination -->
    <section class="blog-pagination">
      <a-row justify="center">
        <a-col>
          <a-pagination
            v-model:current="currentPage"
            :total="50"
            show-less-items
          />
        </a-col>
      </a-row>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons-vue'

const currentPage = ref(1)

const blogPosts = ref([
  {
    id: 1,
    title: 'How to make a website using WordPress',
    category: 'Web Design',
    date: '23 Oct, 2023',
    author: 'David Smith',
    gradient: 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)'
  },
  {
    id: 2,
    title: 'Profit business makes to you an happy and growth',
    category: 'Business',
    date: '23 Oct, 2023',
    author: 'David Smith',
    gradient: 'linear-gradient(135deg, #FF0099 0%, #493240 100%)'
  },
  {
    id: 3,
    title: 'Point out common mistakes and your failure issues',
    category: 'Marketing',
    date: '23 Oct, 2023',
    author: 'David Smith',
    gradient: 'linear-gradient(135deg, #ABDCFF 0%, #0396FF 100%)'
  }
])
</script>

<style lang="less" scoped>
.blog-container {
  padding: 100px 0;

  .blog-header {
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

  .blog-grid {
    margin-bottom: 60px;
  }

  .blog-card {
    background: #fff;
    border-radius: @border-radius-base;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
    }

    .blog-image-placeholder {
      position: relative;
      height: 240px;
      overflow: hidden;
      
      .shape-circle,
      .shape-square {
        position: absolute;
        background: rgba(255, 255, 255, 0.1);
        transition: transform 0.3s ease;
      }

      .shape-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        top: -20px;
        right: -20px;
      }

      .shape-square {
        width: 60px;
        height: 60px;
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

    .blog-content {
      padding: 20px;

      .blog-meta {
        margin-bottom: 1rem;

        .ant-tag {
          border: none;
          background: #f0f0f0;
          color: @primary-color;
        }
      }

      .blog-title {
        margin-bottom: 1rem;
        
        a {
          color: @text-color;
          text-decoration: none;
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;

          &:hover {
            color: @primary-color;
          }
        }
      }

      .blog-footer {
        display: flex;
        justify-content: space-between;
        color: #666;
        font-size: 0.9rem;

        .anticon {
          margin-right: 0.5rem;
        }
      }
    }
  }

  .blog-pagination {
    text-align: center;
  }
}
</style> 