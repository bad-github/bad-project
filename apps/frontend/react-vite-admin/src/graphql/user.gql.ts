import {gql, type TypedDocumentNode} from '@apollo/client';

export interface User {
  __typename: 'User';
  id: number;
  name: string;
  showName: string;
  email: string;
}

export interface ListUserVars {
  input: {
    pageNum: number;
    pageSize: number;
    query?: {
      showName?: string;
    };
  };
}

export interface CreateUserVars {
  input: {
    name: string;
    password: string;
    showName?: string | null;
    email?: string | null;
  };
}

export interface UpdateUserVars {
  input: {
    name: string;
    showName?: string | null;
    email?: string | null;
  };
}

// 定义公共片段：注意User这个单词必须是后端@ObjectType()定义过的
const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    name
    showName
    email
  }
`;
// TypedDocumentNode<ResultType, VariablesType>
// query/mutation/subscription 后面的这个单词是自定义的，不需要和后端对应
export const GET_ALL_USERS: TypedDocumentNode<{allUser: User[]}> = gql`
  ${USER_FIELDS}
  query AllUserRes {
    allUser {
      ...UserFields
    }
  }
`;
// $的变量名字需要对应参数重ListUserVars对应的属性，另外两个需要对应后端的字段名
export const GET_LIST_USERS: TypedDocumentNode<{listUser: User[]}, ListUserVars> = gql`
  ${USER_FIELDS}
  query ListUserRes($input: QueryUserInput!) {
    listUser(input: $input) {
      ...UserFields
    }
  }
`;

export const CREATE_USER: TypedDocumentNode<{createUser: User}, CreateUserVars> = gql`
  ${USER_FIELDS}
  mutation CreateUserRes($input: CreateUserInput!) {
    createUser(input: $input) {
      ...UserFields
    }
  }
`;

export const UPDATE_USER_BY_NAME: TypedDocumentNode<{updateUser: User}, UpdateUserVars> = gql`
  ${USER_FIELDS}
  mutation UpdateUserRes($input: UpdateUserInput!) {
    updateUserByName(input: $input) {
      ...UserFields
    }
  }
`;

export const SUB_USERS: TypedDocumentNode<{usersUpdated: User[]}> = gql`
  ${USER_FIELDS}
  subscription OnUsersUpdatedRes {
    usersUpdated {
      ...UserFields
    }
  }
`;

export const SUB_UPDATE_USER: TypedDocumentNode<{userUpdated: User}, {extra: string}> = gql`
  ${USER_FIELDS}
  subscription OnUserUpdatedRes($extra: String!) {
    userUpdated(extra: $extra) {
      ...UserFields
    }
  }
`;

export const SUB_CREATE_USER: TypedDocumentNode<{userCreated: User}> = gql`
  ${USER_FIELDS}
  subscription OnUserCreatedRes {
    userCreated {
      ...UserFields
    }
  }
`;
