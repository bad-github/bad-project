import {RetryLink} from '@apollo/client/link/retry';

export const retryLink = new RetryLink({
  attempts: (_, operation, error) => {
    return !!error && operation.operationName != 'specialCase';
  },
  delay: (attempt, _, __) => {
    return attempt * 1000 * Math.random();
  },
});
