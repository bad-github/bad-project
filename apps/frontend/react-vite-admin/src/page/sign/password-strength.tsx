import {cn} from '@badnpm/ui';
import {useMemo} from 'react';

type PasswordStrengthProps = {
  value: string;
};

export function PasswordStrength({value}: PasswordStrengthProps) {
  const score = useMemo(() => {
    let s = 0;
    if (value.length > 8) s++; // 有输入
    if (/[A-Za-z]/.test(value)) s++; // 字母
    if (/\d/.test(value)) s++; // 数字
    if (/[^A-Za-z0-9]/.test(value)) s++; // 特殊符号
    return s;
  }, [value]);

  function getStrengthColor(index: number, score: number) {
    if (index > score) return 'bg-accent'; // 未激活
    switch (score) {
      case 1:
        return 'bg-red-400';
      case 2:
        // 2条规则
        return 'bg-red-300';
      case 3:
        return 'bg-orange-400';
      case 4:
        return 'bg-green-400';
      default:
        return '';
    }
  }

  return (
    <div className="mt-1 flex gap-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={cn('h-1 flex-1 rounded-md', getStrengthColor(i, score))} />
      ))}
    </div>
  );
}
