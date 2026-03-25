import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 用户数据类型
 */
export interface SysUserResult {
  user_id?: number;
  dept_id?: number;
  dept_name?: string;
  user_name?: string;
  nick_name?: string;
  user_type?: string;
  email?: string;
  phonenumber?: string;
  sex?: string;
  avatar?: string;
  status?: string;
  default_page?: string;
  login_ip?: string;
  login_date?: string;
  pwd_update_date?: string;
  create_by?: string;
  create_time?: string;
  update_by?: string;
  update_time?: string;
  remark?: string;
  role_ids?: number[];
  role_names?: string;
  roles?: Array<{ roleId: number; roleName: string }>;
}

/**
 * 用户查询参数
 */
export interface SysUserQuery {
  pageNum?: number;
  pageSize?: number;
  user_name?: string;
  nick_name?: string;
  phonenumber?: string;
  status?: string;
  dept_id?: number;
}

/**
 * 角色数据类型
 */
export interface RoleResult {
  roleId: number;
  roleName: string;
  roleKey?: string;
  status?: string;
}

/**
 * 部门数据类型
 */
export interface DeptResult {
  deptId: number;
  deptName: string;
  parentId?: number;
  children?: DeptResult[];
}

/**
 * 转换用户数据（兼容下划线/驼峰）
 */
function normalizeUserRow(row: any): SysUserResult {
  return {
    ...row,
    user_id: row?.user_id ?? row?.userId,
    dept_id: row?.dept_id ?? row?.deptId,
    dept_name: row?.dept_name ?? row?.deptName,
    user_name: row?.user_name ?? row?.userName,
    nick_name: row?.nick_name ?? row?.nickName,
    phonenumber: row?.phonenumber ?? row?.phoneNumber,
    create_time: row?.create_time ?? row?.createTime,
    create_by: row?.create_by ?? row?.createBy,
    update_by: row?.update_by ?? row?.updateBy,
    update_time: row?.update_time ?? row?.updateTime,
    role_names: row?.role_names ?? row?.roleNames,
  } as SysUserResult;
}

/**
 * 获取用户分页列表
 */
export async function listUserPage(params: SysUserQuery & Recordable<any>) {
  const res = await requestClient.get('/crud/sys_user/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeUserRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

/**
 * 获取用户详情
 */
export async function getUserDetail(id: number): Promise<SysUserResult> {
  const res = await requestClient.get(`/crud/sys_user/${id}`);
  const data = res?.data || res;
  return normalizeUserRow(data);
}

/**
 * 获取用户详情（含角色信息）
 */
export async function getUserWithRoles(id: number): Promise<any> {
  const res = await requestClient.get(`/api/system/user/${id}`);
  return res?.data || res;
}

/**
 * 新增用户
 */
export async function createUser(data: Partial<SysUserResult>) {
  const { user_id, create_time, create_by, update_time, update_by, ...rest } = data as any;
  return requestClient.post('/crud/sys_user', rest);
}

/**
 * 编辑用户
 */
export async function updateUser(data: Partial<SysUserResult>) {
  const id = data.user_id;
  if (!id) {
    throw new Error('用户ID不能为空');
  }
  const { create_time, create_by, update_time, update_by, ...rest } = data as any;
  return requestClient.put(`/crud/sys_user/${id}`, rest);
}

/**
 * 删除用户
 */
export async function deleteUser(id: number) {
  return requestClient.delete(`/crud/sys_user/${id}`);
}

/**
 * 批量删除用户
 */
export async function batchDeleteUser(ids: number[]) {
  return requestClient.delete('/crud/sys_user/batch', { data: ids });
}

/**
 * 切换用户状态
 */
export async function toggleUserStatus(id: number, status: string) {
  return requestClient.patch(`/crud/sys_user/${id}/status`, null, { params: { status } });
}

/**
 * 获取所有角色列表
 */
export async function getAllRoles(): Promise<RoleResult[]> {
  const res = await requestClient.get('/system/role/all');
  return res?.data || res?.list || res || [];
}

/**
 * 获取角色列表（分页）
 */
export async function getRoleList(params?: Recordable<any>) {
  const res = await requestClient.get('/system/role/list', { params });
  return {
    rows: res?.rows || res?.list || [],
    total: res?.total || 0,
  };
}

/**
 * 获取部门树
 */
export async function getDeptTree(): Promise<DeptResult[]> {
  const res = await requestClient.get('/system/dept/treeselect');
  return res?.data || res || [];
}

/**
 * 导出用户
 */
export async function exportUser(params?: SysUserQuery) {
  return requestClient.post('/crud/sys_user/export', params, {
    responseType: 'blob',
  });
}

/**
 * 获取用户角色ID列表
 */
export async function getUserRoleIds(userId: number): Promise<number[]> {
  const res = await requestClient.get(`/api/system/user/${userId}/roles`);
  return res?.data || res || [];
}
