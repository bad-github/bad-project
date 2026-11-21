import type {SupabaseApiClient, StorageBucket} from './types';

/** 绑定客户端，常用文件方法将 bucket 放在第一个参数；选项和错误格式均沿用 SDK。 */
export function createStorageApi(client: SupabaseApiClient) {
  const storage = client.storage;
  return {
    /**
     * 选择一个存储桶，返回 SDK 原生文件 API，适合链式组织同一桶的多个操作。
     * @param id 存储桶 ID；不会创建桶，也不会改变其访问权限。
     * @example const avatars = api.storage.from('avatars'); await avatars.list();
     */
    from: storage.from.bind(storage),
    /**
     * 列出当前身份有权限读取的存储桶，不是列出某个桶里的文件。
     * @returns SDK 的 {data, error}，data 为存储桶列表。
     * @example const {data: buckets, error} = await api.storage.listBuckets();
     */
    listBuckets: storage.listBuckets.bind(storage),
    /**
     * 按桶 ID 获取存储桶配置，例如是否公开、文件大小和 MIME 类型限制。
     * @param id 存储桶 ID。
     * @example const {data: bucket} = await api.storage.getBucket('avatars');
     */
    getBucket: storage.getBucket.bind(storage),
    /**
     * 创建存储桶，可配置 public、allowedMimeTypes、fileSizeLimit 等选项。
     * @param id 新桶的 ID。
     * @param options 可选桶配置；fileSizeLimit 的数字值单位为字节。
     * @example await api.storage.createBucket('avatars', {public: false, fileSizeLimit: 1048576});
     */
    createBucket: storage.createBucket.bind(storage),
    /**
     * 修改现有存储桶的公开状态、允许的文件类型或单文件大小限制，不修改文件内容。
     * @param id 存储桶 ID。
     * @param options 要设置的桶配置。
     * @example await api.storage.updateBucket('avatars', {public: false});
     */
    updateBucket: storage.updateBucket.bind(storage),
    /**
     * 删除已经清空的存储桶；桶非空时不会自动帮你删除文件。
     * @param id 存储桶 ID。
     * @example await api.storage.deleteBucket('unused-bucket');
     */
    deleteBucket: storage.deleteBucket.bind(storage),
    /**
     * 删除指定桶中的文件内容，保留桶本身；属于整桶文件清理操作。
     * @param id 存储桶 ID。
     * @example await api.storage.emptyBucket('temporary-files');
     */
    emptyBucket: storage.emptyBucket.bind(storage),
    /**
     * 上传新文件；options.upsert 可控制同路径覆盖。
     * @param bucket 存储桶 ID。
     * @param args 依次为桶内文件路径、文件内容、可选上传配置；路径不包含桶名。
     * @returns SDK 的 {data, error}；成功数据包含文件路径等信息，不直接返回可访问 URL。
     * @example await api.storage.upload('avatars', 'alice.png', file, {upsert: true});
     */
    upload(bucket: string, ...args: Parameters<StorageBucket['upload']>) {
      return storage.from(bucket).upload(...args);
    },
    /**
     * 替换已存在的文件。
     * @param bucket 存储桶 ID。
     * @param args 依次为现有文件路径、新文件内容、可选上传配置。
     * @returns SDK 的 {data, error}，用于判断替换是否成功。
     * @example await api.storage.update('avatars', 'alice.png', file);
     */
    update(bucket: string, ...args: Parameters<StorageBucket['update']>) {
      return storage.from(bucket).update(...args);
    },
    /**
     * 下载文件，默认获得 Blob；复杂转换及流式类型可使用 from(bucket).download。
     * @param bucket 存储桶 ID。
     * @param args 依次为文件路径和可选下载/图片转换配置。
     * @returns 默认 data 为 Blob，失败信息在 error 中；下载不会自动触发浏览器保存对话框。
     * @example const {data, error} = await api.storage.download('avatars', 'alice.png');
     */
    download(bucket: string, ...args: Parameters<StorageBucket['download']>) {
      return storage.from(bucket).download(...args);
    },
    /**
     * 批量删除指定路径的文件。
     * @param bucket 存储桶 ID。
     * @param args 要删除的桶内路径列表及 SDK 支持的其他删除参数。
     * @returns SDK 的删除结果与 error；不删除存储桶本身。
     * @example await api.storage.remove('avatars', ['alice.png', 'bob.png']);
     */
    remove(bucket: string, ...args: Parameters<StorageBucket['remove']>) {
      return storage.from(bucket).remove(...args);
    },
    /**
     * 分页列举文件，支持 search、sortBy、limit、offset。
     * @param bucket 存储桶 ID。
     * @param args 依次为目录前缀、分页/搜索/排序选项等 SDK 参数；offset 从 0 开始。
     * @returns SDK 文件/目录条目数组及 error；只列出当前目录，不递归遍历子目录。
     * @example await api.storage.list('avatars', 'users', {limit: 20, offset: 0});
     */
    list(bucket: string, ...args: Parameters<StorageBucket['list']>) {
      return storage.from(bucket).list(...args);
    },
    /**
     * 移动或重命名文件。
     * @param bucket 源存储桶 ID。
     * @param args 依次为源文件路径、目标文件路径及 SDK 支持的移动选项。
     * @returns SDK 移动结果与 error；成功后源路径不再保留该文件。
     * @example await api.storage.move('avatars', 'old.png', 'users/new.png');
     */
    move(bucket: string, ...args: Parameters<StorageBucket['move']>) {
      return storage.from(bucket).move(...args);
    },
    /**
     * 复制文件。
     * @param bucket 源存储桶 ID。
     * @param args 依次为源文件路径、目标文件路径及 SDK 支持的复制选项。
     * @returns SDK 复制结果与 error；源文件保留。
     * @example await api.storage.copy('avatars', 'alice.png', 'backup/alice.png');
     */
    copy(bucket: string, ...args: Parameters<StorageBucket['copy']>) {
      return storage.from(bucket).copy(...args);
    },
    /**
     * 创建私有文件临时访问地址，expiresIn 单位为秒。
     * @param bucket 存储桶 ID。
     * @param args 依次为文件路径、有效秒数和可选下载/图片转换配置。
     * @returns SDK 的 {data, error}，成功后从 data.signedUrl 读取临时访问地址。
     * @example await api.storage.createSignedUrl('private', 'report.pdf', 60);
     */
    createSignedUrl(bucket: string, ...args: Parameters<StorageBucket['createSignedUrl']>) {
      return storage.from(bucket).createSignedUrl(...args);
    },
    /**
     * 为多个文件创建临时访问地址。
     * @param bucket 存储桶 ID。
     * @param args 依次为文件路径数组、有效秒数及可选配置。
     * @returns 签名结果数组及 error；应同时检查各条目的签名结果。
     * @example await api.storage.createSignedUrls('private', ['a.pdf', 'b.pdf'], 60);
     */
    createSignedUrls(bucket: string, ...args: Parameters<StorageBucket['createSignedUrls']>) {
      return storage.from(bucket).createSignedUrls(...args);
    },
    /**
     * 创建临时上传凭证，随后可交给客户端上传。
     * @param bucket 存储桶 ID。
     * @param args 依次为待上传的目标文件路径和可选配置。
     * @returns SDK 的 {data, error}，成功后 data 包含 path、token 和 signedUrl。
     * @example await api.storage.createSignedUploadUrl('private', 'report.pdf');
     */
    createSignedUploadUrl(bucket: string, ...args: Parameters<StorageBucket['createSignedUploadUrl']>) {
      return storage.from(bucket).createSignedUploadUrl(...args);
    },
    /**
     * 使用临时上传凭证上传文件。
     * @param bucket 签名凭证对应的存储桶 ID。
     * @param args 依次为签名对应的目标路径、token、文件内容和可选上传配置。
     * @returns SDK 上传结果与 error；目标路径应与生成签名时保持一致。
     * @example await api.storage.uploadToSignedUrl('private', 'report.pdf', token, file);
     */
    uploadToSignedUrl(bucket: string, ...args: Parameters<StorageBucket['uploadToSignedUrl']>) {
      return storage.from(bucket).uploadToSignedUrl(...args);
    },
    /**
     * 生成公开桶文件地址；不会发请求，也不会检查文件存在或自动将桶公开。
     * @param bucket 公开存储桶 ID。
     * @param args 依次为文件路径及可选下载/图片转换配置。
     * @returns 同步返回 {data: {publicUrl}}；没有网络请求，也不提供文件存在性检查结果。
     * @example const {data} = api.storage.getPublicUrl('avatars', 'alice.png');
     */
    getPublicUrl(bucket: string, ...args: Parameters<StorageBucket['getPublicUrl']>) {
      return storage.from(bucket).getPublicUrl(...args);
    },
    /**
     * 检查文件是否存在。
     * @param bucket 存储桶 ID。
     * @param args 要检查的文件路径。
     * @returns SDK 的 {data, error}；data 为是否存在，需同时检查 error 区分查询失败。
     * @example await api.storage.exists('avatars', 'alice.png');
     */
    exists(bucket: string, ...args: Parameters<StorageBucket['exists']>) {
      return storage.from(bucket).exists(...args);
    },
    /**
     * 读取文件元数据。
     * @param bucket 存储桶 ID。
     * @param args 要读取元数据的文件路径。
     * @returns SDK 文件元数据与 error，不下载文件内容。
     * @example await api.storage.info('avatars', 'alice.png');
     */
    info(bucket: string, ...args: Parameters<StorageBucket['info']>) {
      return storage.from(bucket).info(...args);
    },
  };
}
