// 通用响应类型
export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

// 作品集类型
export interface Portfolio {
  id: number
  title: string
  category: string
  likes: number
  gradient: string
}

// 博客文章类型
export interface BlogPost {
  id: number
  title: string
  category: string
  date: string
  author: string
  gradient: string
}

// 技能类型
export interface Skill {
  name: string
  percent: number
  color: string
}

// 社交链接类型
export interface SocialLink {
  name: string
  color: string
  url: string
}

// 统计数据类型
export interface Statistic {
  value: string
  label: string
} 