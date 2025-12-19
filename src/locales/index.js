import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'
import { useLocalStorage } from '@vueuse/core'

// 获取本地存储的语言设置或使用浏览器语言
const storageLanguage = useLocalStorage('language', '')
const browserLanguage = navigator.language
const defaultLanguage = storageLanguage.value || browserLanguage || 'zh-CN'

const i18n = createI18n({
  legacy: false, // 使用组合式API
  locale: defaultLanguage,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export default i18n

// 导出切换语言的函数
export function useLanguage() {
  const { locale } = i18n.global

  const changeLanguage = (lang) => {
    locale.value = lang
    storageLanguage.value = lang
  }

  return {
    locale,
    changeLanguage
  }
} 