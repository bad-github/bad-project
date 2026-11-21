import type {ComponentType, SVGProps} from 'react';
import ReactLogo from '@/assets/svg/react.svg';
import VueLogo from '@/assets/svg/vue.svg';
import NextjsLogo from '@/assets/svg/nextjs.svg';
import QiankunLogo from '@/assets/svg/qiankun.svg';
import TiptapLogo from '@/assets/svg/tiptap.svg';
import WechatMiniProgramLogo from '@/assets/svg/wechat-mini-program.svg';
import TailwindCssLogo from '@/assets/svg/tailwind-css.svg';
import ShadcnUiLogo from '@/assets/svg/shadcn-ui.svg';
import EchartsLogo from '@/assets/svg/echarts.svg';
import ApolloLogo from '@/assets/svg/apollo.svg';
import TanstackLogo from '@/assets/svg/tanstack.svg';
import WebpackLogo from '@/assets/svg/webpack.svg';
import ViteLogo from '@/assets/svg/vite.svg';
import PnpmLogo from '@/assets/svg/pnpm.svg';
import NodejsLogo from '@/assets/svg/nodejs.svg';
import NestjsLogo from '@/assets/svg/nestjs.svg';
import JavaLogo from '@/assets/svg/java.svg';
import GraphqlLogo from '@/assets/svg/graphql.svg';
import NginxLogo from '@/assets/svg/nginx.svg';
import Pm2Logo from '@/assets/svg/pm2.svg';
import DockerLogo from '@/assets/svg/docker.svg';
import FigmaLogo from '@/assets/svg/figma.svg';

export const TECHNOLOGY_GROUPS = ['frontend', 'backend', 'deployment', 'design'] as const;

export type TechnologyGroup = (typeof TECHNOLOGY_GROUPS)[number];

export type Technology = {
  id: string;
  name: string;
  group: TechnologyGroup;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName: string;
  previewKeys: readonly string[];
};

export const technologies = [
  {id: "react", previewKeys: ['technologies.react.preview.components', 'technologies.react.preview.declarative', 'technologies.react.preview.state'], icon: ReactLogo, iconClassName: "", name: "React", group: "frontend", href: "https://react.dev/"},
  {id: "vue", previewKeys: ['technologies.vue.preview.point1', 'technologies.vue.preview.point2', 'technologies.vue.preview.point3'], icon: VueLogo, iconClassName: "", name: "Vue", group: "frontend", href: "https://vuejs.org/"},
  {id: "nextjs", previewKeys: ['technologies.nextjs.preview.point1', 'technologies.nextjs.preview.point2', 'technologies.nextjs.preview.point3'], icon: NextjsLogo, iconClassName: "dark:invert", name: "Next.js", group: "frontend", href: "https://nextjs.org/"},
  {id: "wechatMiniProgram", previewKeys: ['technologies.wechatMiniProgram.preview.point1', 'technologies.wechatMiniProgram.preview.point2', 'technologies.wechatMiniProgram.preview.point3'], icon: WechatMiniProgramLogo, iconClassName: "dark:invert", name: "微信小程序", group: "frontend", href: "https://developers.weixin.qq.com/miniprogram/dev/framework/"},
  {id: "tailwindCss", previewKeys: ['technologies.tailwindCss.preview.point1', 'technologies.tailwindCss.preview.point2', 'technologies.tailwindCss.preview.point3'], icon: TailwindCssLogo, iconClassName: "", name: "Tailwind CSS", group: "frontend", href: "https://tailwindcss.com/"},
  {id: "shadcnUi", previewKeys: ['technologies.shadcnUi.preview.point1', 'technologies.shadcnUi.preview.point2', 'technologies.shadcnUi.preview.point3'], icon: ShadcnUiLogo, iconClassName: "", name: "shadcn/ui", group: "frontend", href: "https://ui.shadcn.com/"},
  {id: "tiptap", previewKeys: ['technologies.tiptap.preview.point1', 'technologies.tiptap.preview.point2', 'technologies.tiptap.preview.point3'], icon: TiptapLogo, iconClassName: "", name: "Tiptap", group: "frontend", href: "https://tiptap.dev/"},
  {id: "echarts", previewKeys: ['technologies.echarts.preview.point1', 'technologies.echarts.preview.point2', 'technologies.echarts.preview.point3'], icon: EchartsLogo, iconClassName: "fill-[#AA344D]", name: "ECharts", group: "frontend", href: "https://echarts.apache.org/"},
  {id: "apollo", previewKeys: ['technologies.apollo.preview.point1', 'technologies.apollo.preview.point2', 'technologies.apollo.preview.point3'], icon: ApolloLogo, iconClassName: "dark:brightness-0 dark:invert", name: "Apollo Client", group: "frontend", href: "https://www.apollographql.com/docs/react/"},
  {id: "tanstack", previewKeys: ['technologies.tanstack.preview.point1', 'technologies.tanstack.preview.point2', 'technologies.tanstack.preview.point3'], icon: TanstackLogo, iconClassName: "", name: "TanStack", group: "frontend", href: "https://tanstack.com/"},
  {id: "qiankun", previewKeys: ['technologies.qiankun.preview.point1', 'technologies.qiankun.preview.point2', 'technologies.qiankun.preview.point3'], icon: QiankunLogo, iconClassName: "", name: "qiankun", group: "frontend", href: "https://qiankun.umijs.org/"},
  {id: "webpack", previewKeys: ['technologies.webpack.preview.point1', 'technologies.webpack.preview.point2', 'technologies.webpack.preview.point3'], icon: WebpackLogo, iconClassName: "", name: "Webpack", group: "frontend", href: "https://webpack.js.org/"},
  {id: "vite", previewKeys: ['technologies.vite.preview.point1', 'technologies.vite.preview.point2', 'technologies.vite.preview.point3'], icon: ViteLogo, iconClassName: "", name: "Vite", group: "frontend", href: "https://vite.dev/"},
  {id: "pnpmWorkspace", previewKeys: ['technologies.pnpmWorkspace.preview.point1', 'technologies.pnpmWorkspace.preview.point2', 'technologies.pnpmWorkspace.preview.point3'], icon: PnpmLogo, iconClassName: "", name: "pnpm Workspace", group: "frontend", href: "https://pnpm.io/workspaces"},
  {id: "nodejs", previewKeys: ['technologies.nodejs.preview.point1', 'technologies.nodejs.preview.point2', 'technologies.nodejs.preview.point3'], icon: NodejsLogo, iconClassName: "", name: "Node.js", group: "backend", href: "https://nodejs.org/"},
  {id: "nestjs", previewKeys: ['technologies.nestjs.preview.point1', 'technologies.nestjs.preview.point2', 'technologies.nestjs.preview.point3'], icon: NestjsLogo, iconClassName: "", name: "NestJS", group: "backend", href: "https://nestjs.com/"},
  {id: "java", previewKeys: ['technologies.java.preview.point1', 'technologies.java.preview.point2', 'technologies.java.preview.point3'], icon: JavaLogo, iconClassName: "", name: "Java", group: "backend", href: "https://dev.java/"},
  {id: "graphql", previewKeys: ['technologies.graphql.preview.point1', 'technologies.graphql.preview.point2', 'technologies.graphql.preview.point3'], icon: GraphqlLogo, iconClassName: "", name: "GraphQL", group: "backend", href: "https://graphql.org/"},
  {id: "nginx", previewKeys: ['technologies.nginx.preview.point1', 'technologies.nginx.preview.point2', 'technologies.nginx.preview.point3'], icon: NginxLogo, iconClassName: "", name: "Nginx", group: "deployment", href: "https://nginx.org/"},
  {id: "pm2", previewKeys: ['technologies.pm2.preview.point1', 'technologies.pm2.preview.point2', 'technologies.pm2.preview.point3'], icon: Pm2Logo, iconClassName: "", name: "PM2", group: "deployment", href: "https://pm2.keymetrics.io/"},
  {id: "docker", previewKeys: ['technologies.docker.preview.point1', 'technologies.docker.preview.point2', 'technologies.docker.preview.point3'], icon: DockerLogo, iconClassName: "", name: "Docker", group: "deployment", href: "https://www.docker.com/"},
  {id: "figma", previewKeys: ['technologies.figma.preview.point1', 'technologies.figma.preview.point2', 'technologies.figma.preview.point3'], icon: FigmaLogo, iconClassName: "", name: "Figma", group: "design", href: "https://www.figma.com/"},
] as const satisfies readonly Technology[];
