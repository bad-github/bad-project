import {forwardRef, useEffect, useRef, useState, type AriaAttributes} from 'react';
import {ImageIcon, Loader2Icon, UploadIcon} from 'lucide-react';
import {Button} from '@badnpm/ui';
import {createCompanyLogo, LOGO_ACCEPT, validateCompanyLogo, type CompanyLogo} from './logo-model';

/**
 * 自定义控件遵循受控契约：value 是唯一业务值来源，onChange 才能提交新值。
 * pending/preview/error 是 UI 状态，不直接塞进 RHF 值；通过事件向外报告上传状态/错误。
 * upload 作为依赖注入，让控件不耦合此页面的 API，更换真实接口无需重写交互。
 */
type Props = Pick<AriaAttributes, 'aria-invalid' | 'aria-describedby'> & {
  id?: string;
  name?: string;
  value: CompanyLogo | null;
  onChange: (value: CompanyLogo | null) => void;
  onBlur?: () => void;
  upload: (file: File) => Promise<CompanyLogo>;
  onUploadingChange?: (uploading: boolean) => void;
  onUploadError?: (message: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
};

/**
 * 此组件不导入 RHF，由外层 Controller 适配：
 * field.value→value，field.onChange→onChange，field.onBlur→onBlur，field.ref→上传按钮。
 * ref 指向可见按钮而非 hidden 文件 input，保证 setFocus/提交错误聚焦可用。
 */
export default forwardRef<HTMLButtonElement, Props>(function LogoUpload(
  {
    value,
    onChange,
    onBlur,
    upload,
    onUploadingChange,
    onUploadError,
    disabled = false,
    readOnly = false,
    ...attributes
  },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  // 可变请求序号用于忽略旧结果，不用于渲染，因此不需要每次递增都触发 React 更新。
  const request = useRef({id: 0}).current;
  const uploadingCallback = useRef(onUploadingChange);
  // 新文件等待上传成功前暂存在这里，旧 value 仍是当前表单值，缩略图改为 loading。
  const [pending, setPending] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [preview, setPreview] = useState<{file: File; url: string} | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const file = value && validateCompanyLogo(value) === true ? value.file : undefined;
  const inactive = disabled || readOnly;

  // 用 ref 读取最新回调，父组件回调引用变化不会误取消正在进行的上传。
  useEffect(() => {
    uploadingCallback.current = onUploadingChange;
  }, [onUploadingChange]);
  useEffect(() => {
    // 外部 reset/回填改变 value，或控件被禁用，意味着当前上传不应再接管此控件。
    setPending(null);
    setUploadError('');
    uploadingCallback.current?.(false);
    return () => {
      // 重置、禁用或卸载使当前请求失效，旧结果不能回写表单。
      // 这是丢弃结果，并非中断 sleep/网络传输；真实接口可进一步支持 AbortSignal。
      request.id++;
      uploadingCallback.current?.(false);
    };
  }, [value, inactive, request]);

  const selectFile = async (selected: File) => {
    const candidate = createCompanyLogo(selected);
    const valid = validateCompanyLogo(candidate);
    setUploadError('');
    if (valid !== true) {
      // 非法选择交给外层 schema 显示字段错误，但不发上传请求，也不生成其预览 URL。
      onChange(candidate);
      return;
    }
    const id = ++request.id;
    setPending(selected);
    // 通知页面暂时禁止保存/刷新；RHF 的 isSubmitting 不会自动覆盖这个独立上传过程。
    onUploadingChange?.(true);
    try {
      const uploaded = await upload(selected);
      // 只有当前请求成功才提交业务值，继而触发 RHF 的 dirty、校验和预览更新。
      if (request.id === id) onChange(uploaded);
    } catch (error) {
      if (request.id === id) {
        const message = error instanceof Error ? error.message : '上传失败，请重试';
        setUploadError(message);
        // 接入 RHF 时由外层 setError('company.logo')；独立使用时显示本地错误。
        // 失败不 onChange，所以已有有效图片保持不变。
        onUploadError?.(message);
      }
    } finally {
      if (request.id === id) {
        setPending(null);
        onUploadingChange?.(false);
      }
    }
  };

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    // 仅为已经提交到 value 的文件生成预览；已有 url 的回填不重新上传。
    // Blob URL 只存在于组件状态，不进入表单、JSON 或提交数据。
    const url = URL.createObjectURL(file);
    setPreview({file, url});
    // 释放本组件创建的 URL：更换、删除、卸载都走 cleanup，避免占用文件内存。
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const src = value?.file ? (preview?.file === file ? preview?.url : undefined) : value?.url;
  return (
    <div
      aria-busy={Boolean(pending)}
      onBlur={(event) => {
        // 焦点从上传按钮移到删除按钮仍属于内部操作，只有离开整个控件才算失焦。
        if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.();
      }}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border">
          {pending ? (
            <Loader2Icon aria-label="正在上传" className="text-primary size-6 animate-spin" />
          ) : src && src !== failedUrl ? (
            <img
              src={src}
              alt="企业 Logo 预览"
              className="size-full object-contain"
              onError={() => setFailedUrl(src)}
            />
          ) : (
            <ImageIcon aria-hidden="true" className="text-muted-foreground size-7" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p role="status" className="text-muted-foreground text-xs break-all">
            {pending
              ? `正在上传 ${pending.name}…`
              : value
                ? `${value.name} · ${(value.size / 1024).toFixed(1)} KB`
                : '尚未上传 Logo'}
          </p>
          {uploadError && !onUploadError && (
            <p role="alert" className="text-destructive text-xs">
              {uploadError}
            </p>
          )}
          {!pending && src && src === failedUrl && (
            <p role="status" className="text-destructive text-xs">
              图片无法预览，请更换图片。
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              {...attributes}
              ref={ref}
              type="button"
              size="sm"
              variant="outline"
              disabled={inactive || Boolean(pending)}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon aria-hidden="true" />
              {pending ? '上传中…' : value ? '更换图片' : '上传 Logo'}
            </Button>
            {pending ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={inactive}
                onClick={() => {
                  // 不调用 onChange，取消后恢复原业务值；序号递增使旧成功/失败都失效。
                  request.id++;
                  setPending(null);
                  onUploadingChange?.(false);
                }}
              >
                取消上传
              </Button>
            ) : (
              value && (
                // 删除用 null 明确清空，Controller 的受控值随之更新，不传 undefined。
                <Button type="button" size="sm" variant="ghost" disabled={inactive} onClick={() => onChange(null)}>
                  删除
                </Button>
              )
            )}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        // accept 只过滤选择对话框，不是最终校验；selectFile 和上传接口都会检查文件。
        accept={LOGO_ACCEPT}
        hidden
        disabled={inactive || Boolean(pending)}
        onChange={(event) => {
          const selected = event.currentTarget.files?.[0];
          // 清理原生选择记录，同一文件再次选择也能触发 change；取消不修改表单。
          event.currentTarget.value = '';
          if (selected && !inactive && !pending) void selectFile(selected);
        }}
      />
    </div>
  );
});
