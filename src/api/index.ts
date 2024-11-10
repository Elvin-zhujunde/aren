import { portfolios, blogPosts, skills, socialLinks, statistics } from '@/mock/data';
import type { BlogPost, Portfolio, Skill, SocialLink, Statistic } from '@/types';

export const api = {
  skills: {
    getList: (): Promise<{ data: Skill[] }> => {
      return Promise.resolve({ data: skills });
    }
  },
  social: {
    getLinks: (): Promise<{ data: SocialLink[] }> => {
      return Promise.resolve({ data: socialLinks });
    }
  },
  portfolio: {
    getList: (): Promise<{ data: Portfolio[] }> => {
      return Promise.resolve({ data: portfolios });
    },
    getById: (id: number): Promise<{ data: Portfolio | null }> => {
      const portfolio = portfolios.find((p: Portfolio) => p.id === id);
      return Promise.resolve({ data: portfolio || null });
    }
  },
  statistics: {
    getList: (): Promise<{ data: Statistic[] }> => {
      return Promise.resolve({ data: statistics });
    }
  },
  blog: {
    getList: (): Promise<{ data: BlogPost[] }> => {
      return Promise.resolve({ data: blogPosts });
    },
    getById: (id: number): Promise<{ data: BlogPost | null }> => {
      const post = blogPosts.find((p: BlogPost) => p.id === id);
      return Promise.resolve({ data: post || null });
    }
  }
}; 