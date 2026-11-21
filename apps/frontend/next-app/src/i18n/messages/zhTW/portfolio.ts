const portfolio = {
  // 頁面 SEO 文案：用於瀏覽器標籤和搜尋結果，不是頁面中的作品標題。
  metadata: {
    title: '精選專案｜阿超',
    description:
      '查看阿超參與和開發的專案作品，包括 React 中後台、基於 shadcn/ui 與 Storybook 的元件庫，以及基於 Tiptap 的富文字編輯器。',
  },
  previewPlaceholder: '專案預覽圖',
  technologyLabel: '使用技術',
  featured: {
    heading: '精選作品',
    category: 'Web 應用',
    title: 'React Admin',
    description:
      '一個基於 React 的中後台前端解決方案，提供可設定的主題、導覽列、選單、基礎 UI，以及常用 React 生態函式庫的整合範例，協助開發者快速建置和擴充後台管理系統。',
  },
  actions: {
    website: '線上網站',
    github: 'GitHub',
  },
  otherProjects: {
    heading: '其他作品',
  },
  uiBase: {
    category: 'UI 元件庫',
    title: '@badnpm/ui',
    description:
      '基於 shadcn/ui 建置的 React 元件庫，結合 Storybook 展示元件用法與互動狀態，涵蓋基礎 UI、業務元件和常用 Hooks，便於跨專案重用與擴充。',
  },
  tiptapEditor: {
    category: '富文字編輯器',
    title: 'Tiptap Editor',
    description:
      '基於 Tiptap 建置的富文字編輯器，整合文字排版、表格、圖片和程式碼區塊等編輯功能，透過模組化擴充與自訂工具列，滿足多樣化的內容編輯需求。',
  },
  project3: {
    category: '開源專案',
    title: '作品 3',
    description: '專案簡介佔位內容，後續替換為真實專案資訊。',
  },
  project4: {
    category: '實驗專案',
    title: '作品 4',
    description: '專案簡介佔位內容，後續替換為真實專案資訊。',
  },
} as const;

export default portfolio;
