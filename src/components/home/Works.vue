<template>
  <section class="works-section">
    <div class="home-section-shell">
      <div class="works-topline">
        <div class="home-section-heading">
          <h2>{{ t('home.works.title') }}</h2>
          <p>{{ t('home.works.subtitle') }}</p>
        </div>

        <div class="works-filter" role="tablist" :aria-label="t('home.works.title')">
          <button
            v-for="cat in categories"
            :key="cat.key"
            class="filter-chip"
            :class="{ active: currentCategory === cat.key }"
            type="button"
            role="tab"
            :aria-selected="currentCategory === cat.key"
            @click="currentCategory = cat.key"
          >
            {{ t(`home.works.categories.${cat.key}`) }}
          </button>
        </div>
      </div>

      <div v-if="featuredWork" class="works-layout">
        <article class="featured-work" tabindex="0" @click="handleWorkClick(featuredWork)" @keyup.enter="handleWorkClick(featuredWork)">
          <div class="featured-visual" :style="{ '--work-tone': featuredWork.bgColor }">
            <div class="visual-toolbar">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="visual-content">
              <span class="work-category">{{ t(`home.works.categories.${featuredWork.category}`) }}</span>
              <strong>{{ t(`home.works.items.${featuredWork.key}.title`) }}</strong>
              <p>{{ featuredWork.tags.join(' · ') }}</p>
            </div>
          </div>

          <div class="featured-copy">
            <p class="case-label">Featured case</p>
            <h3>{{ t(`home.works.items.${featuredWork.key}.title`) }}</h3>
            <p>{{ t(`home.works.items.${featuredWork.key}.description`) }}</p>

            <div class="featured-footer">
              <div class="work-tags">
                <span v-for="tag in featuredWork.tags" :key="tag">{{ tag }}</span>
              </div>
              <span class="case-link">
                {{ t('home.works.viewDetails') }}
                <RightOutlined />
              </span>
            </div>
          </div>
        </article>

        <div class="work-list">
          <article
            v-for="work in secondaryWorks"
            :key="work.id"
            class="work-row"
            tabindex="0"
            @click="handleWorkClick(work)"
            @keyup.enter="handleWorkClick(work)"
          >
            <div class="row-marker" :style="{ backgroundColor: work.bgColor }"></div>
            <div class="row-copy">
              <span>{{ t(`home.works.categories.${work.category}`) }}</span>
              <h3>{{ t(`home.works.items.${work.key}.title`) }}</h3>
              <p>{{ t(`home.works.items.${work.key}.description`) }}</p>
            </div>
            <div class="work-tags compact">
              <span v-for="tag in work.tags" :key="tag">{{ tag }}</span>
            </div>
            <RightOutlined class="row-arrow" />
          </article>
        </div>
      </div>

      <div class="works-more">
        <a-button type="primary" shape="round" size="large">
          {{ t('home.works.viewMore') }}
        </a-button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { RightOutlined } from '@ant-design/icons-vue'

const { t } = useI18n()
const router = useRouter()

const categories = [
  { key: 'all', label: 'All' },
  { key: 'design', label: 'Design' },
  { key: 'development', label: 'Development' },
  { key: 'mobile', label: 'Mobile' }
]

const currentCategory = ref('all')

const works = [
  {
    id: 1,
    key: 'dashboard',
    category: 'design',
    bgColor: 'oklch(90% 0.055 252)',
    tags: ['UI/UX', 'Figma', 'Dashboard']
  },
  {
    id: 2,
    key: 'ecommerce',
    category: 'development',
    bgColor: 'oklch(91% 0.06 180)',
    tags: ['Vue.js', 'Node.js', 'MongoDB']
  },
  {
    id: 3,
    key: 'fitness',
    category: 'mobile',
    bgColor: 'oklch(92% 0.065 145)',
    tags: ['React Native', 'Firebase']
  },
  {
    id: 4,
    key: 'social',
    category: 'development',
    bgColor: 'oklch(91% 0.06 305)',
    tags: ['Vue.js', 'GraphQL', 'AWS']
  },
  {
    id: 5,
    key: 'travel',
    category: 'mobile',
    bgColor: 'oklch(92% 0.07 65)',
    tags: ['Flutter', 'Firebase']
  },
  {
    id: 6,
    key: 'portfolio',
    category: 'design',
    bgColor: 'oklch(92% 0.055 35)',
    tags: ['UI/UX', 'Web Design']
  }
]

const filteredWorks = computed(() => {
  if (currentCategory.value === 'all') {
    return works
  }
  return works.filter(work => work.category === currentCategory.value)
})

const featuredWork = computed(() => filteredWorks.value[0])
const secondaryWorks = computed(() => filteredWorks.value.slice(1))

const handleWorkClick = (work) => {
  router.push({
    name: 'portfolio-details',
    query: { id: work.id }
  })
}
</script>

<style scoped>
.works-section {
  padding: clamp(76px, 8vw, 118px) 0;
  background:
    radial-gradient(circle at 12% 8%, rgba(24, 144, 255, 0.1), transparent 30%),
    linear-gradient(180deg, #fff 0%, @home-bg 100%);
}

.works-topline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 32px;
  margin-bottom: 40px;
}

.works-topline .home-section-heading {
  margin-bottom: 0;
}

.works-filter {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.filter-chip {
  min-width: 76px;
  border: 1px solid @home-border;
  border-radius: 999px;
  padding: 9px 15px;
  background: rgba(255, 255, 255, 0.86);
  color: @home-ink-soft;
  font-weight: 650;
  cursor: pointer;
  transition: border-color 0.24s @home-ease, color 0.24s @home-ease, background 0.24s @home-ease;
}

.filter-chip:hover,
.filter-chip:focus-visible,
.filter-chip.active {
  border-color: @home-ink;
  background: @home-ink;
  color: #fff;
  outline: none;
}

.works-layout {
  display: grid;
  grid-template-columns: minmax(360px, 0.92fr) minmax(0, 1.08fr);
  gap: 24px;
  align-items: start;
}

.featured-work,
.work-row {
  cursor: pointer;
}

.featured-work {
  overflow: hidden;
  border: 1px solid @home-border;
  border-radius: @home-radius-lg;
  background: #fff;
  box-shadow: @home-shadow-soft;
  transition: transform 0.28s @home-ease, box-shadow 0.28s @home-ease, border-color 0.28s @home-ease;
}

.featured-work:hover,
.featured-work:focus-visible,
.work-row:hover,
.work-row:focus-visible {
  border-color: rgba(24, 144, 255, 0.36);
  box-shadow: @home-shadow-card;
  outline: none;
}

.featured-work:hover,
.featured-work:focus-visible {
  transform: translateY(-4px);
}

.featured-visual {
  min-height: 280px;
  padding: 22px;
  background:
    linear-gradient(145deg, var(--work-tone), rgba(255, 255, 255, 0.78)),
    @home-brand-soft;
}

.visual-toolbar {
  display: flex;
  gap: 7px;
  margin-bottom: 46px;
}

.visual-toolbar span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(18, 32, 56, 0.22);
}

.visual-content {
  max-width: 360px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 44px rgba(18, 32, 56, 0.1);
}

.work-category {
  display: inline-flex;
  margin-bottom: 18px;
  border-radius: 999px;
  padding: 7px 11px;
  background: @home-ink;
  color: #fff;
  font-size: 13px;
  font-weight: 720;
}

.visual-content strong {
  display: block;
  color: @home-ink;
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.05;
  letter-spacing: -0.035em;
}

.visual-content p {
  margin: 16px 0 0;
  color: @home-muted;
  font-weight: 650;
}

.featured-copy {
  padding: 28px;
}

.case-label {
  margin: 0 0 10px;
  color: @home-brand-dark;
  font-weight: 760;
}

.featured-copy h3,
.row-copy h3 {
  margin: 0;
  color: @home-ink;
  line-height: 1.14;
}

.featured-copy h3 {
  font-size: clamp(28px, 4vw, 42px);
  letter-spacing: -0.035em;
}

.featured-copy > p:not(.case-label),
.row-copy p {
  color: @home-muted;
  line-height: 1.7;
}

.featured-copy > p:not(.case-label) {
  margin: 14px 0 0;
  font-size: 16px;
}

.featured-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 26px;
}

.work-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.work-tags span {
  border: 1px solid @home-border;
  border-radius: 999px;
  padding: 7px 10px;
  background: #fff;
  color: @home-ink-soft;
  font-size: 13px;
  font-weight: 650;
}

.case-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
  color: @home-brand-dark;
  font-weight: 760;
}

.work-list {
  display: grid;
  gap: 12px;
}

.work-row {
  display: grid;
  grid-template-columns: 12px minmax(180px, 1fr) minmax(170px, auto) auto;
  align-items: center;
  gap: 18px;
  border: 1px solid @home-border;
  border-radius: @home-radius-md;
  padding: 18px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 34px rgba(18, 32, 56, 0.055);
  transition: transform 0.24s @home-ease, border-color 0.24s @home-ease, box-shadow 0.24s @home-ease;
}

.work-row:hover,
.work-row:focus-visible {
  transform: translateX(3px);
}

.row-marker {
  width: 12px;
  height: 64px;
  border-radius: 999px;
}

.row-copy > span {
  display: block;
  margin-bottom: 5px;
  color: @home-brand-dark;
  font-size: 13px;
  font-weight: 720;
}

.row-copy h3 {
  font-size: 20px;
}

.row-copy p {
  margin: 7px 0 0;
}

.work-tags.compact {
  justify-content: flex-end;
}

.work-tags.compact span {
  padding: 5px 9px;
  font-size: 12px;
}

.row-arrow {
  color: @home-brand;
}

.works-more {
  margin-top: 40px;
  text-align: center;
}

.works-more :deep(.ant-btn-primary) {
  height: 46px;
  padding-inline: 24px;
  font-weight: 700;
  background: @home-ink;
  border-color: @home-ink;
}

@media (max-width: 1080px) {
  .works-topline,
  .works-layout {
    grid-template-columns: 1fr;
  }

  .works-filter {
    justify-content: flex-start;
  }

  .work-row {
    grid-template-columns: 12px minmax(0, 1fr) auto;
  }

  .work-tags.compact {
    grid-column: 2 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .works-section {
    padding: 72px 0;
  }

  .featured-work,
  .visual-content {
    border-radius: 24px;
  }

  .featured-visual,
  .featured-copy {
    padding: 22px;
  }

  .featured-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .work-row {
    grid-template-columns: 10px minmax(0, 1fr);
  }

  .work-tags.compact {
    grid-column: 2;
  }

  .row-arrow {
    display: none;
  }
}
</style>
