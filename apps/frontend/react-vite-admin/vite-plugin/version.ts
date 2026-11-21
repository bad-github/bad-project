import type {Plugin, ResolvedConfig} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';

export function getDate(date: Date) {
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

interface GitInfo {
  commitDate: string;
  commitHash: string;
  commitAuthor: string;
  commitEmail: string;
}


/**
 * 一次 Git 子进程获取所有 Git 信息
*/
export function getGitInfo(): GitInfo {
  // 如果以移到没有Git的CI环境，就读CI注入的环境变量，比如 GIT_COMMIT、BUILD_TIME，没有再回退到默认值
  if (process.env.GIT_COMMIT) {
    return {
      commitHash: process.env.GIT_COMMIT,
      commitDate: process.env.GIT_COMMIT_DATE || '',
      commitAuthor: process.env.GIT_COMMIT_AUTHOR || 'unknown',
      commitEmail: process.env.GIT_COMMIT_EMAIL || 'unknown',
    };
  }
  const defaultValue: GitInfo = {
    commitDate: '',
    commitHash: 'unknown',
    commitAuthor: 'unknown',
    commitEmail: 'unknown',
  };

  try {
    /**
     * 一次 git show 获取：
     *
     * %H  commit hash
     * %cd commit date
     * %cn commit author
     * %ce commit email
     *
     * 使用特殊分隔符避免字段内容中出现普通字符导致解析错误
     */
    const result = execSync('git show -s --format="%H%n%cd%n%cn%n%ce"', {
      encoding: 'utf-8',
    }).trim();

    const [commitHash, commitDateRaw, commitAuthor, commitEmail] = result.split('\n');

    let commitDate = '';

    if (commitDateRaw) {
      const date = new Date(commitDateRaw);

      if (!Number.isNaN(date.getTime())) {
        commitDate = getDate(date);
      }
    }

    return {
      commitDate,
      commitHash: commitHash || defaultValue.commitHash,
      commitAuthor: commitAuthor || defaultValue.commitAuthor,
      commitEmail: commitEmail || defaultValue.commitEmail,
    };
  } catch {
    return defaultValue;
  }
}

export default function createVersionHtml(): Plugin {
  // 构建开始时确定构建时间
  const buildDate = getDate(new Date());

  let resolvedConfig: ResolvedConfig | null = null;

  return {
    name: 'create-version-html',

    configResolved(config) {
      resolvedConfig = config;
    },

    config() {
      return {
        define: {
          'process.env.APP_BUILD_TIME': JSON.stringify(buildDate),
        },
      };
    },

    // 所有产物已写入磁盘
    writeBundle() {
      try {
        // 只创建一次 Git 子进程
        const gitInfo = getGitInfo();

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Version</title>
</head>
<body>
  <ul>
    <li>Commit Date: ${gitInfo.commitDate}</li>
    <li>Commit Hash: ${gitInfo.commitHash}</li>
    <li>Commit Author: ${gitInfo.commitAuthor}</li>
    <li>Commit Email: ${gitInfo.commitEmail}</li>
    <li>Build Date: ${buildDate}</li>
  </ul>
</body>
</html>
`;

        const outDir = resolvedConfig?.build?.outDir || 'dist';

        const outPath = path.resolve(process.cwd(), outDir, 'version.html');

        fs.writeFileSync(outPath, htmlContent, 'utf-8');

        console.log('✅ version.html generated successfully!');
      } catch (err) {
        console.error('❌ Failed to generate version.html:', err);
      }
    },
  };
}
