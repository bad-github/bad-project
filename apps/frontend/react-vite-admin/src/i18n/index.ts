import {StorageKeys} from '@/utils/storage-keys';
import {createI18n} from '@workspace/i18n';
import {localeLoaders} from '@workspace/i18n/locales';
const handleLngChange = (lng: string) => {
  document.documentElement.lang = i18n.resolvedLanguage ?? lng;
  // 加载失败时 i18next 仍可能发出 languageChanged；仅保存实际加载成功的语言。
  if (i18n.resolvedLanguage !== lng) return;
  try {
    localStorage.setItem(StorageKeys.language, lng);
  } catch {
    // 存储不可用时仍允许切换语言，只是不保存偏好。
  }
};

// 当前只加载默认 translation 命名空间；新增语言在共享 localeLoaders 中注册。
// await i18n.changeLanguage('en') 会自动加载英文及回退语言。
// 独立业务命名空间注册后，使用 i18n.loadNamespaces('order') 按需加载。
// 显式传入语言，避免共享库默认读取其他应用的 i18nextLng。
function getInitialLanguage() {
  try {
    return localStorage.getItem(StorageKeys.language) || document.documentElement.lang || 'zh';
  } catch {
    return document.documentElement.lang || 'zh';
  }
}

const {i18n, ready} = createI18n({loaders: localeLoaders, lng: getInitialLanguage()});

ready
  .then(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? i18n.language;
  })
  .catch((err) => {
    console.error('Error i18n initialized', err);
  });
i18n.off('languageChanged', handleLngChange);
i18n.on('languageChanged', handleLngChange);
if (import.meta.hot) {
  import.meta.hot.dispose(() => i18n.off('languageChanged', handleLngChange));
}

export {i18n, ready};
