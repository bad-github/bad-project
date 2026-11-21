const status = {
  loading: '載入中……',
  error: {
    title: '頁面發生錯誤',
    retry: '重試',
  },
  notFound: {
    title: '找不到頁面',
    description: '你造訪的頁面不存在，可能已被移動或刪除。',
    goHome: '返回首頁',
    suggestionTitle: '你可以嘗試',
    checkUrl: '檢查網址是否輸入正確。',
    goHomeSuggestion: '返回首頁後重新瀏覽。',
  },
} as const;

export default status;
