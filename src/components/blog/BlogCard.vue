<template>
  <div class="blog-card">
    <h3>{{ post.title }}</h3>
    <p>{{ post.excerpt }}</p>
    <!-- 其他内容 -->
  </div>
</template>

<script setup lang="ts">
import type { BlogPost } from '@/types'

defineProps<{
  post: BlogPost
}>()
</script>

<style lang="less" scoped>
.blog-card {
  background: #fff;
  border-radius: @border-radius-lg;
  padding: 2rem;
  box-shadow: @box-shadow;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: @box-shadow-lg;
  }

  .blog-content {
    .blog-meta {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;

      .ant-tag {
        border: none;
        background: fade(@primary-color, 10%);
        color: @primary-color;
        font-weight: 500;
      }

      .date {
        color: @text-color-secondary;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .blog-title {
      margin-bottom: 1rem;
      
      a {
        color: @heading-color;
        text-decoration: none;
        font-size: 1.5rem;
        font-weight: 600;
        line-height: 1.4;

        &:hover {
          color: @primary-color;
        }
      }
    }

    .blog-excerpt {
      color: @text-color-secondary;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .blog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.5rem;
      border-top: 1px solid @border-color;

      .author {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: bold;
        }

        .author-name {
          color: @text-color;
          font-weight: 500;
        }
      }

      .read-more {
        color: @primary-color;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
}
</style>

<script lang="ts">
export default {
  name: 'BlogCard'
}
</script>