const status = {
  loading: '加载中……',
  error: {
    title: '页面出现错误',
    retry: '重试',
  },
  notFound: {
    title: '页面未找到',
    description: '你访问的页面不存在，可能已被移动或删除。',
    goHome: '返回首页',
    suggestionTitle: '你可以尝试',
    checkUrl: '检查网址是否输入正确。',
    goHomeSuggestion: '返回首页后重新浏览。',
  },
} as const;

export default status;
