function getTextWidth(text: string, fontSize = '14px', fontFamily = 'Source Han Sans SC') {
  if (!text) return 0;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context)
    // 中文宽度14
    return [...text].reduce((width, char) => width + (/[\u4e00-\u9fa5]/.test(char) ? 14 : 8), 0);
  context.font = `${fontSize} ${fontFamily}`;
  return context.measureText(text).width;
}

function getNextChar(char: string) {
  return String.fromCharCode(char.charCodeAt(0) + 1);
}

function copyText(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard && window.isSecureContext) {
      // 优先使用现代异步 API
      navigator.clipboard
        .writeText(text)
        .then(() => resolve())
        .catch((err) => reject(err));
    } else {
      // 兼容旧环境（非 https）
      try {
        const element = document.createElement('textarea');
        element.value = text;
        // 防止页面滚动
        element.style.position = 'fixed';
        element.style.left = '-9999px';
        document.body.appendChild(element);
        element.focus();
        element.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(element);
        if (successful) {
          resolve();
        } else {
          reject(new Error('Copy command failed'));
        }
      } catch (err) {
        reject(err);
      }
    }
  });
}

/** 文本测量、字符处理与复制。 */
export const text = {getTextWidth, getNextChar, copyText};
