import {useEffect} from 'react';
import {CREATE_USER, SUB_USERS, UPDATE_USER_BY_NAME} from '@/graphql/user.gql';
import {useMutation, useSubscription} from '@apollo/client/react';
import {Button} from '@badnpm/ui';

export default function Full() {
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

  // 订阅用户
  const {data: data4, error: error4} = useSubscription(SUB_USERS, {skip: false});
  useEffect(() => {
    if (error4) {
      console.error(error4);
    }
    console.log('graphql subscription', data4);
  }, [error4, data4]);

  const createUser = () => {
    _createUser({
      variables: {
        input: {name: 'karina2', password: '123abc', showName: '柳智敏'},
      },
    });
  };

  const updateUser = () => {
    _updateUser({
      variables: {
        input: {name: 'karina2', showName: '柳智敏' + Math.random().toString().slice(2, 4)},
      },
    });
  };
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button onClick={createUser}>创建用户[触发获取所有用户]</Button>
      <Button onClick={updateUser}>编辑用户[触发获取所有用户]</Button>
    </div>
  );
}
