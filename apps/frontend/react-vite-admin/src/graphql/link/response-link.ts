import {ApolloLink, Observable} from '@apollo/client';

// 响应拦截
export const responseLink = new ApolloLink((operation, forward) => {
  // return forward(operation).map((response) => {
  //   const extensions = response.extensions;
  //   // 成功业务时按需提示
  //   if (!response.errors && extensions?.code === 200 && extensions?.message) {
  //     console.log('全局提示', extensions.message);
  //   }
  //   return response;
  // });
  // todo，待校验
  return new Observable((observer) => {
    const subscription = forward(operation).subscribe({
      next: (response) => {
        const extensions = response.extensions;
        // 成功业务时按需提示
        if (!response.errors && extensions?.code === 200 && extensions?.message) {
          console.log('全局提示', extensions.message);
        }

        observer.next(response);
      },
      error: (err) => observer.error(err),
      complete: () => observer.complete(),
    });

    return () => {
      subscription.unsubscribe();
    };
  });
});
