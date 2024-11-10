<template>
  <div class="contact-section">
    <div class="section-header">
      <h2>{{ t('home.contact.title') }}</h2>
      <p>{{ t('home.contact.subtitle') }}</p>
    </div>
    <div class="contact-content">
      <a-row :gutter="[48, 48]">
        <a-col :xs="24" :md="12">
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
        </a-col>
        <a-col :xs="24" :md="12">
          <a-form 
            :model="formState"
            @finish="onFinish"
            layout="vertical"
          >
            <a-form-item name="name" :label="t('home.contact.form.name')">
              <a-input v-model:value="formState.name" />
            </a-form-item>
            <a-form-item name="email" :label="t('home.contact.form.email')">
              <a-input v-model:value="formState.email" />
            </a-form-item>
            <a-form-item name="message" :label="t('home.contact.form.message')">
              <a-textarea 
                v-model:value="formState.message"
                :rows="4"
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" block>
                {{ t('home.contact.form.submit') }}
              </a-button>
            </a-form-item>
          </a-form>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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

const onFinish = (values) => {
  console.log('Form values:', values)
  // 这里添加表单提交逻辑
}
</script>

<style scoped>
.contact-section {
  padding: 100px 50px;
  background: #f8f9fa;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: 36px;
  margin-bottom: 16px;
  font-weight: bold;
}

.section-header p {
  font-size: 18px;
  color: #666;
}

.contact-content {
  max-width: 1200px;
  margin: 0 auto;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30px;
}

.icon-wrapper {
  width: 50px;
  height: 50px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icon-wrapper :deep(svg) {
  font-size: 24px;
  color: #1890ff;
}

.info h4 {
  margin: 0 0 8px;
  font-size: 18px;
}

.info p {
  margin: 0;
  color: #666;
}

:deep(.ant-form-item-label) {
  font-weight: 500;
}
</style> 