import type {TOperator} from './types';

export const operatorMap: Record<string, TOperator> = {
  '=': {
    label: '等于',
    name: '=',
    value: '=',
  },
  '!=': {
    label: '不等于',
    name: '!=',
    value: '!=',
  },
  '<': {
    label: '小于',
    name: '<',
    value: '<',
  },
  '>': {
    label: '大于',
    name: '>',
    value: '>',
  },
  '<=': {
    label: '小于等于',
    name: '<=',
    value: '<=',
  },
  '>=': {
    label: '大于等于',
    name: '>=',
    value: '>=',
  },
  contains: {
    label: '包含',
    name: 'contains',
    value: 'contains',
  },
  beginsWith: {
    label: '开始于',
    name: 'beginsWith',
    value: 'beginsWith',
  },
  endsWith: {
    label: '结束于',
    name: 'endsWith',
    value: 'endsWith',
  },
  doesNotContain: {
    label: '不包含',
    name: 'doesNotContain',
    value: 'doesNotContain',
  },
  doesNotBeginWith: {
    label: '不开始于',
    name: 'doesNotBeginWith',
    value: 'doesNotBeginWith',
  },
  doesNotEndWith: {
    label: '不结束于',
    name: 'doesNotEndWith',
    value: 'doesNotEndWith',
  },
  null: {
    label: '为空',
    name: 'null',
    value: 'null',
  },
  notNull: {
    label: '不为空',
    name: 'notNull',
    value: 'notNull',
  },
  in: {
    label: '在...中',
    name: 'in',
    value: 'in',
  },
  notIn: {
    label: '不在...中',
    name: 'notIn',
    value: 'notIn',
  },
  between: {
    label: '在...之间',
    name: 'between',
    value: 'between',
  },
  notBetween: {
    label: '不在...之间',
    name: 'notBetween',
    value: 'notBetween',
  },
  // 自定义的操作符尚不能实现保存为数组
  /* customOperator: {
    label: '自定义操作符',
    name: 'customOperator',
    value: 'customOperator',
    arity: 'multiple'
  } */
};

export const customOperators: TOperator[] = Object.values(operatorMap).map((op) => ({
  label: operatorMap[op.name]?.label || op.label,
  name: op.name,
  value: op.value,
}));
