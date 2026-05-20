<script setup>
import { computed } from 'vue'
import { useBlogStore } from '@stores/blog'

const blogStore = useBlogStore()

const content = computed(() => blogStore.currentContent)
</script>

<template>
  <article class="blog-article">
    <div
      v-if="content"
      class="markdown-body"
      v-html="content"
    />
    <a-empty v-else description="请选择左侧文档" />
  </article>
</template>

<style scoped lang="less">
.blog-article {
  flex: 1;
  padding: 24px 48px;
  overflow-y: auto;
  background: #fff;
  min-height: calc(100vh - @header-height);
}

.markdown-body {
  max-width: 800px;
  margin: 0 auto;
  color: @text-color;
  line-height: 1.8;
  word-break: break-word;

  :deep(h1) {
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
    font-size: 28px;
    font-weight: 600;
  }

  :deep(h2) {
    margin-top: 32px;
    margin-bottom: 16px;
    font-size: 22px;
    font-weight: 600;
  }

  :deep(h3) {
    margin-top: 24px;
    margin-bottom: 12px;
    font-size: 18px;
    font-weight: 600;
  }

  :deep(p) {
    margin-bottom: 16px;
  }

  :deep(code) {
    padding: 2px 6px;
    background: #f5f5f5;
    border-radius: 4px;
    font-size: 90%;
  }

  :deep(pre) {
    margin: 16px 0;
    padding: 16px;
    background: #1e1e1e;
    border-radius: 8px;
    overflow-x: auto;

    code {
      padding: 0;
      background: none;
      color: #d4d4d4;
      font-size: 14px;
      line-height: 1.5;
    }
  }

  :deep(blockquote) {
    margin: 16px 0;
    padding: 12px 16px;
    background: #f6f8fa;
    border-left: 4px solid @primary-color;

    p:last-child {
      margin-bottom: 0;
    }
  }

  :deep(ul),
  :deep(ol) {
    margin-bottom: 16px;
    padding-left: 24px;
  }

  :deep(li) {
    margin-bottom: 8px;
  }

  :deep(table) {
    width: 100%;
    margin: 16px 0;
    border-collapse: collapse;

    th,
    td {
      padding: 10px 16px;
      border: 1px solid #e8e8e8;
    }

    th {
      background: #fafafa;
      font-weight: 600;
    }
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 8px;
  }

  :deep(a) {
    color: @primary-color;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>