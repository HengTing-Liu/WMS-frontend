import type { AuthApi } from '@vben/types';

import { useAccessStore } from '@vben/stores';

import { baseRequestClient, requestClient } from '#/api/request';

/**
 * 登录
 */
export function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/login', data);
}

/**
 * 刷新accessToken
 */
export function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export function logoutApi() {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  return baseRequestClient.delete('/logout', {
    withCredentials: true,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
}

/**
 * 获取用户权限码
 */
export function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
