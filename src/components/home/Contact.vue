<template>
  <section class="contact-section">
    <div class="home-section-shell">
      <div class="contact-panel">
        <div class="contact-copy">
          <div class="home-section-heading">
            <h2>{{ t('home.contact.title') }}</h2>
            <p>{{ t('home.contact.subtitle') }}</p>
          </div>

          <div class="contact-info">
            <div v-for="item in contactItems" :key="item.key" class="contact-item">
              <div class="icon-wrapper">
                <component :is="item.icon" />
              </div>
              <div class="info">
                <h4>{{ t(`home.contact.items.${item.key}.title`) }}</h4>
                <p>{{ t(`home.contact.items.${item.key}.content`) }}</p>
              </div>
            </div>
          </div>
        </div>

        <a-form
          class="contact-form"
          :model="formState"
          :rules="rules"
          @finish="onFinish"
          layout="vertical"
        >
          <a-form-item name="name" :label="t('home.contact.form.name')">
            <a-input v-model:value="formState.name" size="large" />
          </a-form-item>
          <a-form-item name="email" :label="t('home.contact.form.email')">
            <a-input v-model:value="formState.email" size="large" />
          </a-form-item>
          <a-form-item name="message" :label="t('home.contact.form.message')">
            <a-textarea
              v-model:value="formState.message"
              :rows="5"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" block size="large" :loading="isSubmitting">
              {{ submitText }}
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined
} from '@ant-design/icons-vue'

const { t } = useI18n()

const contactItems = [
  {
    key: 'email',
    icon: MailOutlined
  },
  {
    key: 'phone',
    icon: PhoneOutlined
  },
  {
    key: 'address',
    icon: EnvironmentOutlined
  }
]

const formState = ref({
  name: '',
  email: '',
  message: ''
})

const isSubmitting = ref(false)
const submitted = ref(false)

const rules = computed(() => ({
  name: [
    { required: true, message: `${t('home.contact.form.name')} is required`, trigger: 'blur' }
  ],
  email: [
    { required: true, message: `${t('home.contact.form.email')} is required`, trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' }
  ],
  message: [
    { required: true, message: `${t('home.contact.form.message')} is required`, trigger: 'blur' }
  ]
}))

const submitText = computed(() => {
  if (submitted.value) return '已发送'
  return t('home.contact.form.submit')
})

const onFinish = () => {
  isSubmitting.value = true
  window.setTimeout(() => {
    isSubmitting.value = false
    submitted.value = true
  }, 500)
}
</script>

<style scoped>
.contact-section {
  padding: clamp(72px, 8vw, 112px) 0;
  background: #fff;
}

.contact-panel {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1fr);
  gap: 28px;
  align-items: start;
}

.contact-copy {
  border: 1px solid @home-border;
  border-radius: 24px;
  padding: 30px;
  background: @home-bg;
}

.contact-copy .home-section-heading {
  margin-bottom: 34px;
}

.contact-info {
  display: grid;
  gap: 14px;
}

.contact-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  border: 1px solid @home-border;
  border-radius: 18px;
  padding: 14px;
  background: #fff;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: @home-brand-soft;
}

.icon-wrapper :deep(svg) {
  font-size: 21px;
  color: @home-brand-dark;
}

.info h4 {
  margin: 0 0 5px;
  color: @home-ink;
  font-size: 16px;
}

.info p {
  margin: 0;
  color: @home-muted;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.contact-form {
  border: 1px solid @home-border;
  border-radius: 24px;
  padding: 30px;
  background: #fff;
  box-shadow: 0 12px 34px rgba(18, 32, 56, 0.055);
}

:deep(.ant-form-item-label > label) {
  color: @home-ink-soft;
  font-weight: 700;
}

:deep(.ant-input),
:deep(.ant-input-affix-wrapper) {
  border-color: @home-border;
  border-radius: 12px;
}

:deep(.ant-input:focus),
:deep(.ant-input-focused),
:deep(.ant-input:hover),
:deep(.ant-input-affix-wrapper-focused),
:deep(.ant-input-affix-wrapper:hover) {
  border-color: @home-brand;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.12);
}

:deep(.ant-btn-primary) {
  height: 48px;
  border-radius: 999px;
  background: @home-ink;
  border-color: @home-ink;
  font-weight: 760;
}

@media (max-width: 900px) {
  .contact-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .contact-section {
    padding: 64px 0;
  }

  .contact-copy,
  .contact-form {
    padding: 22px;
  }
}
</style>
