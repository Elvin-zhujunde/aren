export interface Skill {
  id: number;
  name: string;
  level: number;
}

export interface SocialLink {
  name: string;
  color: string;
  url: string;
}

export * from './portfolio';
export * from './blog';
export * from './statistic';