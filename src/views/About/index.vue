<template>
  <div class="about-container">
    <!-- About Hero Section -->
    <section class="about-hero">
      <a-row :gutter="[32, 32]" align="middle">
        <a-col :lg="12" :md="24">
          <div class="about-content wow fadeInRight">
            <h5>I am a Designer</h5>
            <h1>I Can Design Anything You Want</h1>
            <p>Hello there! I am a web designer, and I am very passionate and dedicated to my work. With 20 years experience as a professional web developer, I have acquired the skills and knowledge necessary to make your project a success.</p>
            <p>I enjoy every step of the design process, from discussion and collaboration.</p>
            <a-button type="primary" size="large" class="mt-4">
              Contact Us
            </a-button>
          </div>
        </a-col>
        <a-col :lg="12" :md="24">
          <div class="about-image-container">
            <div class="about-image-placeholder" :style="{ background: gradients.about }">
              <div class="shape-1 bounce-animate4"></div>
              <div class="shape-2 bounce-animate5"></div>
            </div>
          </div>
        </a-col>
      </a-row>
    </section>

    <!-- Skills Section -->
    <section class="skills-section">
      <a-row>
        <a-col :lg="12" :md="24">
          <div class="skills-image-container">
            <div class="skills-image-placeholder" :style="{ background: gradients.skills }">
              <div class="shape-3 bounce-animate4"></div>
              <div class="shape-4 bounce-animate5"></div>
            </div>
          </div>
          <div class="skills-shape bounce-animate5">
            <img src="https://picsum.photos/100/100?random=18" alt="Shape">
          </div>
        </a-col>
        <a-col :lg="12" :md="24">
          <div class="skills-content">
            <h5>What We Do</h5>
            <h1>I Develop Skills Regularly to Keep Me Update</h1>
            <div class="skills-progress">
              <div v-for="skill in skills" :key="skill.name" class="skill-item">
                <span class="skill-name">{{ skill.name }}</span>
                <a-progress 
                  :percent="skill.percent" 
                  :stroke-color="skill.color"
                  :show-info="false"
                />
              </div>
            </div>
            <a-button type="primary" size="large" class="mt-4">
              About Me
            </a-button>
          </div>
        </a-col>
      </a-row>
    </section>

    <!-- Counter Section -->
    <section class="counter-section">
      <a-row :gutter="[32, 32]">
        <a-col :lg="6" :md="12" :sm="24">
          <div class="counter-item">
            <h5>Join in on Something big</h5>
          </div>
        </a-col>
        <a-col :lg="6" :md="12" :sm="24">
          <div class="counter-item">
            <h2 class="counter">280</h2>
            <p>Direct Clients</p>
          </div>
        </a-col>
        <a-col :lg="6" :md="12" :sm="24">
          <div class="counter-item">
            <h2 class="counter">3K</h2>
            <p>Total Projects</p>
          </div>
        </a-col>
        <a-col :lg="6" :md="12" :sm="24">
          <div class="counter-item">
            <h2 class="counter">9+</h2>
            <p>Awards Win</p>
          </div>
        </a-col>
      </a-row>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const skills = ref([
  { name: 'WordPress', percent: 74, color: '#42b883' },
  { name: 'Photoshop', percent: 65, color: '#35495e' },
  { name: 'Marketing', percent: 85, color: '#41b883' }
])

const gradients = ref({
  about: 'linear-gradient(135deg, #43CBFF 0%, #9708CC 100%)',
  skills: 'linear-gradient(135deg, #FFA8A8 0%, #FCFF00 100%)'
})
</script>

<style lang="less" scoped>
.about-container {
  padding: 100px 0;

  .about-hero {
    margin-bottom: 100px;

    .about-content {
      h5 {
        color: @primary-color;
        font-size: 1.25rem;
        margin-bottom: 1rem;
      }

      h1 {
        font-size: 3rem;
        font-weight: 700;
        margin-bottom: 2rem;
        color: @text-color;
      }

      p {
        color: #666;
        margin-bottom: 1rem;
        font-size: 1.1rem;
        line-height: 1.8;
      }
    }

    .about-image-container {
      position: relative;

      .about-image-placeholder {
        height: 400px;
        border-radius: @border-radius-lg;
        position: relative;
        overflow: hidden;

        .shape-1,
        .shape-2,
        .shape-3,
        .shape-4 {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
        }

        .shape-1,
        .shape-3 {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          top: -40px;
          right: -40px;
        }

        .shape-2,
        .shape-4 {
          width: 120px;
          height: 120px;
          transform: rotate(45deg);
          bottom: -40px;
          left: -40px;
        }
      }
    }
  }

  .skills-section {
    padding: 100px 0;
    background: #f8f9fa;
    position: relative;
    overflow: hidden;

    .skills-content {
      padding: 0 50px;

      h5 {
        color: @primary-color;
        font-size: 1.25rem;
        margin-bottom: 1rem;
      }

      h1 {
        font-size: 3rem;
        font-weight: 700;
        margin-bottom: 3rem;
        color: @text-color;
      }

      .skill-item {
        margin-bottom: 2rem;

        .skill-name {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
      }
    }

    .skills-shape {
      position: absolute;
      top: 50px;
      left: -50px;
      z-index: 0;
    }
  }

  .counter-section {
    padding: 80px 0;
    background: #fff;

    .counter-item {
      text-align: center;
      padding: 30px;

      h5 {
        font-size: 1.5rem;
        color: @text-color;
        margin-bottom: 0;
      }

      h2 {
        font-size: 3rem;
        font-weight: 700;
        color: @primary-color;
        margin-bottom: 1rem;
      }

      p {
        color: #666;
        margin: 0;
      }
    }
  }
}

.bounce-animate4 {
  animation: bounce 4s infinite;
}

.bounce-animate5 {
  animation: bounce 5s infinite;
}
</style> 