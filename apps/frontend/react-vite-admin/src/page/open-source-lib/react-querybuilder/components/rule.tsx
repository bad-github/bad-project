import {RuleComponents, RuleComponentsWithSubQuery, type RuleProps, useRule} from 'react-querybuilder';

export default function Rule(props: RuleProps) {
  const rule = useRule(props);
  return (
    <div className="custom-rule border border-green-400 flex items-center gap-4">
      {rule.matchModes.length > 0 ? <RuleComponentsWithSubQuery {...rule} /> : <RuleComponents {...rule} />}
    </div>
  );
}
