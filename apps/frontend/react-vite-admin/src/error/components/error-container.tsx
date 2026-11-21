import {useEffect, useState} from 'react';
import type {NormalizedError} from '@/error/types';
import {errorManager} from '../error-manager';
import {getErrorLevel} from '../tool';
import {initGlobalErrorListeners} from '../listeners';
import {HoverCard, HoverCardContent, HoverCardTrigger} from '@badnpm/ui';

export default function ErrorContainer() {
  const [error, setError] = useState<NormalizedError | null>(null);

  useEffect(() => {
    initGlobalErrorListeners();
    return errorManager.subscribe(setError);
  }, []);

  if (!error) return null;

  const level = getErrorLevel(error);

  if (level === 'ignore') return null;

  if (level === 'reload') {
    alert('页面异常，请刷新');
    // window.location.reload();
    return null;
  }

  const renderContent = () => {
    switch (level) {
      case 'recoverable':
        return <div>操作失败：{error.message}</div>;
      case 'fatal':
      default:
        return (
          <div style={{padding: 12}}>
            <h1>系统异常</h1>
            <pre className="whitespace-pre-wrap">{error.message}</pre>
          </div>
        );
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger
        render={<span />}
        className="fixed right-4 bottom-4 flex size-12 cursor-pointer items-center justify-center rounded-full bg-red-600 p-2"
      >
        error
      </HoverCardTrigger>
      <HoverCardContent align="end">{renderContent()}</HoverCardContent>
    </HoverCard>
  );
}
