import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 查询当前登录用户个人信息
 * 对应后端：GET /api/user/profile
 */
export async function getProfile() {
  return requestClient.get('/api/user/profile', {
    responseReturn: 'body',
  });
}

/**
 * 修改当前登录用户个人信息
 * 对应后端：PUT /api/user/profile
 */
export async function updateProfile(data: Recordable<any>) {
  return requestClient.put('/api/user/profile', data, {
    responseReturn: 'body',
  });
}

/**
 * 修改当前登录用户密码
 * 对应后端：PUT /user/profile/updatePwd
 */
export async function updateProfilePassword(oldPassword: string, newPassword: string) {
  return requestClient.put(
    '/api/user/profile/updatePwd',
    { oldPassword, newPassword },
    {
      responseReturn: 'body',
    },
  );
}

// 为了兼容在其它地方按若依命名方式导入
export const getUserProfile = getProfile;
export const updateUserProfile = updateProfile;
export const updateUserPwd = updateProfilePassword;


