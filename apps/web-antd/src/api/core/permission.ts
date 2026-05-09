import { requestClient } from '#/api/request';

/**
 * 权限管理 - 获取列表
 */
export async function getPermissionListApi(params?: any) {
  return requestClient.get<any>('/api/base/permission/list', { params });
}

/**
 * 权限管理 - 新增
 */
export async function addPermissionApi(data: any) {
  return requestClient.post<any>('/api/base/permission', data);
}

/**
 * 权限管理 - 修改
 */
export async function updatePermissionApi(data: any) {
  return requestClient.post<any>('/api/base/permission', data);
}

/**
 * 权限管理 - 删除
 */
export async function deletePermissionApi(id: number) {
  return requestClient.delete<any>(`/api/base/permission/${id}`);
}
