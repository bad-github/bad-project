const portfolio = {
  // Page SEO copy: used in browser tabs and search results, not as project headings.
  metadata: {
    title: 'Featured Projects | bad',
    description:
      "Explore bad's software projects, including a React admin application, a component library built with shadcn/ui and Storybook, and a Tiptap rich text editor.",
  },
  previewPlaceholder: 'Project preview',
  technologyLabel: 'Technologies used',
  featured: {
    heading: 'Featured work',
    category: 'Web application',
    title: 'React Admin',
    description:
      'A React-based frontend solution for admin applications, featuring configurable themes, navigation, menus, foundational UI, and integration examples for commonly used React libraries. It helps developers quickly build and extend admin systems.',
  },
  actions: {
    website: 'Live website',
    github: 'GitHub',
  },
  otherProjects: {
    heading: 'Other projects',
  },
  uiBase: {
    category: 'UI component library',
    title: '@badnpm/ui',
    description:
      'A React component library built on shadcn/ui, with Storybook examples showcasing usage and interaction states. It includes foundational UI, application components, and reusable hooks for use across projects.',
  },
  tiptapEditor: {
    category: 'Rich text editor',
    title: 'Tiptap Editor',
    description:
      'A rich text editor built with Tiptap, featuring text formatting, tables, images, and code blocks. Modular extensions and custom toolbars support a variety of content editing needs.',
  },
  project3: {
    category: 'Open source',
    title: 'Project 3',
    description: 'Placeholder copy to be replaced with real project information later.',
  },
  project4: {
    category: 'Experiment',
    title: 'Project 4',
    description: 'Placeholder copy to be replaced with real project information later.',
  },
} as const;

export default portfolio;
