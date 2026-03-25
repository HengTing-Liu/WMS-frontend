import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户列表
 */
export async function getUserList(params?: Recordable<any>) {
  const res = await requestClient.get('/user/list', { params });
  return {
    total: res?.total || 0,
    rows: res?.rows || [],
  };
}

/**
 * 获取用户详情
 */
export function getUserById(userId: string | number) {
  return requestClient.get(`/api/user/${userId}`);
}
export const getUser = getUserById;
export const getUserId = getUserById;

/**
 * 新增用户
 */
export function addUser(data: any) {
  return requestClient.post('/user', data);
}
export const userAdd = addUser;

/**
 * 修改用户
 */
export function updateUser(data: any) {
  return requestClient.put('/user', data);
}
export const userEdit = updateUser;

/**
 * 修改用户状态
 */
export function changeUserStatus(data: { userId: string | number; status: string }) {
  return requestClient.put('/user/changeStatus', data, { responseReturn: 'body' });
}
export const updateUserStatus = changeUserStatus;

/**
 * 删除用户
 */
export function deleteUser(userId: string | number) {
  return requestClient.delete(`/api/user/${userId}`);
}

/**
 * 批量删除用户
 */
export function batchDeleteUser(userIds: (string | number)[]) {
  return requestClient.delete('/user', { data: userIds });
}

/**
 * 导出用户
 */
export function exportUser(params?: Recordable<any>) {
  return requestClient.download('/user/export', params);
}

/**
 * 导入用户
 */
export function importUser(file: File, updateSupport: boolean = false) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('updateSupport', String(updateSupport));
  return requestClient.post('/user/importData', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
export const importUsers = importUser;

/**
 * 下载导入模板
 */
export function downloadTemplate() {
  return requestClient.download('/user/importTemplate');
}
export const importTemplate = downloadTemplate;

/**
 * 重置密码
 */
export function resetUserPwd(userId: string | number, password: string) {
  return requestClient.put('/user/resetPwd', { userId, password });
}

/**
 * 获取用户授权角色列表
 */
export function getAuthRoles(userId: string | number) {
  return requestClient.get(`/api/user/authRole/${userId}`);
}

/**
 * 更新用户授权角色
 */
export function updateAuthRoles(data: any) {
  return requestClient.put('/user/authRole', data);
}
