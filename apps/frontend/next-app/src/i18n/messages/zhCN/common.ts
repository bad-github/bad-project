const common = {
  // 首页 SEO 文案：字段结构与其他页面保持一致，且不会显示在页面正文中。
  metadata: {
    title: '阿超｜全栈工程师',
    description: '阿超的个人网站，介绍软件开发经历、技术技能与项目作品。',
  },
  selectLanguage: '选择语言',
  languages: {
    zhCN: '简体中文',
    zhTW: '繁體中文',
    enUS: 'English',
  },
} as const;

export default common;
