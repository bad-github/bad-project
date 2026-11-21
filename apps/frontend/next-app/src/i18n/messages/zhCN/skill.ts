const skill = {
  // 页面 SEO 文案：用于浏览器标签和搜索结果，不是页面正文。
  metadata: {
    title: '技术技能｜阿超',
    description: '了解阿超在 React、Node.js、Next.js、NestJS、Docker、Vite 和 Webpack 等技术方面的实践经验。',
  },
  description: '以技术构筑想象，以工程兑现创意。从精致的交互体验到稳健的系统架构，从高效的研发体系到完整的产品交付，持续拓展产品与技术的边界。让复杂问题有清晰的解法，让每一个想法都有落地的可能。这里，是我的技术版图。',
  filters: {
    sort: '排序方式',
    defaultOrder: '默认顺序',
    search: '搜索技术栈',
    category: '分类筛选',
    all: '全部',
    empty: '没有找到匹配的技术栈，请尝试其他关键词或分类。',
  },
  groups: {
    frontend: "前端",
    backend: "后端",
    deployment: "运维",
    design: "设计工具",
  },
  technologies: {
    react: {name: "React", description: "构建组件化用户界面", preview: {"components": "组件化构建，可组合、可复用", "declarative": "声明式描述界面，减少手动操作 DOM", "state": "通过状态驱动交互与界面更新"}},
    vue: {name: "Vue", description: "渐进式用户界面框架", preview: {"point1": "响应式数据驱动界面更新", "point2": "单文件组件整合结构与逻辑", "point3": "组合式 API 复用有状态逻辑"}},
    nextjs: {name: "Next.js", description: "基于 React 的全栈应用框架", preview: {"point1": "基于 React 构建全栈应用", "point2": "文件系统路由与嵌套布局", "point3": "支持服务端渲染与静态生成"}},
    wechatMiniProgram: {name: "微信小程序", description: "微信生态中的小程序开发", preview: {"point1": "在微信内提供轻量应用体验", "point2": "以页面和组件组织功能", "point3": "调用微信开放能力与原生接口"}},
    tailwindCss: {name: "Tailwind CSS", description: "以工具类组合界面样式", preview: {"point1": "以工具类快速组合界面样式", "point2": "按断点与交互状态调整样式", "point3": "通过主题变量统一设计规范"}},
    shadcnUi: {name: "shadcn/ui", description: "可定制的界面组件与设计基础", preview: {"point1": "组件源码直接集成到项目", "point2": "按需调整样式与交互行为", "point3": "基于无障碍交互基础构建"}},
    tiptap: {"name": "Tiptap", "description": "基于 ProseMirror 的可扩展富文本编辑器", "preview": {"point1": "无头设计，自由定制编辑界面", "point2": "以扩展定义节点、标记与命令", "point3": "支持表格、媒体等丰富内容"}},
    echarts: {name: "ECharts", description: "交互式图表与数据可视化", preview: {"point1": "丰富的图表类型与组合能力", "point2": "支持交互联动与动态数据", "point3": "提供 Canvas 与 SVG 渲染"}},
    apollo: {name: "Apollo Client", description: "GraphQL 数据查询与客户端状态管理", preview: {"point1": "声明式查询与更新 GraphQL 数据", "point2": "规范化缓存减少重复请求", "point3": "管理查询状态与乐观更新"}},
    tanstack: {name: "TanStack", description: "覆盖数据查询、表格与路由的工具家族", preview: {"point1": "覆盖查询、表格与路由等场景", "point2": "无头设计，界面样式自由掌控", "point3": "强调类型安全与模块化组合"}},
    qiankun: {"name": "qiankun", "description": "跨框架的微前端应用集成方案", "preview": {"point1": "集成不同技术栈的子应用", "point2": "提供 JavaScript 沙箱与样式隔离", "point3": "支持独立开发部署与应用预加载"}},
    webpack: {name: "Webpack", description: "模块打包与构建流程配置", preview: {"point1": "分析模块依赖并打包应用资源", "point2": "通过 Loader 与插件扩展构建", "point3": "支持代码分割与按需加载"}},
    vite: {name: "Vite", description: "快速的开发服务与前端构建", preview: {"point1": "提供快速的本地开发服务", "point2": "热更新快速反馈代码修改", "point3": "整合面向生产环境的构建流程"}},
    pnpmWorkspace: {name: "pnpm Workspace", description: "Monorepo 工作空间与依赖管理", preview: {"point1": "统一管理 Monorepo 多个包", "point2": "通过 workspace 协议关联依赖", "point3": "共享锁文件，统一依赖解析"}},
    nodejs: {name: "Node.js", description: "服务端 JavaScript 运行时", preview: {"point1": "在服务端运行 JavaScript", "point2": "事件驱动与非阻塞 I/O", "point3": "适合构建接口、服务与开发工具"}},
    nestjs: {name: "NestJS", description: "模块化的 Node.js 服务端应用框架", preview: {"point1": "以模块、控制器与服务组织代码", "point2": "依赖注入解耦业务逻辑", "point3": "支持守卫、管道与拦截器"}},
    java: {name: "Java", description: "面向对象的服务端应用开发", preview: {"point1": "静态类型与面向对象编程", "point2": "基于 JVM 实现跨平台运行", "point3": "成熟的服务端生态与工具链"}},
    graphql: {name: "GraphQL", description: "以类型化查询描述 API 数据需求", preview: {"point1": "通过类型系统定义 API 契约", "point2": "客户端按需选择返回字段", "point3": "支持查询、变更与订阅"}},
    nginx: {name: "Nginx", description: "静态资源服务与反向代理", preview: {"point1": "提供高效的静态资源服务", "point2": "反向代理与负载均衡", "point3": "支持 TLS 终止与缓存配置"}},
    pm2: {name: "PM2", description: "Node.js 应用进程管理", preview: {"point1": "管理应用进程与运行日志", "point2": "进程异常退出后自动重启", "point3": "集群模式与应用平滑重载"}},
    docker: {name: "Docker", description: "容器化构建与应用部署", preview: {"point1": "将应用与依赖封装为镜像", "point2": "通过容器隔离应用运行环境", "point3": "统一开发、测试与部署环境"}},
    figma: {name: "Figma", description: "界面设计、原型与设计协作", preview: {"point1": "协作完成界面设计与原型", "point2": "组件与变量维护设计系统", "point3": "衔接设计交付与开发实现"}},
  },
} as const;

export default skill;
