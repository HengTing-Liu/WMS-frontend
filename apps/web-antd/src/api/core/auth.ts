import { baseRequestClient, requestClient } from '#/api/request';
import { useAccessStore } from '@vben/stores';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    access_token: string;
    expires_in: number;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  // 直接返回完整响应，让调用方处理
  const result = await requestClient.post<any>('/api/login', data);
  console.log('[Auth] loginApi raw result:', result);
  return result;
}

/**
 * 刷新 Token（暂未实现，后端可能不需要）
 */
export async function refreshTokenApi() {
  // TODO: 实现刷新 token 逻辑
  return null;
}

/**
 * 获取权限码列表（暂未实现）
 */
export async function getAccessCodesApi() {
  return [];
}

/**
 * 登出（暂未实现）
 */
export async function logoutApi() {
  return true;
}
