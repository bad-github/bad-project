import {i18n, ready} from '../i18n';
import {create} from '@workspace/mock';
import {fakerLoaders} from '@workspace/mock/locales';
import type {FakerGenerationOptions, LoadFakerOptions} from '@workspace/mock';

/** 应用只适配当前界面语言，生成规则与通用查询均由 mock 包负责。 */
export async function getMock(options: FakerGenerationOptions & Pick<LoadFakerOptions, 'language'> = {}) {
  await ready;
  return create({
    loaders: fakerLoaders,
    ...options,
    language: options.language ?? i18n.resolvedLanguage ?? i18n.language,
  });
}
