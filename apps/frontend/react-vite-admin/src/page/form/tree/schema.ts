import {z} from 'zod';

export type Option = {label: string; value: string};

/** 配置使用判别联合：只有选项类控件才需要 options，数字类控件才需要范围。 */
export type ControlConfig =
  | {type: 'input' | 'password'; placeholder?: string}
  | {type: 'number'; min: number; max: number; step: number}
  | {type: 'textarea'; rows: number}
  | {type: 'switch' | 'checkbox' | 'toggle'}
  | {
      type:
        | 'select'
        | 'multi-select'
        | 'native-select'
        | 'radio-group'
        | 'checkbox-group'
        | 'combobox'
        | 'toggle-group';
      options: Option[];
    }
  | {type: 'slider' | 'range-slider'; min: number; max: number; step: number}
  | {type: 'date' | 'date-range'}
  | {type: 'input-otp'; length: number};

export type ControlType = ControlConfig['type'];

/** 每个节点既可以编辑自己的值，也可以包含子节点，保持原页面的树形增删能力。 */
export type TreeNode = {
  id: string;
  label: string;
  control: ControlConfig;
  rules: {required: boolean};
  children?: TreeNode[];
};

// 日期保存为本地日历日期字符串，避免 Date 经 JSON/UTC 转换后发生跨日偏移。
const valueSchema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  z.array(z.number().finite()),
  z.object({from: z.string().nullable(), to: z.string().nullable()}),
]);
const formSchema = z.object({values: z.record(valueSchema)});
export type FormSchema = z.infer<typeof formSchema>;
export type FieldValue = z.infer<typeof valueSchema>;

export function isDateRange(value: FieldValue): value is {from: string | null; to: string | null} {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getDate() === Number(value.slice(8, 10))
  );
}

/** 校验与 UI 解耦；新增编辑器时在这里补充值的约束，不在 JSX 中散落校验逻辑。 */
export function validateValue(node: TreeNode, value: FieldValue): string | undefined {
  const config = node.control;
  const empty =
    value === null ||
    (typeof value === 'string' && !value.trim()) ||
    (Array.isArray(value) && value.length === 0) ||
    (isDateRange(value) && !value.from && !value.to);
  // false 和 0 都是有效值；“必须勾选同意”应另设业务规则，不能混同于 required。
  if (empty) return node.rules.required ? '请填写或选择一个值' : undefined;
  const invalid = '值的类型与控件不匹配';
  switch (config.type) {
    case 'input':
    case 'password':
    case 'textarea':
      return typeof value === 'string' ? undefined : invalid;
    case 'input-otp':
      return typeof value === 'string' && new RegExp(`^\\d{${config.length}}$`).test(value)
        ? undefined
        : `请输入 ${config.length} 位数字`;
    case 'switch':
    case 'checkbox':
    case 'toggle':
      return typeof value === 'boolean' ? undefined : invalid;
    case 'number':
    case 'slider':
      return typeof value === 'number' && Number.isFinite(value) && value >= config.min && value <= config.max
        ? undefined
        : `请输入 ${config.min} ～ ${config.max} 之间的数字`;
    case 'range-slider':
      return Array.isArray(value) &&
        value.length === 2 &&
        value.every((v) => typeof v === 'number' && v >= config.min && v <= config.max) &&
        value[0]! <= value[1]!
        ? undefined
        : '请选择有效的数值范围';
    case 'select':
    case 'native-select':
    case 'radio-group':
    case 'combobox':
      return typeof value === 'string' && config.options.some((option) => option.value === value)
        ? undefined
        : '请选择有效选项';
    case 'multi-select':
    case 'checkbox-group':
    case 'toggle-group':
      return Array.isArray(value) &&
        value.every((v) => config.options.some((option) => option.value === v)) &&
        new Set<string | number>(value).size === value.length
        ? undefined
        : '请选择有效且不重复的选项';
    case 'date':
      return validDate(value) ? undefined : '请选择有效日期';
    case 'date-range':
      return isDateRange(value) && validDate(value.from) && validDate(value.to) && value.from <= value.to
        ? undefined
        : '请选择完整且起止顺序正确的日期范围';
  }
}

/** 根据当前树校验，错误路径固定为 values.<节点ID>，删除或插入兄弟节点不会挪动错误。 */
export function createTreeFormSchema(nodes: TreeNode[]) {
  return formSchema.superRefine(({values}, ctx) => {
    const visit = (items: TreeNode[]) =>
      items.forEach((node) => {
        const message = validateValue(node, values[node.id] ?? null);
        if (message) ctx.addIssue({code: z.ZodIssueCode.custom, path: ['values', node.id], message});
        if (node.children) visit(node.children);
      });
    visit(nodes);
  });
}
