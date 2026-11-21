import type {ReactNode} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@badnpm/ui';

export default function WorkflowPanel({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-start gap-3 border-b">
        <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">
          {step}
        </span>
        <div>
          <CardTitle>
            <h2>{title}</h2>
          </CardTitle>
          <CardDescription className="mt-1 text-xs">{subtitle}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">{children}</CardContent>
    </Card>
  );
}
