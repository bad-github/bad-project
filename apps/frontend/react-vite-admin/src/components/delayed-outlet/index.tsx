import {lazy} from 'react';
import { Outlet } from 'react-router';

// 放在 RouteMenu 函数外面
const DelayedOutlet = lazy(async () => {
  await new Promise((resolve) => setTimeout(resolve, 100000));

  return {default: Outlet};
});

export default DelayedOutlet;