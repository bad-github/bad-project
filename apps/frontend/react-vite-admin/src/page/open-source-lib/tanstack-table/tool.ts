import {getMock} from '@/mock';
import type {UserNode} from '@workspace/mock';

export type Person = UserNode;

// 保留页面同步读取方式；记录生成与层级展开交给 mock 包。
const mock = await getMock();
export const makeData = (...counts: number[]): Person[] => mock.user.getTree(...counts);
