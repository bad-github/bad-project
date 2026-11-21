import {testDelay, testGet, testHttpErr, testPost, testRedirect, testServerErr} from '@/request/common';
import {getPageUsers, getUsers} from '@/request/user';
import {Button} from '@badnpm/ui';

export default function Http() {
  const handleGet = async () => {
    const result = await testGet();
    console.log(result);
  };

  const handleGetHttpErr = async () => {
    try {
      const result = await testHttpErr();
      console.log(result);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGetSelfErr = async () => {
    try {
      const result = await testServerErr();
      console.log(result);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePost = async () => {
    try {
      const result = await testPost();
      console.log(result);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelay = async () => {
    try {
      const result = await testDelay();
      console.log(result);
    } catch (err) {
      console.log(err);
    }
  };

  const handleRedirect = async () => {
    try {
      const result = await testRedirect();
      console.log(result);
    } catch (err) {
      console.log(err);
    }
  };

  const handleGetUsers = async () => {
    const result = await getUsers();
    console.log(result);
  };

  const handleGetUsersPage = async () => {
    const result = await getPageUsers({page: 1, pageSize: 10});
    console.log(result);
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button onClick={handleGet}>GET</Button>
      <Button onClick={handleGetHttpErr}>GET失败（网络错误）</Button>
      <Button onClick={handleGetSelfErr}>GET失败（业务错误）</Button>
      <Button onClick={handlePost}>POST</Button>
      <Button onClick={handleDelay}>Delay</Button>
      <Button onClick={handleRedirect}>Redirect</Button>
      <Button onClick={handleGetUsers}>所有用户（无需鉴权）</Button>
      <Button onClick={handleGetUsersPage}>分页用户（需要鉴权）</Button>
    </div>
  );
}
