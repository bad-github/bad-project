/**
 * 业务控件值不是原生 FileList：元数据/id 用于比较、展示和回填，file 用于本地预览，
 * url 用于回显已有图片。删除传 null，不把隐藏 input 的 FileList 直接交给 RHF。
 * RHF 不宜只依赖 File 对象做 dirty 比较，所以外层提供显式可比较的数据。
 */
export type CompanyLogo = {
  id: string;
  name: string;
  type: string;
  size: number;
  file?: File;
  url?: string;
};

export const MAX_LOGO_SIZE = 2 * 1024 * 1024;
export const LOGO_ACCEPT = 'image/png,image/jpeg';
let logoSequence = 0;

export function createCompanyLogo(file: File): CompanyLogo {
  // 显式标识和元数据用于 dirty 比较，避免仅比较 File 对象。
  // 时间戳+递增序号只用于当前页面识别，兼容没有 crypto.randomUUID 的 HTTP 访问环境。
  return {
    id: `logo_${Date.now().toString(36)}_${++logoSequence}`,
    name: file.name,
    type: file.type,
    size: file.size,
    file,
  };
}

export function validateCompanyLogo(value: CompanyLogo | null | undefined): true | string {
  // Logo 选填，删除/注销合法；若改为必填，应在企业条件 schema 中额外检查空值。
  if (!value) return true;
  // 新文件优先检查真实 File 元数据；已有 URL 回填使用服务返回的元数据。
  // 这里按 MIME 类型和大小检查，不代表已经解码图片或做过服务端内容安全检查。
  const type = value.file?.type ?? value.type;
  const size = value.file?.size ?? value.size;
  if (!['image/png', 'image/jpeg'].includes(type)) return 'Logo 仅支持 PNG 或 JPEG 图片';
  if (size <= 0) return '图片内容为空，请重新选择';
  if (size > MAX_LOGO_SIZE) return 'Logo 图片大小不能超过 2MB';
  if (!value.file && !value.url) return '图片已失效，请重新选择';
  return true;
}

/**
 * JSON、快照和草稿仅展示元数据，不携带 File 或临时 Blob URL。
 * 接受 Partial 以兼容 useWatch/defaultValues 的部分值；补空值只用于展示，不能拿来上传。
 */
export function previewCompanyLogo(value: Partial<CompanyLogo>): CompanyLogo {
  return {
    id: value.id ?? '',
    name: value.name ?? '',
    type: value.type ?? '',
    size: value.size ?? 0,
    ...(value.url ? {url: value.url} : {}),
  };
}
