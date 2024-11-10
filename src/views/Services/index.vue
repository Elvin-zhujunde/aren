<template>
  <div class="services-container">
    <section class="services-header">
      <a-row justify="center">
        <a-col :span="16" class="text-center">
          <h5>My Services</h5>
          <h1>What I Do for Clients</h1>
        </a-col>
      </a-row>
    </section>

    <section class="services-grid">
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :md="8" v-for="service in services" :key="service.id">
          <div class="service-card wow fadeInUp">
            <div class="service-icon">
              <img :src="service.icon" :alt="service.title">
            </div>
            <div class="service-number">{{ service.number }}</div>
            <h3>{{ service.title }}</h3>
            <p>{{ service.description }}</p>
            <div class="service-footer">
              <router-link :to="'/services/' + service.id">
                Service
                <RightOutlined />
              </router-link>
            </div>
          </div>
        </a-col>
      </a-row>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RightOutlined } from '@ant-design/icons-vue'

const services = ref([
  {
    id: 1,
    title: 'Social Media',
    number: '01',
    description: 'Website ravida surna eveti semen the conse tusio anivite dianne one nivam acestion vue artin dictum.',
    icon: new URL('@/assets/icons/service1.png', import.meta.url).href
  },
  {
    id: 2,
    title: 'Web Design',
    number: '02',
    description: 'Website ravida surna eveti semen the conse tusio anivite dianne one nivam acestion vue artin dictum.',
    icon: new URL('@/assets/icons/service2.png', import.meta.url).href
  },
  {
    id: 3,
    title: 'Development',
    number: '03',
    description: 'Website ravida surna eveti semen the conse tusio anivite dianne one nivam acestion vue artin dictum.',
    icon: new URL('@/assets/icons/service3.png', import.meta.url).href
  }
])
</script>

<style lang="less" scoped>
.services-container {
  padding: 100px 0;
  background: #f8f9fa;

  .services-header {
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

  .service-card {
    background: #fff;
    padding: 40px;
    border-radius: @border-radius-base;
    position: relative;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
    }

    .service-icon {
      margin-bottom: 20px;
      
      img {
        width: 60px;
        height: 60px;
      }
    }

    .service-number {
      position: absolute;
      top: 40px;
      right: 40px;
      font-size: 2rem;
      font-weight: 700;
      color: #f0f0f0;
    }

    h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: @text-color;
    }

    p {
      color: #666;
      margin-bottom: 2rem;
    }

    .service-footer {
      border-top: 1px solid #eee;
      padding-top: 1rem;

      a {
        color: @text-color;
        font-weight: 500;
        text-decoration: none;

        &:hover {
          color: @primary-color;
        }

        .anticon {
          margin-left: 0.5rem;
        }
      }
    }
  }
}
</style> 