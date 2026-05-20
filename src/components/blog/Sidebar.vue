<script setup>
import { computed } from 'vue'
import { useBlogStore } from '@stores/blog'
import { FolderOutlined, FileTextOutlined } from '@ant-design/icons-vue'

const blogStore = useBlogStore()

const selectedKey = computed(() => blogStore.currentDoc)

function handleSelect(doc) {
  blogStore.loadDoc(doc.path)
}
</script>

<template>
  <aside class="blog-sidebar">
    <div class="sidebar-header">
      <h3>目录</h3>
    </div>
    <a-menu
      mode="inline"
      :selectedKeys="[selectedKey]"
      class="doc-menu"
    >
      <a-menu-item
        v-for="item in blogStore.docs.filter(i => !i.children?.length)"
        :key="item.path"
        @click="handleSelect(item)"
      >
        <template #icon><FileTextOutlined /></template>
        {{ item.name }}
      </a-menu-item>
      <a-sub-menu
        v-for="item in blogStore.docs.filter(i => i.children?.length)"
        :key="item.path"
      >
        <template #icon><FolderOutlined /></template>
        <template #title>{{ item.name }}</template>
        <a-menu-item
          v-for="child in item.children"
          :key="child.path"
          @click="handleSelect(child)"
        >
          <template #icon><FileTextOutlined /></template>
          {{ child.name }}
        </a-menu-item>
      </a-sub-menu>
    </a-menu>
  </aside>
</template>

<style scoped lang="less">
.blog-sidebar {
  width: 240px;
  min-width: 240px;
  height: calc(100vh - @header-height);
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
  background: #fff;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.doc-menu {
  border-inline-end: none !important;
}
</style>