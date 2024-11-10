<template>
  <div class="blog-detail-container">
    <section class="blog-hero" :style="{ background: blog.headerGradient }">
      <div class="blog-hero-content">
        <h1>{{ blog.title }}</h1>
        <div class="blog-meta">
          <span class="date">
            <ClockCircleOutlined /> {{ blog.date }}
          </span>
          <span class="author">
            <UserOutlined /> {{ blog.author }}
          </span>
          <span class="category">
            <FolderOutlined /> {{ blog.category }}
          </span>
        </div>
      </div>
    </section>

    <section class="blog-content">
      <a-row :gutter="24">
        <a-col :lg="16" :md="24">
          <div class="content-main">
            <div class="featured-image-placeholder" :style="{ background: blog.contentGradient }">
              <div class="shape-circle"></div>
              <div class="shape-square"></div>
            </div>
            <div class="content-body" v-html="blog.content"></div>
            
            <!-- Tags -->
            <div class="blog-tags">
              <a-tag v-for="tag in blog.tags" :key="tag">{{ tag }}</a-tag>
            </div>

            <!-- Share -->
            <div class="blog-share">
              <h4>Share this post:</h4>
              <div class="share-buttons">
                <a href="#" class="facebook"><FacebookOutlined /></a>
                <a href="#" class="twitter"><TwitterOutlined /></a>
                <a href="#" class="linkedin"><LinkedinOutlined /></a>
              </div>
            </div>
          </div>
        </a-col>
        
        <a-col :lg="8" :md="24">
          <div class="blog-sidebar">
            <!-- Author -->
            <div class="sidebar-widget author-widget">
              <div class="author-image-placeholder" :style="{ background: blog.authorGradient }">
                {{ blog.author[0] }}
              </div>
              <h3>{{ blog.author }}</h3>
              <p>{{ blog.authorBio }}</p>
              <div class="author-social">
                <a href="#"><FacebookOutlined /></a>
                <a href="#"><TwitterOutlined /></a>
                <a href="#"><LinkedinOutlined /></a>
              </div>
            </div>

            <!-- Recent Posts -->
            <div class="sidebar-widget recent-posts">
              <h3>Recent Posts</h3>
              <ul>
                <li v-for="post in recentPosts" :key="post.id">
                  <router-link :to="`/blog/${post.id}`">
                    {{ post.title }}
                  </router-link>
                  <span class="post-date">{{ post.date }}</span>
                </li>
              </ul>
            </div>

            <!-- Categories -->
            <div class="sidebar-widget categories">
              <h3>Categories</h3>
              <ul>
                <li v-for="category in categories" :key="category.name">
                  <a href="#">
                    {{ category.name }}
                    <span>({{ category.count }})</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </a-col>
      </a-row>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ClockCircleOutlined,
  UserOutlined,
  FolderOutlined,
  FacebookOutlined,
  TwitterOutlined,
  LinkedinOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const blog = ref({
  id: 1,
  title: 'How to make a website using WordPress',
  date: '23 Oct, 2023',
  author: 'David Smith',
  authorImage: 'https://picsum.photos/120/120?random=22',
  authorBio: 'Professional web designer with 10 years of experience',
  category: 'Web Design',
  image: 'https://picsum.photos/800/400?random=23',
  content: `
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    <h3>Getting Started</h3>
    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
  `,
  tags: ['WordPress', 'Web Design', 'Development'],
  headerGradient: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)',
  contentGradient: 'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)',
  authorGradient: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)'
})

const recentPosts = ref([
  {
    id: 2,
    title: 'Profit business makes to you an happy and growth',
    date: '20 Oct, 2023'
  },
  {
    id: 3,
    title: 'Point out common mistakes and your failure issues',
    date: '18 Oct, 2023'
  }
])

const categories = ref([
  { name: 'Web Design', count: 5 },
  { name: 'Business', count: 3 },
  { name: 'Marketing', count: 4 }
])

onMounted(() => {
  // TODO: Fetch blog post data based on route.params.id
})
</script>

<style lang="less" scoped>
.blog-detail-container {
  .blog-hero {
    background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
                url('https://picsum.photos/1920/600?random=24') center/cover;
    padding: 120px 0;
    text-align: center;
    color: #fff;

    h1 {
      font-size: 3rem;
      margin-bottom: 1.5rem;
    }

    .blog-meta {
      span {
        margin: 0 1rem;
        
        .anticon {
          margin-right: 0.5rem;
        }
      }
    }
  }

  .blog-content {
    padding: 80px 0;

    .content-main {
      .featured-image-placeholder {
        height: 400px;
        border-radius: @border-radius-base;
        position: relative;
        overflow: hidden;
        margin-bottom: 2rem;

        .shape-circle,
        .shape-square {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
        }

        .shape-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          top: -30px;
          right: -30px;
        }

        .shape-square {
          width: 100px;
          height: 100px;
          transform: rotate(45deg);
          bottom: -30px;
          left: -30px;
        }
      }

      .content-body {
        font-size: 1.1rem;
        line-height: 1.8;
        color: #666;

        h3 {
          color: @text-color;
          margin: 2rem 0 1rem;
        }
      }

      .blog-tags {
        margin: 2rem 0;
      }

      .blog-share {
        padding-top: 2rem;
        border-top: 1px solid #eee;

        h4 {
          margin-bottom: 1rem;
        }

        .share-buttons {
          a {
            font-size: 1.5rem;
            margin-right: 1rem;
            color: #666;

            &:hover {
              color: @primary-color;
            }
          }
        }
      }
    }

    .blog-sidebar {
      .sidebar-widget {
        background: #fff;
        padding: 30px;
        border-radius: @border-radius-base;
        margin-bottom: 30px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);

        h3 {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }
      }

      .author-widget {
        text-align: center;

        .author-image-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          color: #fff;
          font-weight: bold;
        }

        .author-social {
          margin-top: 1rem;

          a {
            font-size: 1.2rem;
            margin: 0 0.5rem;
            color: #666;

            &:hover {
              color: @primary-color;
            }
          }
        }
      }

      .recent-posts,
      .categories {
        ul {
          list-style: none;
          padding: 0;
          margin: 0;

          li {
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #eee;

            &:last-child {
              margin-bottom: 0;
              padding-bottom: 0;
              border-bottom: none;
            }

            a {
              color: @text-color;
              text-decoration: none;

              &:hover {
                color: @primary-color;
              }
            }

            .post-date {
              display: block;
              font-size: 0.9rem;
              color: #666;
              margin-top: 0.5rem;
            }
          }
        }
      }
    }
  }
}
</style> 