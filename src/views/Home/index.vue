<template>
  <div class="home-container">
    <!-- Hero Section -->
    <hero-section
      :title="'阿亻'"
      :subtitle="t('hero.greeting')"
      :skills="skills"
      :social-links="socialLinks"
      :hero-gradient="gradients.hero"
      :loading="loading.hero"
    />

    <!-- Portfolio Section -->
    <portfolio-section 
      :works="portfolioWorks" 
      :loading="loading.portfolio"
    />

    <!-- About Section -->
    <about-section
      :skills="skillsList"
      :about-gradient="gradients.about"
      :loading="loading.about"
    />

    <!-- Counter Section -->
    <counter-section 
      :stats="stats"
      :loading="loading.counter"
    />

    <!-- Blog Section -->
    <blog-section 
      :posts="blogPosts" 
      :loading="loading.blog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLoadingStore } from '@/stores/loading'
import { api } from '@/api'
import HeroSection from '@/components/home/HeroSection.vue'
import PortfolioSection from '@/components/home/PortfolioSection.vue'
import AboutSection from '@/components/home/AboutSection.vue'
import CounterSection from '@/components/home/CounterSection.vue'
import BlogSection from '@/components/home/BlogSection.vue'
import type { Skill, SocialLink, Portfolio, Statistic, BlogPost } from '@/types'

const { t } = useI18n()
const loadingStore = useLoadingStore()

// Loading states
const loading = ref({
  hero: false,
  portfolio: false,
  about: false,
  counter: false,
  blog: false
})

// Data states
const skills = ref<Skill[]>([])
const socialLinks = ref<SocialLink[]>([])
const portfolioWorks = ref<Portfolio[]>([])
const skillsList = ref([])
const stats = ref<Statistic[]>([])
const blogPosts = ref<BlogPost[]>([])

// Gradients
const gradients = ref({
  hero: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  about: 'linear-gradient(135deg, #43CBFF 0%, #9708CC 100%)'
})

// Fetch data functions
const fetchSkills = async () => {
  loading.value.hero = true
  try {
    const response = await api.skills.getList()
    skills.value = response.data
  } finally {
    loading.value.hero = false
  }
}

const fetchSocialLinks = async () => {
  loading.value.hero = true
  try {
    const response = await api.social.getLinks()
    socialLinks.value = response.data
  } finally {
    loading.value.hero = false
  }
}

const fetchPortfolio = async () => {
  loading.value.portfolio = true
  try {
    const response = await api.portfolio.getList()
    portfolioWorks.value = response.data
  } finally {
    loading.value.portfolio = false
  }
}

const fetchStats = async () => {
  loading.value.counter = true
  try {
    const response = await api.statistics.getList()
    stats.value = response.data
  } finally {
    loading.value.counter = false
  }
}

const fetchBlogPosts = async () => {
  loading.value.blog = true
  try {
    const response = await api.blog.getList()
    blogPosts.value = response.data
  } finally {
    loading.value.blog = false
  }
}

// Fetch all data on mount
onMounted(() => {
  Promise.all([
    fetchSkills(),
    fetchSocialLinks(),
    fetchPortfolio(),
    fetchStats(),
    fetchBlogPosts()
  ]).catch(error => {
    console.error('Failed to load data:', error)
  })
})
</script>

<style lang="less" scoped>
.home-container {
  section + section {
    margin-top: @spacing-xlarge;
  }
}
</style> 