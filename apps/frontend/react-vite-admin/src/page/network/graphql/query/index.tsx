import {GET_HELLO} from '@/graphql/common.gql';
import {GET_LIST_USERS} from '@/graphql/user.gql';
import {useLazyQuery, useQuery} from '@apollo/client/react';
import {Button} from '@badnpm/ui';
import {useEffect} from 'react';

export default function Query() {
  const {data: data1, error: error1} = useQuery(GET_HELLO);
  useEffect(() => {
    if (error1) {
      console.error(error1);
    }
    console.log(data1);
  }, [error1, data1]);

  const [_getListUserNoCache, {data: data2, error: error2}] = useLazyQuery(GET_LIST_USERS, {
    // 每次点击都会重新发起graphql请求
    fetchPolicy: 'network-only',
  });
  useEffect(() => {
    if (error2) {
      console.error(error2);
    }
    console.log(data2);
  }, [error2, data2]);

  const [_getListUser, {data: data3, error: error3}] = useLazyQuery(GET_LIST_USERS, {
    // 每次点击都会重新发起graphql请求
  });
  useEffect(() => {
    if (error3) {
      console.error(error3);
    }
    console.log(data3);
  }, [error3, data3]);

  const getListUserNoCache = () => {
    _getListUserNoCache({variables: {input: {pageNum: 1, pageSize: 10}}});
  };

  const getListUser = () => {
    _getListUser({variables: {input: {pageNum: 1, pageSize: 10}}});
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button onClick={getListUserNoCache}>手动触发【无缓存】</Button>
      <Button onClick={getListUser}>手动触发【有缓存】</Button>
    </div>
  );
}
