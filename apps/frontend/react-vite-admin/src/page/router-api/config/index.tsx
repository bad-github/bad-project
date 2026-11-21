import {Loading} from '@badnpm/ui';
import {Button, Input} from '@badnpm/ui';
import {Suspense, useState} from 'react';
import {Await, Form, useActionData, useLoaderData} from 'react-router';

export default function RouterConfig() {
  const [error, setError] = useState(false);
  // 提交完成后读取当前路由 action 的返回值；首次进入、尚未提交时为 undefined。
  const actionData = useActionData();
  // 首次进入先执行 loader；这里只读取其返回的对象，p 此时可能仍在等待结果。
  const {p} = useLoaderData();

  if (error) {
    // 点击 error 后在渲染阶段抛错，由路由配置的 RouterErrorBoundary 接管页面。
    throw new Error('render error');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2>Action</h2>
        {/* POST 提交 → RouterAction → 默认重新执行 loader → 更新 actionData 和 loader 数据。 */}
        <Form method="post">
          <Input name="name" className="w-40" placeholder="name" />
          <Button type="submit">submit</Button>
        </Form>
        {actionData && (
          <div className="bg-card p-4">
            <pre>
              <code>{JSON.stringify(actionData, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
      <hr />
      <div>
        <h2>Loader</h2>
        {/* Await 读取 p；首次等待时显示 fallback，约 3 秒后用结果渲染下方内容。
            提交后 loader 会创建新的 p，因此也会再次进入异步等待流程。 */}
        <Suspense fallback={<Loading text="async route" />}>
          <Await resolve={p}>
            {(resolved) => (
              <div className="bg-card p-4">
                <pre>
                  <code>{JSON.stringify(resolved, null, 2)}</code>
                </pre>
              </div>
            )}
          </Await>
        </Suspense>
      </div>
      <hr />
      <div>
        <h2>Error Boundary</h2>
        <Button onClick={() => setError(true)}>error</Button>
      </div>
    </div>
  );
}
