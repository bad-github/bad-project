import {time} from '@workspace/utils';
import {defaultRoutes} from '@/router';

export function getRoutes() {
  return time.sleep<Record<string, any>[]>(defaultRoutes, 1000);
}
