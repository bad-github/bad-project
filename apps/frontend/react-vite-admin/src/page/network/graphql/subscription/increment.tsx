import {
  CREATE_USER,
  GET_ALL_USERS,
  SUB_CREATE_USER,
  SUB_UPDATE_USER,
  UPDATE_USER_BY_NAME,
  type User,
} from '@/graphql/user.gql';
import {useMutation, useQuery} from '@apollo/client/react';
import {Button} from '@badnpm/ui';
import {useEffect} from 'react';

export default function Increment() {
  // 获取所有用户
  const {subscribeToMore: _subUsers, data: data1, error: error1} = useQuery(GET_ALL_USERS);

  useEffect(() => {
    if (error1) {
      console.error(error1);
    }
    if (!data1) return;
    const unSubUpdated = _subUsers({
      document: SUB_UPDATE_USER, // 要执行的订阅
      variables: {extra: '自定义参数值'}, // 可以传变量，注意这儿加了参数gql也要跟着变，后端也需要兼容获取该参数
      // 告诉 Apollo 客户端如何将查询的当前缓存结果（prev）GraphQL 服务器推送的 subscriptionData 相结合。此函数的返回值将完全替换查询的当前缓存结果
      updateQuery: (prev: any, {subscriptionData}) => {
        // 编辑时pre也是最新的，这是graphql内部处理的吗？注意pre是只读结构不应改变
        if (!subscriptionData.data) return prev;
        const newUser = subscriptionData.data.userUpdated;
        const allUser = prev.allUser ?? [];
        // 不管如何手动更改newUser的属性，都不会有效。
        const updatedUsers = allUser.map((user: User) => (user.id === newUser.id ? newUser : user));
        return Object.assign({}, prev, {allUser: updatedUsers});
      },
    });
    const unSubCreated = _subUsers({
      document: SUB_CREATE_USER,
      // todo, prev类型
      updateQuery: (prev: any, {subscriptionData}) => {
        // 创建时pre就只有旧的数据了，subscriptionData保存了当前创建成功的数据
        console.log(prev, subscriptionData);
        if (!subscriptionData.data) return prev;
        return Object.assign({}, prev, {allUser: [...(prev.allUser ?? []), subscriptionData.data.userCreated]});
      },
    });
    return () => {
      unSubUpdated();
      unSubCreated();
    };
  }, [error1, data1, _subUsers]);

  console.log('subscription', data1);

  // 添加用户
  const [_createUser, {data: data2, error: error2}] = useMutation(CREATE_USER);
  useEffect(() => {
    if (error2) {
      console.error(error2);
    }
    console.log(data2);
  }, [error2, data2]);

  // 编辑用户
  const [_updateUser, {data: data3, error: error3}] = useMutation(UPDATE_USER_BY_NAME);
  useEffect(() => {
    if (error3) {
      console.error(error3);
    }
    console.log(data3);
  }, [error3, data3]);
  const createUser = () => {
    _createUser({
      variables: {
        input: {name: 'karina81', password: '123abc', showName: '柳智敏'},
      },
    });
  };

  const updateUser = () => {
    _updateUser({
      variables: {
        input: {name: 'karina6', showName: '柳智敏'},
      },
    });
  };
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button onClick={createUser}>创建用户[触发创建用户的推送]</Button>
      <Button onClick={updateUser}>编辑用户[触发更新用户的推送]</Button>
    </div>
  );
}
