import {Success} from '@/request/common';
import {time} from '@workspace/utils';
import {getMock} from '@/mock';

export async function getSortItems(data: {count: number; type?: string}) {
  await time.sleep(undefined, 1000);
  const type = data.type || 'type';
  const mock = await getMock();
  return Success(mock.sortItem.getByType(type, data.count)).data;
}

export async function getSortTypes() {
  await time.sleep(undefined, 1000);
  return Success(['A', 'B', 'C', 'D']).data;
}
