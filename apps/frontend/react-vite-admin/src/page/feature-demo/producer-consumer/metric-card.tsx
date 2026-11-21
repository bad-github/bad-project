import type {ReactNode} from 'react';
import {Card, CardContent, CardDescription, CardHeader} from '@badnpm/ui';

export default function MetricCard({
  label,
  value,
  icon,
  className = '',
}: {
  label: string;
  value: number;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader className="text-muted-foreground flex flex-row items-center justify-between">
        <CardDescription>{label}</CardDescription>
        {icon}
      </CardHeader>
      <CardContent className={`text-3xl font-semibold tabular-nums ${className}`}>
        {value}
        <span className="text-muted-foreground ml-1 text-xs font-normal">单</span>
      </CardContent>
    </Card>
  );
}
