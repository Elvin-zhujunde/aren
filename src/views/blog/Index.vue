<script setup>
import { onMounted } from 'vue'
import { useBlogStore } from '@stores/blog'
import Sidebar from '@/components/blog/Sidebar.vue'
import Article from '@/components/blog/Article.vue'

const blogStore = useBlogStore()

onMounted(async () => {
  await blogStore.fetchDocs()
  if (blogStore.docs.length > 0) {
    await blogStore.loadDoc(blogStore.docs[0].path)
  }
})
</script>

<template>
  <div class="blog-container">
    <Sidebar />
    <Article />
  </div>
</template>

<style scoped lang="less">
.blog-container {
  margin-top: 45px;
  display: flex;
  min-height: calc(100vh - @header-height);
}
</style>