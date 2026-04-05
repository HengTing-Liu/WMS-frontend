import { requestClient } from '#/api/request';

/**
 * 部门数据权限类型
 */
export interface DeptDataPermission {
  id?: number;
  deptId: number;
  deptName?: string;
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
 * 查询部门权限列表
 */
export async function getDeptPermissionList(params: {
  deptId?: number;
  tableCode?: string;
  dataScope?: string;
  status?: number;
  page?: number;
  pageSize?: number;
}) {
  return requestClient.get<any>('/api/permission/dept/list', {
    params,
  });
}

/**
 * 获取部门权限详情
 */
export async function getDeptPermissionDetail(id: number) {
  return requestClient.get<DeptDataPermission>(`/api/permission/dept/${id}`);
}

/**
 * 创建部门权限
 */
export async function createDeptPermission(data: DeptDataPermission) {
  return requestClient.post<any>('/api/permission/dept', data);
}

/**
 * 更新部门权限
 */
export async function updateDeptPermission(
  id: number,
  data: Partial<DeptDataPermission>,
) {
  return requestClient.put<any>(`/api/permission/dept/${id}`, data);
}

/**
 * 删除部门权限
 */
export async function deleteDeptPermission(id: number) {
  return requestClient.delete<any>(`/api/permission/dept/${id}`);
}
