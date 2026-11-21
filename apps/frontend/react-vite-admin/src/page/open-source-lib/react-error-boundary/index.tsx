import {ReactErrorBoundary} from '@/error/components/react-error-boundary';
import {QueryErrorResetBoundary, useQuery} from '@tanstack/react-query';
import {Button} from '@badnpm/ui';
import {useErrorBoundary} from 'react-error-boundary';

const fetchUser = async () => {
  console.log('fetch user');
  await new Promise((r) => setTimeout(r, 500));
  throw new Error('useQuery API failed');
};

const User = () => {
  const {data, isError, error} = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    retry: false,
  });

  if (isError) {
    throw error;
  }

  return <div>{data}</div>;
};

export default function ReactErrorBoundaryPage() {
  const {showBoundary} = useErrorBoundary();
  const handleAPIError = () => {
    try {
      throw new Error('API Error');
    } catch (err) {
      showBoundary(err);
    }
  };
  const handlePromiseError = async () => {
    try {
      await Promise.reject(new Error('Promise Error'));
    } catch (err) {
      showBoundary(err);
    }
  };

  const handleOnError = () => {
    setTimeout(() => {
      throw new Error('setTimeout error');
    }, 0);
  };

  const handleReject = () => {
    Promise.reject(new Error('unhandled rejection'));
  };

  return (
    <div>
      <Button onClick={handleAPIError}>API Error</Button>
      <Button onClick={handlePromiseError}>Promise Error</Button>
      <Button onClick={handleOnError}>window onerror</Button>
      <Button onClick={handleReject}>unhandled rejection</Button>
      <QueryErrorResetBoundary>
        {({reset}) => (
          <ReactErrorBoundary onReset={reset}>
            {/* query请求错误的示例 */}
            <User />
          </ReactErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </div>
  );
}
