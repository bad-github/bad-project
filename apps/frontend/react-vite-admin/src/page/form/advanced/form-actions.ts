import type {UseFormReturn} from 'react-hook-form';
import type {ProfileValues} from './form-model';

type ResetOptions = Parameters<UseFormReturn<ProfileValues>['reset']>[1];

/**
 * 此页所有 reset 统一走这个入口，包括刷新、丢弃修改和保存后回填。
 * 当前 RHF 版本在 shouldUnregister=true 时会于 reset 清空内部值；如果仍保留了已注册字段，
 * 可能出现 UI 显示新资料，但 resolver 收到的值缺字段的情况。
 * keepFieldsRef 保留现有字段引用并同步其内部值；不要只修某个刷新按钮而漏掉其他 reset。
 *
 * values 省略：恢复最近一次缓存的默认值。
 * values 传入资料：同时更新当前值与默认值，成为之后 dirty 比较和重置的基准。
 * keepDirtyValues=true：保留修改过的字段值，不等于“只保留 dirty 状态”的 keepDirty。
 * keepFieldsRef 放在 options 之后，确保调用者不会无意覆盖本页必需的同步策略。
 */
export function resetProfile(
  form: Pick<UseFormReturn<ProfileValues>, 'reset'>,
  values?: ProfileValues,
  options?: ResetOptions
) {
  form.reset(values, {...options, keepFieldsRef: true});
}
