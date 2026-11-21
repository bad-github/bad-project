import {Loading} from '@badnpm/ui';
import {Suspense, useEffect} from 'react';
import {Outlet} from 'react-router';
import AuthIntercept from '../../auth-intercept';
import {ReactErrorBoundary} from '@/error/components/react-error-boundary';

export default function BaseRoute() {
  useEffect(() => {
    console.log('base route', '必须保证effect只有输出一次');
  }, []);

  if (import.meta.env.VITE_NEED_LOGIN === 'true') return <AuthIntercept />;

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loading type="page" text="BaseRoute Loading..." />
        </div>
      }
    >
      {/* 由于react router默认有路由错误处理，所以需要包裹在路由层级下 */}
      <ReactErrorBoundary>
        <Outlet />
      </ReactErrorBoundary>
    </Suspense>
  );
}
