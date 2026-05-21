<script setup>
import { computed, ref } from 'vue'
import { useBlogStore } from '@stores/blog'
import { FolderOutlined, FileTextOutlined } from '@ant-design/icons-vue'

const blogStore = useBlogStore()

const selectedKey = computed(() => blogStore.currentDoc)

const sidebarWidth = ref(360)
const isResizing = ref(false)
const resizeBar = ref(null)

function handleSelect(doc) {
  blogStore.loadDoc(doc.path)
}

function startResize(e) {
  isResizing.value = true
  e.preventDefault()

  const startX = e.clientX
  const startWidth = sidebarWidth.value

  function onMouseMove(e) {
    const newWidth = startWidth + e.clientX - startX
    if (newWidth >= 160 && newWidth <= 480) {
      sidebarWidth.value = newWidth
    }
  }

  function onMouseUp() {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <aside
    class="blog-sidebar"
    :style="{ width: sidebarWidth + 'px', minWidth: sidebarWidth + 'px' }"
  >
    <div class="sidebar-inner">
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
          <a-tooltip :title="item.name" placement="right" :mouseEnterDelay="0.5">
            <span class="doc-name">{{ item.name }}</span>
          </a-tooltip>
        </a-menu-item>
        <a-sub-menu
          v-for="item in blogStore.docs.filter(i => i.children?.length)"
          :key="item.path"
        >
          <template #icon><FolderOutlined /></template>
          <template #title>
            <a-tooltip :title="item.name" placement="right" :mouseEnterDelay="0.5">
              <span @click.stop="handleSelect(item)" class="doc-name">{{ item.name }}</span>
            </a-tooltip>
          </template>
          <a-menu-item
            v-for="child in item.children"
            :key="child.path"
            @click="handleSelect(child)"
          >
            <template #icon><FileTextOutlined /></template>
            <a-tooltip :title="child.name" placement="right" :mouseEnterDelay="0.5">
              <span class="doc-name">{{ child.name }}</span>
            </a-tooltip>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>
      <div
        class="resize-bar"
        @mousedown="startResize"
      />
    </div>
  </aside>
</template>

<style scoped lang="less">
.blog-sidebar {
  min-width: 240px;
  height: calc(100vh - @header-height);
  border-right: 1px solid #f0f0f0;
  background: #fff;
  position: sticky;
  top: @header-height;
  align-self: flex-start;
}

.sidebar-inner {
  position: relative;
  height: 100%;
  overflow-y: auto;
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

.doc-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  max-width: 100%;
  vertical-align: middle;
}

.resize-bar {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;

  &:hover {
    background: @primary-color;
    opacity: 0.3;
  }

  &:active {
    background: @primary-color;
    opacity: 0.5;
  }
}
</style>