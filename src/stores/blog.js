import { defineStore } from 'pinia'
import { ref } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'

marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  }
})

export const useBlogStore = defineStore('blog', () => {
  const docs = ref([])
  const currentDoc = ref(null)
  const currentContent = ref('')

  function buildTree(items) {
    const tree = []
    const map = {}

    items.forEach(item => {
      map[item.path] = { ...item, children: [] }
    })

    items.forEach(item => {
      if (item.parent) {
        const parent = map[item.parent]
        if (parent) {
          parent.children.push(map[item.path])
        }
      } else {
        tree.push(map[item.path])
      }
    })

    return tree
  }

  async function fetchDocs() {
    try {
      const res = await fetch('/docs/manifest.json')
      const data = await res.json()
      console.log(data);
      
      docs.value = buildTree(data)
    } catch (e) {
      console.error('Failed to fetch docs manifest:', e)
    }
  }

  async function loadDoc(path) {
    try {
      const res = await fetch(path)
      const content = await res.text()
      currentDoc.value = path
      currentContent.value = marked(content)
    } catch (e) {
      console.error('Failed to load doc:', e)
      currentContent.value = '<p class="error">Failed to load document</p>'
    }
  }

  return {
    docs,
    currentDoc,
    currentContent,
    fetchDocs,
    loadDoc
  }
})