const skill = {
  // Page SEO copy: used in browser tabs and search results, not as page content.
  metadata: {
    title: 'Technical Skills | bad',
    description: "Explore bad's experience with React, Node.js, Next.js, NestJS, Docker, Vite, and Webpack.",
  },
  description: 'Shaping imagination through technology, bringing ideas to life through engineering. From refined interactions to resilient system architecture, from efficient development workflows to end-to-end product delivery, I continually push the boundaries of product and technology. Finding clear solutions to complex problems and turning every idea into a possibility. This is my technology landscape.',
  filters: {
    sort: 'Sort order',
    defaultOrder: 'Default',
    search: 'Search technologies',
    category: 'Filter by category',
    all: 'All',
    empty: 'No matching technologies. Try another keyword or category.',
  },
  groups: {
    frontend: "Frontend",
    backend: "Backend",
    deployment: "Operations",
    design: "Design Tools",
  },
  technologies: {
    react: {name: "React", description: "Build component-based user interfaces", preview: {"components": "Reusable, composable components", "declarative": "Declarative UI rendering", "state": "State-driven interface updates"}},
    vue: {name: "Vue", description: "A progressive framework for user interfaces", preview: {"point1": "Reactive interface updates", "point2": "Single-file components", "point3": "Composable stateful logic"}},
    nextjs: {name: "Next.js", description: "A React framework for full-stack applications", preview: {"point1": "Full-stack React applications", "point2": "File-based routes and layouts", "point3": "Server rendering and static pages"}},
    wechatMiniProgram: {name: "WeChat Mini Programs", description: "Mini program development in the WeChat ecosystem", preview: {"point1": "Lightweight apps within WeChat", "point2": "Page and component architecture", "point3": "Access to WeChat platform APIs"}},
    tailwindCss: {name: "Tailwind CSS", description: "Compose interface styles with utility classes", preview: {"point1": "Compose styles with utilities", "point2": "Responsive and state variants", "point3": "Theme variables for consistency"}},
    shadcnUi: {name: "shadcn/ui", description: "Customizable UI components and design foundations", preview: {"point1": "Component source in your project", "point2": "Customizable styles and behavior", "point3": "Accessible interaction primitives"}},
    tiptap: {"name": "Tiptap", "description": "An extensible editor built on ProseMirror", "preview": {"point1": "Headless, customizable editing UI", "point2": "Extend nodes, marks, and commands", "point3": "Rich content: tables, media, and more"}},
    echarts: {name: "ECharts", description: "Interactive charts and data visualization", preview: {"point1": "Rich, composable chart types", "point2": "Linked charts and live data", "point3": "Canvas and SVG rendering"}},
    apollo: {name: "Apollo Client", description: "GraphQL queries and client-side state management", preview: {"point1": "Declarative GraphQL operations", "point2": "Normalized client-side caching", "point3": "Query states and optimistic UI"}},
    tanstack: {name: "TanStack", description: "A family of tools for queries, tables, and routing", preview: {"point1": "Tools for queries, tables, routing", "point2": "Headless, fully customizable UI", "point3": "Type-safe, composable libraries"}},
    qiankun: {"name": "qiankun", "description": "Framework-agnostic micro-frontend integration", "preview": {"point1": "Integrate apps across frameworks", "point2": "JavaScript sandbox and style isolation", "point3": "Independent apps and preloading"}},
    webpack: {name: "Webpack", description: "Module bundling and build configuration", preview: {"point1": "Bundle modules and app assets", "point2": "Extend with loaders and plugins", "point3": "Code splitting and lazy loading"}},
    vite: {name: "Vite", description: "Fast development tooling and frontend builds", preview: {"point1": "Fast local development server", "point2": "Hot module replacement", "point3": "Production-ready build pipeline"}},
    pnpmWorkspace: {name: "pnpm Workspace", description: "Monorepo workspaces and dependency management", preview: {"point1": "Manage packages in a monorepo", "point2": "Link local workspace dependencies", "point3": "Shared lockfile and resolution"}},
    nodejs: {name: "Node.js", description: "A JavaScript runtime for server-side development", preview: {"point1": "Run JavaScript on the server", "point2": "Event-driven, non-blocking I/O", "point3": "Build APIs, services, and tooling"}},
    nestjs: {name: "NestJS", description: "A modular Node.js framework for server applications", preview: {"point1": "Modules, controllers, services", "point2": "Built-in dependency injection", "point3": "Guards, pipes, and interceptors"}},
    java: {name: "Java", description: "Object-oriented server-side application development", preview: {"point1": "Static types and object orientation", "point2": "Cross-platform execution on JVM", "point3": "Mature server-side ecosystem"}},
    graphql: {name: "GraphQL", description: "Describe API data requirements with typed queries", preview: {"point1": "Typed schemas define API contracts", "point2": "Request exactly the fields needed", "point3": "Queries, mutations, subscriptions"}},
    nginx: {name: "Nginx", description: "Static file serving and reverse proxying", preview: {"point1": "Efficient static file serving", "point2": "Reverse proxy and load balancing", "point3": "TLS termination and caching"}},
    pm2: {name: "PM2", description: "Process management for Node.js applications", preview: {"point1": "Manage app processes and logs", "point2": "Restart apps after crashes", "point3": "Cluster mode and graceful reloads"}},
    docker: {name: "Docker", description: "Containerized builds and application deployment", preview: {"point1": "Package apps and dependencies", "point2": "Isolate runtimes with containers", "point3": "Consistent development and delivery"}},
    figma: {name: "Figma", description: "Interface design, prototyping, and collaboration", preview: {"point1": "Collaborative UI and prototyping", "point2": "Components and design variables", "point3": "Design-to-development handoff"}},
  },
} as const;

export default skill;
