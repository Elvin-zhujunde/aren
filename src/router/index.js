import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/portfolio',
    name: 'portfolio',
    component: () => import('@/views/portfolio/Index.vue')
  },
  {
    path: '/portfolio/list',
    name: 'portfolio-list',
    component: () => import('@/views/portfolio/List.vue')
  },
  {
    path: '/portfolio/details',
    name: 'portfolio-details',
    component: () => import('@/views/portfolio/Details.vue')
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/views/Contact.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 平滑滚动
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

export default router 