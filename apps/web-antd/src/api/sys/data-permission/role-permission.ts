import { requestClient } from '#/api/request';

/**
 * 角色数据权限类型
 */
export interface RoleDataPermission {
  id?: number;
  roleId: number;
  roleName?: string;
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
 * 查询角色权限列表
 */
export async function getRolePermissionList(params: {
  roleId?: number;
  tableCode?: string;
  dataScope?: string;
  status?: number;
  page?: number;
  pageSize?: number;
}) {
  return requestClient.get<any>('/api/permission/role/list', {
    params,
  });
}

/**
 * 获取角色权限详情
 */
export async function getRolePermissionDetail(id: number) {
  return requestClient.get<RoleDataPermission>(`/api/permission/role/${id}`);
}

/**
 * 创建角色权限
 */
export async function createRolePermission(data: RoleDataPermission) {
  return requestClient.post<any>('/api/permission/role', data);
}

/**
 * 更新角色权限
 */
export async function updateRolePermission(
  id: number,
  data: Partial<RoleDataPermission>,
) {
  return requestClient.put<any>(`/api/permission/role/${id}`, data);
}

/**
 * 删除角色权限
 */
export async function deleteRolePermission(id: number) {
  return requestClient.delete<any>(`/api/permission/role/${id}`);
}
