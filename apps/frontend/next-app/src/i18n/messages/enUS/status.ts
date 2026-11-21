const status = {
  loading: 'Loading…',
  error: {
    title: 'Something went wrong',
    retry: 'Try again',
  },
  notFound: {
    title: 'Page not found',
    description: 'The page you requested does not exist. It may have been moved or deleted.',
    goHome: 'Go home',
    suggestionTitle: 'You can try',
    checkUrl: 'Check the URL for typing errors.',
    goHomeSuggestion: 'Return home and browse from there.',
  },
} as const;

export default status;
