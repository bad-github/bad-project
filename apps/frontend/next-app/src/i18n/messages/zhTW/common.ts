const common = {
  // 首頁 SEO 文案：欄位結構與其他頁面保持一致，且不會顯示在頁面正文中。
  metadata: {
    title: '阿超｜全端工程師',
    description: '阿超的個人網站，介紹軟體開發經歷、技術技能與專案作品。',
  },
  selectLanguage: '選擇語言',
  languages: {
    zhCN: '简体中文',
    zhTW: '繁體中文',
    enUS: 'English',
  },
} as const;

export default common;
