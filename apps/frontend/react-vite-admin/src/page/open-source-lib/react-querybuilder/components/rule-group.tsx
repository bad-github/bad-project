import {
  RuleGroupBodyComponents,
  RuleGroupHeaderComponents,
  type RuleGroupProps,
  useRuleGroup,
} from 'react-querybuilder';
import {Plus} from 'lucide-react';
import {Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@badnpm/ui';

export const RuleGroupHeader = (props: RuleGroupProps) => {
  const {ruleGroup, schema} = props;
  const group = useRuleGroup(props);
  return (
    <div>
      <Select
        items={schema.combinators.map((v: any) => ({value: v.name, label: v.label}))}
        value={ruleGroup.combinator}
        onValueChange={(value) => {
          if (value !== null) group.onCombinatorChange(value);
        }}
      >
        <SelectTrigger size="sm" className="w-20">
          <SelectValue placeholder="Combinator" />
        </SelectTrigger>
        <SelectContent>
          {schema.combinators.map((v: any) => (
            <SelectItem key={v.name} value={v.name}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={group.addRule}>
        Rule
        <Plus />
      </Button>
      <Button size="sm" onClick={group.addGroup}>
        Group
        <Plus />
      </Button>
    </div>
  );
};

export default function RuleGroup(props: RuleGroupProps) {
  const {ruleGroup, path: _} = props;
  const group = useRuleGroup(props);
  return (
    <div className="custom-group flex flex-col gap-4 border border-red-400 p-2">
      <div className="custom-group-header flex items-center gap-2 border border-yellow-400">
        {/* {path.length} */}
        {/* 默认的渲染器，可以通过自定义combinatorSelector实现，也可以使用RuleGroupHeader直接替换 */}
        <RuleGroupHeaderComponents {...group} />
        {/* <RuleGroupHeader {...props} /> */}
      </div>
      {ruleGroup.rules.length > 0 ? (
        <div className="custom-group-body flex flex-col gap-4 border border-blue-400 p-2">
          <RuleGroupBodyComponents {...group} />
        </div>
      ) : null}
    </div>
  );
}
