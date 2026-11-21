import {gql, type TypedDocumentNode} from '@apollo/client';

export const GET_HELLO: TypedDocumentNode<{getHello: string}> = gql`
  query GetHello {
    getHello
  }
`;
