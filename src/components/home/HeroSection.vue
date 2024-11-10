<template>
  <section class="hero-section">
    <div class="container">
      <a-row :gutter="[32, 32]" align="middle">
        <a-col :xs="24" :md="12">
          <a-skeleton :loading="loading" active>
            <div class="hero-image-container">
              <gradient-card
                :gradient="heroGradient"
                height="400px"
                class="hero-image-placeholder"
              >
                <div class="shape-1 bounce-animate"></div>
                <div class="shape-2 bounce-animate2"></div>
              </gradient-card>
            </div>
          </a-skeleton>
        </a-col>
        <a-col :xs="24" :md="12">
          <a-skeleton :loading="loading" active>
            <div class="hero-content wow fadeInRight">
              <h5>{{ t("hero.greeting") }}</h5>
              <h1>{{ title }}</h1>
              <div class="skills-grid">
                <a-tag v-for="skill in t('hero.skills')" :key="skill">{{
                  skill
                }}</a-tag>
              </div>
              <div class="social-links">
                <a-row :gutter="[16, 16]">
                  <a-col :span="8" v-for="link in socialLinks" :key="link.name">
                    <div class="social-box">
                      <div
                        class="icon-placeholder"
                        :style="{ background: link.color }"
                      >
                        {{ link.name[0] }}
                      </div>
                      <div class="info">
                        <a :href="link.url">
                          {{ link.name }}
                          <RightOutlined />
                        </a>
                      </div>
                    </div>
                  </a-col>
                </a-row>
              </div>
            </div>
          </a-skeleton>
        </a-col>
      </a-row>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RightOutlined } from "@ant-design/icons-vue";
import { useI18n } from "vue-i18n";
import GradientCard from "@/components/common/GradientCard.vue";

const { t } = useI18n();

defineProps<{
  title: string;
  socialLinks: Array<{
    name: string;
    color: string;
    url: string;
  }>;
  heroGradient: string;
  loading?: boolean;
}>();
</script>

<script lang="ts">
export default {
  name: 'HeroSection'
}
</script>

<style lang="less" scoped>
.hero-section {
  padding: 120px 0;
  background: #f8f9fa;
  overflow: hidden;

  .container {
    max-width: @container-max-width;
    margin: 0 auto;
    padding: 0 @container-padding;
  }

  .hero-content {
    padding-right: 40px;

    h5 {
      color: @primary-color;
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 4rem;
      font-weight: 700;
      margin-bottom: 2rem;
      color: @text-color;
    }

    .skills-grid {
      margin-bottom: 2rem;

      .ant-tag {
        padding: 8px 16px;
        font-size: 1rem;
        margin-bottom: 1rem;
        margin-right: 1rem;
      }
    }
  }

  .hero-image-container {
    padding: 20px;

    .hero-image-placeholder {
      border-radius: @border-radius-lg;
    }
  }

  .social-box {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: #fff;
    border-radius: @border-radius-base;
    box-shadow: @box-shadow;
    transition: all 0.3s ease;
    height: 100%;

    &:hover {
      transform: translateY(-5px);
      box-shadow: @box-shadow-lg;
    }

    .icon-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
      color: #fff;
      font-weight: bold;
      flex-shrink: 0;
    }

    .info {
      flex: 1;
      min-width: 0;

      a {
        color: @text-color;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: space-between;

        &:hover {
          color: @primary-color;
        }
      }
    }
  }
}

@media (max-width: @screen-md) {
  .hero-section {
    .hero-content {
      padding-right: 0;
      text-align: center;

      h1 {
        font-size: 3rem;
      }
    }

    .skills-grid {
      justify-content: center;
    }
  }
}
</style>
