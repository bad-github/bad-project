import 'react-querybuilder/dist/query-builder.css';
import {useState} from 'react';
import type {FullField, RuleGroupType, RuleType} from 'react-querybuilder';
import {defaultValidator, QueryBuilder} from 'react-querybuilder';
import {customOperators} from './tool';
import RuleGroup from './components/rule-group';
import Rule from './components/rule';
import FieldSelector from './components/selector/field-selector';
import OperatorSelector from './components/selector/operator-selector';
import CombinatorSelector from './components/selector/combinator-selector';
import AddGroup from './components/action/add-group';
import AddRule from './components/action/add-rule';
import CustomValueEditor from './components/editor/custom-value-editor';
import {initFields} from './fields';
import RemoveGroup from './components/action/remove-group';
import RemoveRule from './components/action/remove-rule';

const initialQuery: RuleGroupType = {
  combinator: 'and',
  rules: [
    {
      field: 'textName',
      operator: '=',
      value: '',
    },
  ],
};

export default function QueryBuilderPage() {
  const [query, setQuery] = useState(initialQuery);
  const [fields, _setFields] = useState<FullField[]>(initFields);

  const handleRuleAdd = (rule: RuleType, _parentPath: number[], _query: RuleGroupType) => {
    // 找出所有尚未在当前查询中使用的字段
    // 注意：这里假设你在单层结构中查找，如果是深层嵌套，逻辑可能需要递归
    const usedFieldNames = query.rules.map((r: any) => r.field);
    const remainRules = fields.filter((f) => !usedFieldNames.includes(f.name));

    if (remainRules.length > 0) {
      return {
        ...rule,
        field: remainRules[0].name, // 将 RuleType 的 field 设为下一个可用字段名
      };
    }

    // 返回 true 则按默认逻辑（选 fields[0]）添加
    // 返回 false 则阻止添加新规则
    return true;
  };

  console.log('query', query);

  return (
    <QueryBuilder
      fields={fields}
      operators={customOperators}
      resetOnFieldChange
      resetOnOperatorChange
      suppressStandardClassnames
      listsAsArrays // 会保留value的数组格式，否则会内部转字符串(不配置好像也行)
      controlClassnames={{
        // queryBuilder: 'queryBuilder-branches'
        ruleGroup: 'rule-group-class', // 若没有自定义ruleGroup，则生效
        rule: 'rule-class',
      }}
      onAddRule={handleRuleAdd}
      validator={defaultValidator}
      query={query}
      onQueryChange={setQuery}
      controlElements={{
        removeRuleAction: RemoveRule,
        removeGroupAction: RemoveGroup,
        // cloneRuleAction
        // cloneGroupAction
        addRuleAction: AddRule,
        addGroupAction: AddGroup,
        ruleGroup: RuleGroup,
        rule: Rule,
        fieldSelector: FieldSelector,
        combinatorSelector: CombinatorSelector,
        operatorSelector: OperatorSelector,
        valueEditor: CustomValueEditor,
      }}
    />
  );
}
