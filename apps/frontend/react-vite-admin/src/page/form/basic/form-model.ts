import type {RegisterOptions} from 'react-hook-form';

/**
 * 约定每个控件在 RHF 中保存的值类型，避免 UI 组件的数据格式泄漏到提交数据。
 * 空文本用 ''，未选单值用 null，多选用 []；年龄留空用 null，不能误转成 0。
 * false 是开关的正常值。是否必须为 true（如同意条款）应由单独规则约束。
 */
export type RegistrationValues = {
  name: string;
  age: number | null;
  email: string;
  password: string;
  region: string;
  introduction: string;
  course: string | null;
  organization: string | null;
  attendance: string;
  date: string | null;
  period: string[];
  hours: number;
  topics: string[];
  waitlist: boolean;
  notify: boolean;
  verificationCode: string;
  agreement: boolean;
};

export const regions = ['上海', '北京', '杭州', '成都', '其他'];
export const courses = [
  {label: '入门班 · 从基础开始', value: 'beginner'},
  {label: '进阶班 · 项目实战', value: 'advanced'},
];
export const organizations = ['浙江大学', '同济大学', '独立开发者', '自由职业者'];
export const topics = ['React', 'TypeScript', '工程化', 'UI 设计'];

/** 每次返回独立对象和数组，防止示例回填、快照或其他表单实例共用可变引用。 */
export function createDefaultValues(): RegistrationValues {
  return {
    name: '',
    age: null,
    email: '',
    password: '',
    region: '',
    introduction: '',
    course: null,
    organization: null,
    attendance: '',
    date: null,
    period: [],
    hours: 8,
    topics: [],
    waitlist: false,
    notify: true,
    verificationCode: '',
    agreement: false,
  };
}

/** 保存本地日历日期，不经过 UTC 序列化。 */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDate(value: string | null): Date | undefined {
  // 日历组件接收 Date，表单保存日期字符串；按本地中午构造，避免 UTC 转换导致跨日。
  return value ? new Date(`${value}T12:00:00`) : undefined;
}

function isValidDate(value: string | null): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseDate(value)!;
  // Date 会把 2 月 30 日滚动到 3 月，往返比较可拦住这种“能解析但不是合法日期”的输入。
  return Number.isFinite(date.getTime()) && formatDate(date) === value;
}

export function parseAge(value: unknown): number | null {
  // setValueAs 在输入值进入 RHF 时转换；不能用 Number('')，因为其结果是 0。
  // 该转换不负责转换 defaultValues，所以默认年龄也直接定义为 null。
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * 基础页使用 RHF 内置规则，不配置 resolver。
 * register(name, rules) 与 Controller.rules 都可消费此规则集；不要给同一字段重复注册两次。
 * validate 返回 true 表示通过，字符串表示失败消息；这里不是抛异常式的校验。
 * satisfies 按字段名检查参数类型，但不会改变规则对象的运行时结构。
 */
export const rules = {
  name: {
    required: '请填写姓名',
    maxLength: {value: 30, message: '姓名最多 30 个字符'},
    validate: (value) => Boolean(value.trim()) || '姓名不能只包含空格',
  },
  age: {
    setValueAs: parseAge,
    validate: (value) =>
      (value !== null && Number.isInteger(value) && value >= 16 && value <= 80) || '请输入 16–80 之间的整数',
  },
  email: {
    required: '请填写联系邮箱',
    pattern: {value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入有效的邮箱地址'},
  },
  password: {
    required: '请填写账号密码',
    minLength: {value: 8, message: '密码至少 8 位'},
    maxLength: {value: 64, message: '密码最多 64 位'},
  },
  region: {validate: (value) => regions.includes(value) || '请选择所在地区'},
  introduction: {maxLength: {value: 200, message: '自我介绍最多 200 个字符'}},
  course: {validate: (value) => courses.some((course) => course.value === value) || '请选择报名班次'},
  organization: {
    validate: (value) => value === null || organizations.includes(value) || '请选择列表中的学校或公司',
  },
  attendance: {validate: (value) => ['online', 'offline'].includes(value) || '请选择参与方式'},
  date: {validate: (value) => isValidDate(value) || '请选择有效的参加日期'},
  period: {
    validate: (value) => {
      // 日历允许暂时只选开始日期，提交时必须两端完整。
      // 两端经过严格日期检查后，固定宽度 YYYY-MM-DD 才能直接按字符串比较先后。
      if (value.length !== 2 || !value.every(isValidDate)) return '请选择完整的学习起止日期';
      return value[0] < value[1] || '结束日期需晚于开始日期';
    },
  },
  hours: {
    validate: (value) => (Number.isInteger(value) && value >= 1 && value <= 30) || '每周学习投入应为 1–30 小时',
  },
  topics: {
    validate: (value) =>
      (value.every((topic) => topics.includes(topic)) && new Set(value).size === value.length) ||
      '请选择有效的学习方向',
  },
  verificationCode: {
    required: '请填写邮箱验证码',
    pattern: {value: /^\d{6}$/, message: '验证码为 6 位数字'},
    validate: (value) => value === '123456' || '验证码不正确，请输入 123456',
  },
  // 普通布尔字段可为 false；只有这个业务字段明确要求用户同意。
  agreement: {validate: (value) => value || '请先同意报名条款'},
} satisfies {[Name in keyof RegistrationValues]?: RegisterOptions<RegistrationValues, Name>};

export function createExampleValues(): RegistrationValues {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  return {
    ...createDefaultValues(),
    name: '林同学',
    age: 24,
    email: 'lin@example.com',
    password: 'Demo2026',
    region: '上海',
    introduction: '希望系统学习 React 表单和组件设计。',
    course: 'beginner',
    organization: '独立开发者',
    attendance: 'online',
    date: formatDate(start),
    period: [formatDate(start), formatDate(end)],
    topics: ['React', 'TypeScript'],
    verificationCode: '123456',
    agreement: true,
  };
}

/**
 * 观察、快照和提交结果都脱敏；不写入日志、存储或远端接口。
 * 数组也复制，避免后续编辑改变已经读取的快照；本例其余字段都是基本类型。
 */
export function previewValues(values: RegistrationValues): RegistrationValues {
  return {
    ...values,
    topics: [...values.topics],
    period: [...values.period],
    password: values.password ? `已填写（${values.password.length} 位）` : '',
    verificationCode: values.verificationCode ? `已填写（${values.verificationCode.length} 位）` : '',
  };
}
