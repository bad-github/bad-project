const portfolio = {
  // 页面 SEO 文案：用于浏览器标签和搜索结果，不是页面中的作品标题。
  metadata: {
    title: '精选项目｜阿超',
    description:
      '查看阿超参与和开发的项目作品，包括 React 中后台、基于 shadcn/ui 与 Storybook 的组件库，以及基于 Tiptap 的富文本编辑器。',
  },
  previewPlaceholder: '项目预览图',
  technologyLabel: '使用技术',
  featured: {
    heading: '精选作品',
    category: 'Web 应用',
    title: 'React Admin',
    description:
      '一个基于 React 的中后台前端解决方案，提供可配置主题、导航栏、菜单、基础 UI，以及常用 React 生态库的集成示例，帮助开发者快速搭建和扩展后台管理系统。',
  },
  actions: {
    website: '在线网站',
    github: 'GitHub',
  },
  otherProjects: {
    heading: '其他作品',
  },
  uiBase: {
    category: 'UI 组件库',
    title: '@badnpm/ui',
    description:
      '基于 shadcn/ui 构建的 React 组件库，结合 Storybook 展示组件用法与交互状态，涵盖基础 UI、业务组件和常用 Hooks，便于跨项目复用与扩展。',
  },
  tiptapEditor: {
    category: '富文本编辑器',
    title: 'Tiptap Editor',
    description:
      '基于 Tiptap 构建的富文本编辑器，集成文本排版、表格、图片和代码块等编辑能力，通过模块化扩展与自定义工具栏，满足多样化的内容编辑需求。',
  },
  project3: {
    category: '开源项目',
    title: '作品 3',
    description: '项目简介占位内容，后续替换为真实项目信息。',
  },
  project4: {
    category: '实验项目',
    title: '作品 4',
    description: '项目简介占位内容，后续替换为真实项目信息。',
  },
} as const;

export default portfolio;
