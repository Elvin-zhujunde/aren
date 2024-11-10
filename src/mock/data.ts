import type { BlogPost, Portfolio, Skill, SocialLink, Statistic } from '@/types'

export const skills: Skill[] = [
  // ... 你的技能数据
];

export const socialLinks: SocialLink[] = [
  // ... 你的社交链接数据
];

export const portfolios: Portfolio[] = [
  // ... 你的作品集数据
];

export const statistics: Statistic[] = [
  // ... 你的统计数据
];

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: '如何使用 WordPress 搭建专业网站',
    category: '网站建设',
    date: '2024-03-15',
    author: '张三',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    excerpt: '在当今数字化时代，拥有一个专业的网站对于任何企业来说都是必不可少的。本文将为您详细介绍如何使用 WordPress 搭建一个专业的网站。'
  },
  // ... 其他博客文章
]

// 博客详情页数据
export const mockBlogDetail = {
  id: 1,
  title: '如何使用 WordPress 制作专业网站',
  date: '2023年10月23日',
  author: '张三',
  authorBio: '拥有10年经验的专业网页设计师',
  category: '网页设计',
  content: `
    <p>在当今数字化时代，拥有一个专业的网站对于任何企业来说都是必不可少的。本文将为您详细介绍如何使用 WordPress 搭建一个专业的网站。</p>
    <h3>入门准备</h3>
    <p>首先，您需要了解 WordPress 的基本概念和运作方式。WordPress 是目前全球最受欢迎的内容管理系统，它不仅易于使用，而且拥有强大的扩展性。</p>
    <h3>选择主题</h3>
    <p>选择一个适合您业务的主题至关重要。好的主题不仅要美观，还要具备良���的用户体验和功能性。</p>
  `,
  tags: ['WordPress', '网页设计', '开发'],
  headerGradient: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)',
  contentGradient: 'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)',
  authorGradient: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)'
}

// 最近文章
export const mockRecentPosts = [
  {
    id: 2,
    title: '如何提升业务增长率',
    date: '2023年10月20日'
  },
  {
    id: 3,
    title: '避免项目开发中的常见错误',
    date: '2023年10月18日'
  }
]

// 文章分类
export const mockCategories = [
  { name: '网页设计', count: 5 },
  { name: '商业', count: 3 },
  { name: '营销', count: 4 }
] 