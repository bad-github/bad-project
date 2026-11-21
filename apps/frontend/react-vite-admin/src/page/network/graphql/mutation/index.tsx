import {useEffect} from 'react';
import {useMutation} from '@apollo/client/react';
import {CREATE_USER, UPDATE_USER_BY_NAME} from '@/graphql/user.gql';
import {Button} from '@badnpm/ui';

export default function Mutation() {
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
        input: {name: 'karina81', showName: '柳智敏' + Math.random().toString().slice(2, 4)},
      },
    });
  };
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button onClick={createUser}>创建用户</Button>
      <Button onClick={updateUser}>编辑用户</Button>
    </div>
  );
}
