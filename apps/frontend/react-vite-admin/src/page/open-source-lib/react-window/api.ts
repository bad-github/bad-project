import {Success} from '@/request/common';
import {time} from '@workspace/utils';
import {getMock} from '@/mock';

// 页面模块加载时创建一次场景，后续请求复用同一份用户数据。
const {user} = await getMock();

export async function getTodoData(start: number, limit: number) {
  // 保留模拟网络延迟，用于展示列表加载状态。
  await time.sleep(undefined, 2000);
  const {total, data} = user.getRange(start, limit);
  return Success({total, users: data});
}
