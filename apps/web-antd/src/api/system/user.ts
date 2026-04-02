import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace UserApi {
 export interface TreeNode {
  id: number;
  label: string;
  disabled: boolean;
  children?: TreeNode[];
}
// 部门信息接口
 export interface Dept {
  deptName: string;
   [key: string]: any;
}
 // 用户信息接口
 export interface User {
  userId: string | number;
  userName: string;
  nickName: string;
  dept: Dept;
  deptId: number;
  phonenumber: string;
  status: string;
  createTime: string;
  [key: string]: any;
}
 export interface userResult {
    total: number;
    rows: User[];
}
}

/**
 * 获取角色列表数据
 */
async function getDeptTree() {
  return requestClient.get<UserApi.TreeNode[]>(
    '/api/user/deptTree',
  );
}
async function getUserList(params?: Recordable<any>) {
  return requestClient.get<UserApi.userResult>(
    '/api/user/list',
    { params },
  );
}

async function updateUserStatus(data: { userId: string | number; status: string }) {
  return requestClient.put('/api/user/changeStatus', data,{ responseReturn: 'body' });
}
async function getUser() {
  return requestClient.get(
`/api/user/`
  );
}
async function getUserId(userId?:string |  number) {
  return requestClient.get(
`/api/user/${userId}`
  );
}
async function userAdd(data:Object) {
  return requestClient.post('/api/user/add', data,{ responseReturn: 'body' });
}
async function userEdit(data:Object) {
  return requestClient.put('/api/user/edit', data,{ responseReturn: 'body' });
}
async function deleteUser(userIds:string | number){
  return requestClient.delete(`/api/user/${userIds}`,{ responseReturn: 'body' });
}

// 重置用户密码
async function resetUserPwd(data: { userId: string | number; password: string }) {
  return requestClient.put('/api/user/resetPwd', data, { responseReturn: 'body' });
}

// 查询用户已分配角色信息
async function getUserAuthRole(userId: string | number) {
  return requestClient.get(`/api/user/authRole/${userId}`, { responseReturn: 'body' });
}

// 分配角色：userId + 逗号分隔的 roleIds
async function authUserRole(params: { userId: string | number; roleIds: string | number | Array<string | number> }) {
  const roleIdsStr = Array.isArray(params.roleIds)
    ? params.roleIds.join(',')
    : String(params.roleIds);
  return requestClient.put('/api/user/authRole', null, {
    params: {
      userId: params.userId,
      roleIds: roleIdsStr,
    },
    responseReturn: 'body',
  });
}

async function exportUser(data: Recordable<any> = {}) {
  return requestClient.post('/api/user/export', data, {
    responseType: 'blob',
    responseReturn: 'body',
  });
}
// 导入模版下载
// async function importTemplate() {
//   return requestClient.post(`/api/user/importTemplate`,{},{  responseType: 'blob', responseReturn: 'body' });
// }
async function importTemplate(config?: Recordable<any>) {
  return requestClient.download('/api/user/importTemplate', {
    method: 'POST',
    responseReturn: 'body',
    ...config,
  });
}
// 用户数据导入
async function importUsers(file: File, onUploadProgress?: (progressEvent: any) => void) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/api/user/importData', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
    responseReturn: 'body',
  });
}
export {
  getDeptTree,
  getUserList,
  updateUserStatus,
  getUser,
  getUserId,
  userAdd,
  userEdit,
  deleteUser,
  exportUser,
  importTemplate,
  importUsers,
  resetUserPwd,
  getUserAuthRole,
  authUserRole,
};