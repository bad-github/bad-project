import {getMock} from '@/mock';

// 页面懒加载后，使用当前语言的场景统一生成列表项。
const mock = await getMock();
export const mockData1 = mock.user.getAll(300);
export const mockData2 = mock.user.getAll(300);
