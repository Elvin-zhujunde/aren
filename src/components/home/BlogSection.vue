<template>
  <section class="blog-section">
    <a-skeleton :loading="loading" active>
      <div class="blog-grid">
        <blog-card
          v-for="post in posts"
          :key="post.id"
          :post="post"
        />
      </div>
    </a-skeleton>
  </section>
</template>

<script setup lang="ts">
import type { BlogPost } from '@/types'
import BlogCard from '@/components/blog/BlogCard.vue'

defineProps<{
  posts: BlogPost[]
  loading?: boolean
}>()
</script>

<style lang="less" scoped>
.blog-section {
  background: #f8fafc;
}
</style>

<script lang="ts">
export default {
  name: 'BlogSection'
}
</script> 