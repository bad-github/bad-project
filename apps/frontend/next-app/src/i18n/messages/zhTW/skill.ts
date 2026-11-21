const skill = {
  // 頁面 SEO 文案：用於瀏覽器標籤和搜尋結果，不是頁面正文。
  metadata: {
    title: '技術技能｜阿超',
    description: '了解阿超在 React、Node.js、Next.js、NestJS、Docker、Vite 和 Webpack 等技術方面的實務經驗。',
  },
  description: '以技術構築想像，以工程實現創意。從精緻的互動體驗到穩健的系統架構，從高效的研發體系到完整的產品交付，持續拓展產品與技術的邊界。讓複雜問題有清晰的解法，讓每一個想法都有實現的可能。這裡，是我的技術版圖。',
  filters: {
    sort: '排序方式',
    defaultOrder: '預設順序',
    search: '搜尋技術棧',
    category: '依分類篩選',
    all: '全部',
    empty: '找不到符合條件的技術棧，請嘗試其他關鍵字或分類。',
  },
  groups: {
    frontend: "前端",
    backend: "後端",
    deployment: "維運",
    design: "設計工具",
  },
  technologies: {
    react: {name: "React", description: "建構元件化使用者介面", preview: {"components": "元件化建構，可組合、可重用", "declarative": "宣告式描述介面，減少手動操作 DOM", "state": "透過狀態驅動互動與介面更新"}},
    vue: {name: "Vue", description: "漸進式使用者介面框架", preview: {"point1": "響應式資料驅動介面更新", "point2": "單檔元件整合結構與邏輯", "point3": "組合式 API 重用有狀態邏輯"}},
    nextjs: {name: "Next.js", description: "基於 React 的全端應用框架", preview: {"point1": "基於 React 建構全端應用", "point2": "檔案系統路由與巢狀佈局", "point3": "支援伺服器渲染與靜態生成"}},
    wechatMiniProgram: {name: "微信小程式", description: "微信生態中的小程式開發", preview: {"point1": "在微信內提供輕量應用體驗", "point2": "以頁面與元件組織功能", "point3": "呼叫微信開放能力與原生介面"}},
    tailwindCss: {name: "Tailwind CSS", description: "以工具類別組合介面樣式", preview: {"point1": "以工具類別快速組合介面樣式", "point2": "依斷點與互動狀態調整樣式", "point3": "透過主題變數統一設計規範"}},
    shadcnUi: {name: "shadcn/ui", description: "可自訂的介面元件與設計基礎", preview: {"point1": "元件原始碼直接整合至專案", "point2": "依需求調整樣式與互動行為", "point3": "基於無障礙互動基礎建構"}},
    tiptap: {"name": "Tiptap", "description": "基於 ProseMirror 的可擴充富文字編輯器", "preview": {"point1": "無頭設計，自由自訂編輯介面", "point2": "以擴充定義節點、標記與命令", "point3": "支援表格、媒體等豐富內容"}},
    echarts: {name: "ECharts", description: "互動式圖表與資料視覺化", preview: {"point1": "豐富的圖表類型與組合能力", "point2": "支援互動連動與動態資料", "point3": "提供 Canvas 與 SVG 渲染"}},
    apollo: {name: "Apollo Client", description: "GraphQL 資料查詢與用戶端狀態管理", preview: {"point1": "宣告式查詢與更新 GraphQL 資料", "point2": "正規化快取減少重複請求", "point3": "管理查詢狀態與樂觀更新"}},
    tanstack: {name: "TanStack", description: "涵蓋資料查詢、表格與路由的工具家族", preview: {"point1": "涵蓋查詢、表格與路由等情境", "point2": "無頭設計，自由掌控介面樣式", "point3": "強調型別安全與模組化組合"}},
    qiankun: {"name": "qiankun", "description": "跨框架的微前端應用整合方案", "preview": {"point1": "整合不同技術棧的子應用", "point2": "提供 JavaScript 沙箱與樣式隔離", "point3": "支援獨立開發部署與應用預載入"}},
    webpack: {name: "Webpack", description: "模組打包與建置流程設定", preview: {"point1": "分析模組相依並打包應用資源", "point2": "透過 Loader 與外掛擴充建置", "point3": "支援程式碼分割與按需載入"}},
    vite: {name: "Vite", description: "快速的開發伺服器與前端建置", preview: {"point1": "提供快速的本機開發伺服器", "point2": "熱更新快速反映程式碼修改", "point3": "整合正式環境的建置流程"}},
    pnpmWorkspace: {name: "pnpm Workspace", description: "Monorepo 工作空間與相依套件管理", preview: {"point1": "統一管理 Monorepo 多個套件", "point2": "透過 workspace 協定連結相依", "point3": "共用鎖定檔，統一相依解析"}},
    nodejs: {name: "Node.js", description: "伺服器端 JavaScript 執行環境", preview: {"point1": "在伺服器端執行 JavaScript", "point2": "事件驅動與非阻塞 I/O", "point3": "適合建構介面、服務與開發工具"}},
    nestjs: {name: "NestJS", description: "模組化的 Node.js 伺服器端應用框架", preview: {"point1": "以模組、控制器與服務組織程式", "point2": "相依注入解耦業務邏輯", "point3": "支援守衛、管道與攔截器"}},
    java: {name: "Java", description: "物件導向的伺服器端應用開發", preview: {"point1": "靜態型別與物件導向程式設計", "point2": "基於 JVM 實現跨平台執行", "point3": "成熟的伺服器生態與工具鏈"}},
    graphql: {name: "GraphQL", description: "以型別化查詢描述 API 資料需求", preview: {"point1": "透過型別系統定義 API 契約", "point2": "用戶端按需選擇回傳欄位", "point3": "支援查詢、變更與訂閱"}},
    nginx: {name: "Nginx", description: "靜態資源服務與反向代理", preview: {"point1": "提供高效的靜態資源服務", "point2": "反向代理與負載平衡", "point3": "支援 TLS 終止與快取設定"}},
    pm2: {name: "PM2", description: "Node.js 應用程式處理程序管理", preview: {"point1": "管理應用程式與執行日誌", "point2": "處理程序異常結束後自動重啟", "point3": "叢集模式與應用程式平滑重載"}},
    docker: {name: "Docker", description: "容器化建置與應用程式部署", preview: {"point1": "將應用程式與相依封裝為映像", "point2": "透過容器隔離應用執行環境", "point3": "統一開發、測試與部署環境"}},
    figma: {name: "Figma", description: "介面設計、原型與設計協作", preview: {"point1": "協作完成介面設計與原型", "point2": "元件與變數維護設計系統", "point3": "銜接設計交付與開發實作"}},
  },
} as const;

export default skill;
