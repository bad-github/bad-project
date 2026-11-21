import {fetchRequest} from './fetch';
import {Success} from './common';
import {getMock} from '@/mock';

export async function getMockUsers(length: number = 10) {
  const mock = await getMock();
  const result = mock.user.getAll(length);
  return Success(result);
}

export function getUsers() {
  return fetchRequest('/users');
}

export function getPageUsers(params: Record<string, any> = {}) {
  return fetchRequest('/users/page', {params});
}
