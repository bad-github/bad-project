import {Outlet} from 'react-router';
import {clearToken, generateAdminToken, generateKarinaToken} from '@/request/common';
import {Button} from '@badnpm/ui';

export default function NetWork() {
  const setAdminToken = async () => {
    const result = await generateAdminToken();
    console.log(result);
  };

  const setKarinaToken = async () => {
    const result = await generateKarinaToken();
    console.log(result);
  };

  const removeToken = async () => {
    const result = await clearToken();
    console.log(result);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={setAdminToken}>set admin token</Button>
        <Button onClick={setKarinaToken}>set karina token</Button>
        <Button onClick={removeToken}>clear token</Button>
      </div>
      <Outlet />
    </div>
  );
}
