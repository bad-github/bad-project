// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from 'react';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    APP_BUILD_TIME: string;
  }
}

declare global {
  interface WindowEventMap {
    'app:navigate': CustomEvent<{path: string; replace?: boolean}>;
  }
}
