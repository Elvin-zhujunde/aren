import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home/index.vue')
      },
      {
        path: 'portfolio',
        name: 'Portfolio',
        component: () => import('@/views/Portfolio/index.vue')
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/Services/index.vue')
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About/index.vue')
      },
      {
        path: 'blog',
        name: 'Blog',
        component: () => import('@/views/Blog/index.vue')
      },
    //   {
    //     path: 'contact',
    //     name: 'Contact',
    //     component: () => import('@/views/Contact/index.vue')
    //   }
    ]
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
}) 