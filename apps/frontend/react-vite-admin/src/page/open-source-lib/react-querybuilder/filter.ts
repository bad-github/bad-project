/**
 * 预先根据rules得到过滤的函数
 */
type FilterRule = {
  field: string;
  operator: string;
  value: any;
  [key: string]: any;
};

type FilterGroup = {
  combinator: 'and' | 'or';
  rules: (FilterRule | FilterGroup)[];
};

// 取值函数类型
type ValueGetter = (row: any) => any;
type OpFn = (actualValue: any, ruleValue: any) => boolean;

const isEmpty = (val: any): boolean => {
  // null、undefined，-
  if (val === null || val === undefined || val === '-') return true;

  // 字符串和数组
  if (typeof val === 'string' || Array.isArray(val)) {
    return val.length === 0;
  }

  // Set 和 Map
  if (val instanceof Set || val instanceof Map) {
    return val.size === 0;
  }

  // 处理纯对象
  if (typeof val === 'object') {
    // 排除 Date, RegExp 等特殊对象
    if (Object.prototype.toString.call(val) !== '[object Object]') return false;
    // 只有在是纯对象时才检查 keys
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) return false;
    }
    return true;
  }
  return false;
};

const toNumberIfPossible = (val: unknown): number | unknown => {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return val;
  }
  if (typeof val === 'string') {
    const n = Number(val);
    return Number.isFinite(n) ? n : val;
  }
  return val;
};

// 操作符号执行引擎，a是传递行数据的某个字段，b作为选择规则的条件值。能提前转最好，就不用遍历
const baseOperators: Record<string, (a: any, b: any) => boolean> = {
  '=': (a, b) => {
    if (typeof a === 'string' && typeof b === 'string') {
      return a.toLowerCase() === b;
    }
    // 兼容数字和字符串比较
    return a == b;
  },
  '!=': (a, b) => {
    if (typeof a === 'string' && typeof b === 'string') {
      return a.toLowerCase() !== b;
    }
    return a != b;
  },
  '<': (a, b) => {
    a = toNumberIfPossible(a);
    b = toNumberIfPossible(b);
    return a < b;
  },
  '>': (a, b) => {
    a = toNumberIfPossible(a);
    b = toNumberIfPossible(b);
    return a > b;
  },
  '<=': (a, b) => {
    a = toNumberIfPossible(a);
    b = toNumberIfPossible(b);
    return a <= b;
  },
  '>=': (a, b) => {
    a = toNumberIfPossible(a);
    b = toNumberIfPossible(b);
    return a >= b;
  },
  contains: (a, b) => a?.toString()?.toLowerCase()?.includes(b), // 可以匹配数字
  doesNotContain: (a, b) => !a?.toString()?.toLowerCase().includes(b),
  null: (a) => a === null || a === undefined || a === '',
  notNull: (a) => a !== null && a !== undefined && a !== '',
  in: (a, b) => Array.isArray(b) && b.includes(a),
  notIn: (a, b) => Array.isArray(b) || !b.includes(a),
  beginsWith: (a, b) => a?.toString()?.toLowerCase()?.startsWith(b),
  endsWith: (a, b) => a?.toString()?.toLowerCase()?.endsWith(b),
  doesNotBeginWith: (a, b) => !a?.toString()?.toLowerCase()?.startsWith(b),
  doesNotEndWith: (a, b) => !a?.toString()?.toLowerCase().endsWith(b),
  between: (a, b) => a >= b[0] && a <= b[1],
  notBetween: (a, b) => a < b[0] || a > b[1],
};

/**
 * 根据操作符和比较值返回一个比较函数和优化后的值（根据比较函数的不同）
 * @param operator
 * @param ruleValue
 * @returns
 */
const getOperatorExecutor = (operator: string, ruleValue: any): [OpFn, any] => {
  // 针对in和notIn进行预处理
  let fn: OpFn = baseOperators[operator];
  let finalValue = ruleValue;
  if (['in', 'notIn'].includes(operator) && Array.isArray(ruleValue)) {
    finalValue = new Set(ruleValue);
    fn = operator === 'in' ? (a, s) => s.has(a) : (a, s) => !s.has(a);
  } else if (
    ['=', '!=', 'contains', 'doesNotContain', 'beginsWith', 'endsWith', 'doesNotBeginWith', 'doesNotEndWith'].includes(
      operator
    ) &&
    typeof ruleValue === 'string'
  ) {
    finalValue = ruleValue.toLocaleLowerCase();
  } else if (operator === 'regex') {
    // 正则扩展
    try {
      finalValue = new RegExp(ruleValue, 'i'); // 'i' 保持忽略大小写的一致性
      fn = (a, r) => r.test(a?.toString() ?? '');
    } catch (_) {
      // 如果正则非法，返回一个永远不匹配的逻辑，防止程序崩溃
      finalValue = /$.^/;
      fn = () => false;
    }
  }
  // 默认返回基础操作符和原始值
  return [fn, finalValue];
};

// 嵌套表格字段的取值的分隔符，在定义列时需要按照指定规律，比如{ id: `someIPEntity${filterPathSeparator}service_id`, accessorFn: row => row.someIPEntity?.service_id}
export const filterPathSeparator = '_f_p_s_';

/**
 *
 * @param query 规则集
 * @param customFieldMap 数据集合的取值逻辑
 * @returns
 */
export const compileFilter = (
  query: FilterGroup | FilterRule,
  customFieldMap: Record<string, ValueGetter> = {}
): ((v: any) => boolean) => {
  // 处理规则组
  if ('rules' in query) {
    const compiledRules = (query.rules as (FilterRule | FilterGroup)[]).map((fn) => compileFilter(fn, customFieldMap));
    const isOr = query.combinator === 'or';
    if (isOr) {
      return (v: any) => {
        for (let i = 0; i < compiledRules.length; i++) {
          if (compiledRules[i](v)) return true;
        }
        return false;
      };
    } else {
      return (v: any) => {
        for (let i = 0; i < compiledRules.length; i++) {
          if (!compiledRules[i](v)) return false;
        }
        return true;
      };
    }
  }
  // 处理单条规则
  const {field, operator, value} = query as FilterRule;
  const isNoValueOperator = ['null', 'notNull'].includes(operator);
  if (isEmpty(value) && !isNoValueOperator) {
    // 短路返回 true，即不对该规则进行过滤
    return () => true;
  }
  // 通过工厂函数获取执行函数和最终的比较值
  const [opFn, finalValue] = getOperatorExecutor(operator, value);
  // 优先从映射表获取取值器，是否有特定的取值逻辑
  const getter: ValueGetter = customFieldMap[field];
  // 真正调用比较函数opFn的地方
  if (getter) {
    return (v: any) => {
      const val = getter(v);
      // v是数据集合的行，val是取出来的值，finalValue是选择规则的条件值
      return opFn ? opFn(val, finalValue) : true;
    };
  } else {
    // 根据定义的属性值路径取值
    const path = field.split(filterPathSeparator);
    return (v: any) => {
      let val = v;
      for (let i = 0; i < path.length; i++) {
        val = val?.[path[i]];
        if (val === undefined || val === null) break;
      }
      return opFn ? opFn(val, finalValue) : true;
    };
  }
};

const getColumnAttr = (config?: Record<string, any>) => {
  return {
    selectName: {
      accessorFn: (row: any) => row.selectName,
    },
    customComponent: {
      accessorFn: (row: any) => {
        console.log('getColumnAttr config', config);
        // get result by config
        return row.customComponent;
      },
    },
  };
};

/**
 * 以表格过滤举例
 * key：即是列的唯一标识，也对应rules中的field字段，value就是获取对比值的getter函数。
 */
// @ts-expect-error todo
const _customFieldMap: Record<string, (row: any) => any> = {
  textName: (row) => row.textName, // 若表格的行数据是{textName: 'value'}，等价则可省略
  numberName_f_p_s_nestedValue: (row) => row.numberName?.nestedValue, // 若表格的行数据是{numberName: {nestedValue: 'value'}}，等价则可省略
  // 可以写自定义的取值逻辑，但要和列的显示逻辑保持一致。建议在一个地方定义，列和过滤都引用
  selectName: getColumnAttr().selectName.accessorFn,
  customComponent: (row) => {
    // 若要传递额外的动态参数，需要使用函数写法，以保证闭包中的config是最新的
    const config = {key: 'value'};
    return getColumnAttr(config).customComponent.accessorFn(row);
  },
};
