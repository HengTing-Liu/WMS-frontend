import type { Recordable } from '@vben/types';
import { requestClient } from '#/api/request';

export interface SysUserQuery {
  pageNum?: number;
  pageSize?: number;
  username?: string;
  realName?: string;
  phone?: string;
  status?: number;
  deptId?: number;
}

export interface SysUserResult {
  userId?: number;
  username: string;
  password?: string;
  realName?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  status: number;
  deptId?: number;
  deptName?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  roles?: any[];
}

function normalizeUserRow(row: any): SysUserResult {
  return {
    ...row,
    userId: row?.userId ?? row?.user_id,
    username: row?.username,
    realName: row?.realName ?? row?.real_name,
    phone: row?.phone,
    status: Number(row?.status ?? 1),
    deptId: row?.deptId ?? row?.dept_id,
    deptName: row?.deptName ?? row?.dept_name,
    createBy: row?.createBy ?? row?.create_by,
    createTime: row?.createTime ?? row?.create_time,
    updateBy: row?.updateBy ?? row?.update_by,
    updateTime: row?.updateTime ?? row?.update_time,
  } as SysUserResult;
}

export async function listUserPage(params: SysUserQuery) {
  const res = await requestClient.get('/system/user/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeUserRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

export async function getUserDetail(id: number): Promise<SysUserResult> {
  const res = await requestClient.get(`/system/user/${id}`);
  return normalizeUserRow(res?.data || res);
}

export async function getUserWithRoles(id: number) {
  const res = await requestClient.get(`/system/user/${id}/roles`);
  return res?.data || res;
}

export async function createUser(data: Partial<SysUserResult>) {
  return requestClient.post('/system/user', data);
}

export async function updateUser(data: Partial<SysUserResult>) {
  return requestClient.put(`/system/user/${data.userId}`, data);
}

export async function deleteUser(id: number) {
  return requestClient.delete(`/system/user/${id}`);
}

export async function batchDeleteUser(ids: number[]) {
  return requestClient.post('/system/user/batch-delete', { ids });
}

export async function toggleUserStatus(id: number, enabled: number) {
  return requestClient.patch(`/system/user/${id}/status`, null, { params: { enabled } });
}

export async function exportUser(params: SysUserQuery) {
  return requestClient.post('/system/user/export', params, { responseType: 'blob' });
}

export async function getAllRoles() {
  const res = await requestClient.get('/system/role/all');
  return res?.data || res || [];
}

export async function getRoleList() {
  const res = await requestClient.get('/system/role/list');
  return res?.data || res || [];
}

export async function getDeptTree() {
  const res = await requestClient.get('/system/dept/tree');
  return res?.data || res || [];
}

export async function getUserRoleIds(userId: number) {
  const res = await requestClient.get(`/system/user/${userId}/role-ids`);
  return res?.data || res || [];
}