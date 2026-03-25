import { requestClient } from '#/api/request';

/**
 * 个人数据权限类型
 */
export interface UserDataPermission {
  id?: number;
  userId: number;
  userName?: string;
  tableCode: string;
  tableName?: string;
  dataScope: string;
  dataScopeName?: string;
  deptWhitelist?: number[];
  deptBlacklist?: number[];
  userWhitelist?: number[];
  userBlacklist?: number[];
  customSql?: string;
  status?: number;
  createBy?: number;
  createByName?: string;
  createTime?: string;
  updateTime?: string;
  remark?: string;
}

/**
 * 查询个人权限列表
 */
export async function getUserPermissionList(params: {
  userId?: number;
  tableCode?: string;
  dataScope?: string;
  status?: number;
  page?: number;
  pageSize?: number;
}) {
  return requestClient.get<any>('/api/permission/user/list', {
    params,
  });
}

/**
 * 获取个人权限详情
 */
export async function getUserPermissionDetail(id: number) {
  return requestClient.get<UserDataPermission>(
    `/api/permission/user/${id}`,
  );
}

/**
 * 创建个人权限
 */
export async function createUserPermission(data: UserDataPermission) {
  return requestClient.post<any>('/api/permission/user', data);
}

/**
 * 更新个人权限
 */
export async function updateUserPermission(
  id: number,
  data: Partial<UserDataPermission>,
) {
  return requestClient.put<any>(`/api/permission/user/${id}`, data);
}

/**
 * 删除个人权限
 */
export async function deleteUserPermission(id: number) {
  return requestClient.delete<any>(`/api/permission/user/${id}`);
}

/**
 * 批量删除个人权限
 */
export async function batchDeleteUserPermission(ids: number[]) {
  return requestClient.delete<any>('/api/permission/user/batch', {
    data: { ids },
  });
}

/**
 * 获取权限字典（数据范围）
 */
export async function getDataScopeDict() {
  return requestClient.get<any>('/api/permission/query/dict', {
    params: { dictType: 'data_scope' },
  });
}
