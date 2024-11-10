<template>
  <div 
    class="gradient-card"
    :style="{ 
      background: gradient,
      height: height
    }"
  >
    <div class="shape-circle"></div>
    <div class="shape-square"></div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  gradient: string
  height?: string
}>()
</script>

<style lang="less" scoped>
.gradient-card {
  position: relative;
  border-radius: @border-radius-base;
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
</style>

export default {}