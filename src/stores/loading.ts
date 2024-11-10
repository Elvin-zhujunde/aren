import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    loadingStates: new Map<string, boolean>()
  }),
  
  actions: {
    setLoading(key: string, value: boolean) {
      this.loadingStates.set(key, value)
    },
    
    getLoading(key: string) {
      return this.loadingStates.get(key) || false
    }
  }
}) 