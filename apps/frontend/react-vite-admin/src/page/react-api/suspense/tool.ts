export type Scenario = 'success' | 'article-error' | 'comments-error' | 'empty-comments';

export interface Article {
  title: string;
  author: string;
  paragraphs: string[];
}

export interface ArticleComment {
  id: number;
  author: string;
  content: string;
}

const article: Article = {
  title: '让内容按自己的节奏出现',
  author: '林间编辑部',
  paragraphs: [
    '打开一篇文章时，读者最关心的是正文。评论可以晚一点出现，没有必要让阅读等待整个页面的所有请求。',
    '将正文和评论放在不同的加载边界中，正文准备好后就能开始阅读。评论区域继续显示占位内容，完成后再独立呈现。',
    '如果评论加载失败，正文仍然可以阅读。读者可以只重试评论，无需重新加载整篇文章。',
  ],
};

const comments: ArticleComment[] = [
  {id: 1, author: '小夏', content: '正文先出现，确实可以更早开始阅读。'},
  {id: 2, author: '阿川', content: '评论失败后独立重试，这个体验很直观。'},
];

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// 每轮演示有独立的失败状态：指定请求只失败一次，手动重试即可成功。
// 这是模拟接口，不在 React render 中创建 Promise 或维护自制 Suspense 缓存。
export function createArticleDemoApi(scenario: Scenario) {
  let articleShouldFail = scenario === 'article-error';
  let commentsShouldFail = scenario === 'comments-error';

  return {
    async getArticle(): Promise<Article> {
      await delay(1000);
      if (articleShouldFail) {
        articleShouldFail = false;
        throw new Error('正文请求失败，请重试。');
      }
      return article;
    },
    async getComments(): Promise<ArticleComment[]> {
      await delay(3000);
      if (commentsShouldFail) {
        commentsShouldFail = false;
        throw new Error('评论请求失败，请重试。');
      }
      return scenario === 'empty-comments' ? [] : comments;
    },
  };
}
