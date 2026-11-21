import type {Plugin} from 'vite';
import {parse} from 'node-html-parser';
// 此文件也属于 Vite 配置依赖链，需保留 .ts 扩展名以兼容 Node 原生 ESM 加载。
import {getGitInfo} from './version.ts';

export function getDate(date: Date) {
  const year = date.getFullYear().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function injectBuildAttr(): Plugin {
  return {
    name: 'inject-build-attr',
    apply: 'build', // 默认run dev(serve)/run build(build)都会执行
    // 撰文处理index.html，在html写入dist之前调用，只会修改打包后的index.html
    transformIndexHtml(html: any) {
      const root = parse(html);
      const rootDiv = root.querySelector('#g-root');
      if (!rootDiv) return html;

      const buildTime = getDate(new Date());
      const gitInfo = getGitInfo();
      rootDiv.setAttribute('data-build', buildTime);
      rootDiv.setAttribute('data-commit-hash', gitInfo.commitHash);

      // todo，注入git commit hash
      console.log(`✅ inject data-build (${buildTime}) successfully`);
      return root.toString();
    },
  };
}
