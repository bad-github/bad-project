import {Button} from '@badnpm/ui';
import type {FallbackProps} from 'react-error-boundary';

export function ErrorFallback({error, resetErrorBoundary}: FallbackProps) {
  return (
    <div className="bg-card p-6">
      <h2>页面发生错误</h2>
      <pre>{(error as Error).message}</pre>
      <pre className="whitespace-pre-wrap">{(error as Error).stack}</pre>
      <br />
      <Button onClick={() => resetErrorBoundary()}>重试</Button>
      <Button onClick={() => window.location.reload()}>刷新页面</Button>
    </div>
  );
}
