import { requestClient } from '#/api/request';
import type { UserInfo } from '@vben/types';

/**
 * 解码 JWT token 获取用户 ID
 */
function decodeUserIdFromToken(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.user_id || decoded.userId || decoded.sub || null;
  } catch {
    return null;
  }
}

export function getUserInfoApi(userId: number) {
  return requestClient.get<UserInfo>(`/base/user/${userId}`);
}

export { decodeUserIdFromToken };
