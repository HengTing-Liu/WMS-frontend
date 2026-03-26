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

// ============================================================
// WMS0080 用户管理 API - /api/base/user/*
// ============================================================

/**
 * WmsUser 数据类型（对应后端 WmsUserResponse）
 */
export interface WmsUserResult {
  userId?: number;
  deptId?: number;
  deptName?: string;
  userName?: string;
  nickName?: string;
  email?: string;
  phonenumber?: string;
  sex?: string;
  avatar?: string;
  status?: string;
  defaultPage?: string;
  loginIp?: string;
  loginDate?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

/**
 * WmsUser 查询参数
 */
export interface WmsUserQuery {
  pageNum?: number;
  pageSize?: number;
  userName?: string;
  nickName?: string;
  phonenumber?: string;
  status?: string;
  deptId?: number;
}

/**
 * WmsUser 新增/编辑参数
 */
export interface WmsUserRequest {
  userId?: number;
  deptId?: number;
  userName?: string;
  nickName?: string;
  email?: string;
  phonenumber?: string;
  sex?: string;
  avatar?: string;
  password?: string;
  status?: string;
  defaultPage?: string;
  remark?: string;
}

/**
 * 转换 WmsUser 行数据（兼容下划线/驼峰）
 */
function normalizeWmsUserRow(row: any): WmsUserResult {
  return {
    ...row,
    userId: row?.userId ?? row?.user_id,
    deptId: row?.deptId ?? row?.dept_id,
    deptName: row?.deptName ?? row?.dept_name,
    userName: row?.userName ?? row?.user_name,
    nickName: row?.nickName ?? row?.nick_name,
    phonenumber: row?.phonenumber ?? row?.phoneNumber,
    defaultPage: row?.defaultPage ?? row?.default_page,
    loginIp: row?.loginIp ?? row?.login_ip,
    loginDate: row?.loginDate ?? row?.login_date,
    createBy: row?.createBy ?? row?.create_by,
    createTime: row?.createTime ?? row?.create_time,
    updateBy: row?.updateBy ?? row?.update_by,
    updateTime: row?.updateTime ?? row?.update_time,
  } as WmsUserResult;
}

// ========== WmsUser API ==========

/**
 * 分页查询用户列表
 */
export async function listWmsUserPage(params: WmsUserQuery & Recordable<any>) {
  const res = await requestClient.get('/base/user/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeWmsUserRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

/**
 * 查询所有用户（不分页）
 */
export async function listWmsUserAll(): Promise<WmsUserResult[]> {
  const res = await requestClient.get('/base/user/listAll');
  const rawRows = res?.data || res?.list || res || [];
  return Array.isArray(rawRows) ? rawRows.map(normalizeWmsUserRow) : [];
}

/**
 * 获取用户详情
 */
export async function getWmsUserDetail(id: number): Promise<WmsUserResult> {
  const res = await requestClient.get(`/base/user/${id}`);
  const data = res?.data || res;
  return normalizeWmsUserRow(data);
}

/**
 * 新增用户
 */
export async function createWmsUser(data: Partial<WmsUserRequest>) {
  const { userId, createTime, createBy, updateTime, updateBy, ...rest } = data as any;
  return requestClient.post('/base/user', rest);
}

/**
 * 编辑用户
 */
export async function updateWmsUser(data: Partial<WmsUserRequest>) {
  const id = data.userId;
  if (!id) {
    throw new Error('用户ID不能为空');
  }
  const { createTime, createBy, updateTime, updateBy, ...rest } = data as any;
  return requestClient.put(`/base/user/${id}`, rest);
}

/**
 * 删除用户
 */
export async function deleteWmsUser(id: number) {
  return requestClient.delete(`/base/user/${id}`);
}

/**
 * 切换用户状态
 */
export async function toggleWmsUserStatus(id: number, enabled: number) {
  return requestClient.patch(`/base/user/${id}/status`, null, { params: { enabled } });
}

/**
 * 导出用户
 */
export async function exportWmsUser(params?: WmsUserQuery) {
  return requestClient.post('/base/user/export', params, {
    responseType: 'blob',
  });
}
