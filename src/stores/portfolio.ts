import { defineStore } from 'pinia'

interface PortfolioState {
  works: any[]
  categories: string[]
  loading: boolean
}

export const usePortfolioStore = defineStore('portfolio', {
  state: (): PortfolioState => ({
    works: [],
    categories: [],
    loading: false
  }),
  
  actions: {
    async fetchWorks() {
      this.loading = true
      try {
        // TODO: Replace with actual API call
        const response = await fetch('/api/works')
        const data = await response.json()
        this.works = data
      } catch (error) {
        console.error('Error fetching works:', error)
      } finally {
        this.loading = false
      }
    }
  }
}) 