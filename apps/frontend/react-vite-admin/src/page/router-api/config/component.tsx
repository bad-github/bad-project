import {Button} from '@badnpm/ui';
import {
  useNavigate,
  useRouteError,
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
} from 'react-router';

/**
 * 如果把这些全部放到一个config/index组件里面，那么不会chunk
 */

export const RouterAction: ActionFunction = async ({request, params: _, context: __}: ActionFunctionArgs) => {
  // Form 的 POST 请求进入这里，按输入框的 name 属性读取提交值。
  const data = await request.formData();
  // 返回值由 useActionData() 读取；成功后 React Router 默认重新校验 loader 数据。
  return {ok: true, data: {name: data.get('name')}};
};

// params是动态路由
export const RouterLoader: LoaderFunction = async ({request, params: _, context: __}: ActionFunctionArgs) => {
  // 首次进入，以及提交 action 后的默认重新校验，都会执行这里。
  const url = new URL(request.url);
  // query参数
  const id = url.searchParams.get('id');

  const p = new Promise((resolve) => {
    setTimeout(() => {
      resolve({name: 'caixukun', id});
    }, 3000);
  });
  // 返回 {p}，让路由拿到对象后即可渲染组件，嵌套的 p 交给 Suspense + Await 等待。
  // 若直接返回 p，路由会先等待它完成，再把结果交给组件。
  return {p};
};

/**
 * 捕获以下错误
 * (1)loader
 * (2)action
 * (3)组件渲染
 */
export function RouterErrorBoundary() {
  const navigate = useNavigate();

  const error: any = useRouteError();
  return (
    <div>
      <div className="text-red-500">{error.message}</div>
      <Button onClick={() => navigate(-1)}>Back to previous page</Button>
    </div>
  );
}

/* 
在jsx组件里面写
const submit = useSubmit();
const handleClick = async () => {
  submit({name: 'caixukun'}, {method: 'post', encType: 'application/json'});
}; 
*/
/* export const RouterActionJson: ActionFunction = async ({request, params: _, context: __}: ActionFunctionArgs) => {
  const data = await request.json();
  return {ok: true, data};
}; */
