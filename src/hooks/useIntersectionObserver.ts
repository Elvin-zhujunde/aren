import { ref, onMounted, onUnmounted } from 'vue'

export function useIntersectionObserver(options = {}) {
  const isVisible = ref(false)
  let observer: IntersectionObserver | null = null
  let element: Element | null = null

  const callback = (entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    isVisible.value = entry.isIntersecting
  }

  const observe = (el: Element) => {
    element = el
    observer = new IntersectionObserver(callback, options)
    observer.observe(element)
  }

  onUnmounted(() => {
    if (observer && element) {
      observer.unobserve(element)
      observer = null
      element = null
    }
  })

  return {
    isVisible,
    observe
  }
} 