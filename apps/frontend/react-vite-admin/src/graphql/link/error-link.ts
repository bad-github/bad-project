import {ErrorLink} from '@apollo/client/link/error';
import {CombinedGraphQLErrors, CombinedProtocolErrors} from '@apollo/client/errors';

// Log any GraphQL errors, protocol errors, or network error that occurred
export const errorLink = new ErrorLink(({error, operation: _}) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({message, locations, path}) => {
      console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  } else if (CombinedProtocolErrors.is(error)) {
    error.errors.forEach(({message, extensions}) => {
      console.log(`[Protocol error]: Message: ${message}, Extensions: ${JSON.stringify(extensions)}`);
    });
  } else {
    console.error(`[Network error]: ${error}`);
  }
});
