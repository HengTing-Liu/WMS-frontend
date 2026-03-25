import { requestClient } from '#/api/request';
import type { UserInfo } from '@vben/types';

export function getUserInfoApi() {
  return requestClient.get<UserInfo>('/user/getInfo');
}
