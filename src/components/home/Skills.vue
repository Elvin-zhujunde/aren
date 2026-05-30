<template>
  <section class="skills-section">
    <div class="home-section-shell">
      <div class="home-section-heading section-heading-centered">
        <h2>{{ t('home.skills.title') }}</h2>
        <p>{{ t('home.skills.subtitle') }}</p>
      </div>

      <div class="skills-grid">
        <article v-for="category in skillCategories" :key="category.key" class="skill-panel">
          <div class="panel-heading">
            <h3>{{ t(`home.skills.categories.${category.key}.title`) }}</h3>
            <p>{{ category.description }}</p>
          </div>

          <div class="skill-groups">
            <div v-for="group in category.groups" :key="group.label" class="skill-group">
              <div class="group-label">{{ group.label }}</div>
              <div class="skill-chips">
                <span v-for="skill in group.skills" :key="skill">{{ skill }}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const skillCategories = [
  {
    key: 'design',
    description: '从信息层级、视觉节奏到可用性细节，让页面先被读懂，再被记住。',
    groups: [
      {
        label: '核心',
        skills: ['Figma', 'Design systems', 'Responsive UI']
      },
      {
        label: '常用',
        skills: ['Interaction design', 'Prototyping', 'Visual QA']
      },
      {
        label: '辅助',
        skills: ['Photoshop', 'Adobe XD', 'Brand direction']
      }
    ]
  },
  {
    key: 'development',
    description: '用现代前端栈把设计落到真实页面，关注性能、维护性和上线体验。',
    groups: [
      {
        label: '核心',
        skills: ['Vue.js', 'JavaScript', 'Less/CSS']
      },
      {
        label: '常用',
        skills: ['React', 'Node.js', 'Vite']
      },
      {
        label: '辅助',
        skills: ['Pinia', 'Ant Design Vue', 'API integration']
      }
    ]
  }
]
</script>

<style scoped>
.skills-section {
  padding: clamp(72px, 8vw, 112px) 0;
  background: @home-bg;
}

.section-heading-centered {
  margin-inline: auto;
  text-align: center;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.skill-panel {
  border: 1px solid @home-border;
  border-radius: 24px;
  padding: 28px;
  background: #fff;
  box-shadow: 0 12px 34px rgba(18, 32, 56, 0.055);
}

.panel-heading {
  margin-bottom: 24px;
}

.panel-heading h3 {
  margin: 0 0 10px;
  color: @home-ink;
  font-size: 24px;
  line-height: 1.2;
}

.panel-heading p {
  margin: 0;
  color: @home-muted;
  line-height: 1.7;
}

.skill-groups {
  display: grid;
  gap: 18px;
}

.skill-group {
  display: grid;
  gap: 10px;
}

.group-label {
  color: @home-brand-dark;
  font-size: 14px;
  font-weight: 760;
}

.skill-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.skill-chips span {
  border: 1px solid @home-border;
  border-radius: 999px;
  padding: 8px 11px;
  background: @home-bg;
  color: @home-ink-soft;
  font-weight: 650;
}

@media (max-width: 900px) {
  .skills-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .skills-section {
    padding: 64px 0;
  }

  .skill-panel {
    padding: 22px;
  }
}
</style>
