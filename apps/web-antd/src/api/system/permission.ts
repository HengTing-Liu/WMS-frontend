import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

// ============================================================
// 成熟权限管理 API（/api/system/permission）
// ============================================================

/**
 * SysPermission 数据类型（对应后端 SysPermissionResponse）
 */
export interface SysPermissionResult {
  permissionId?: number;
  permissionName?: string;
  permissionCode?: string;
  permissionType?: number;
  parentId?: number;
  parentName?: string;
  orderNum?: number;
  path?: string;
  component?: string;
  query?: string;
  status?: string;
  remarks?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  children?: SysPermissionResult[];
}

/**
 * SysPermission 查询参数
 */
export interface SysPermissionQuery {
  pageNum?: number;
  pageSize?: number;
  permissionName?: string;
  permissionCode?: string;
  permissionType?: number;
  parentId?: number;
  status?: string;
}

/**
 * SysPermission 新增/编辑参数
 */
export interface SysPermissionRequest {
  permissionId?: number;
  permissionName?: string;
  permissionCode?: string;
  permissionType?: number;
  parentId?: number;
  orderNum?: number;
  path?: string;
  component?: string;
  query?: string;
  status?: string;
  remarks?: string;
}

/**
 * 转换 SysPermission 行数据（兼容下划线/驼峰）
 */
function normalizeSysPermissionRow(row: any): SysPermissionResult {
  return {
    ...row,
    permissionId: row?.permissionId ?? row?.permission_id,
    permissionName: row?.permissionName ?? row?.permission_name,
    permissionCode: row?.permissionCode ?? row?.permission_code,
    permissionType: row?.permissionType ?? row?.permission_type,
    parentId: row?.parentId ?? row?.parent_id,
    parentName: row?.parentName ?? row?.parent_name,
    orderNum: row?.orderNum ?? row?.order_num,
    path: row?.path ?? row?.path,
    component: row?.component ?? row?.component,
    query: row?.query ?? row?.query,
    status: row?.status ?? row?.status,
    createBy: row?.createBy ?? row?.create_by,
    createTime: row?.createTime ?? row?.create_time,
    updateBy: row?.updateBy ?? row?.update_by,
    updateTime: row?.updateTime ?? row?.update_time,
  } as SysPermissionResult;
}

// ========== WMS0090 SysPermission API ==========

/**
 * 分页查询权限列表
 */
export async function listSysPermissionPage(params: SysPermissionQuery & Recordable<any>) {
  const res = await requestClient.get('/system/permission/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeSysPermissionRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

/**
 * 查询所有权限（不分页）
 */
export async function listSysPermissionAll(): Promise<SysPermissionResult[]> {
  const res = await requestClient.get('/system/permission/listAll');
  const rawRows = res?.data || res?.list || res || [];
  return Array.isArray(rawRows) ? rawRows.map(normalizeSysPermissionRow) : [];
}

/**
 * 获取权限详情
 */
export async function getSysPermissionDetail(id: number): Promise<SysPermissionResult> {
  const res = await requestClient.get(`/system/permission/${id}`);
  const data = res?.data || res;
  return normalizeSysPermissionRow(data);
}

/**
 * 新增权限
 */
export async function createSysPermission(data: Partial<SysPermissionRequest>) {
  const { permissionId, createTime, createBy, updateTime, updateBy, ...rest } = data as any;
  return requestClient.post('/system/permission', rest);
}

/**
 * 编辑权限
 */
export async function updateSysPermission(data: Partial<SysPermissionRequest>) {
  const id = data.permissionId;
  if (!id) {
    throw new Error('权限ID不能为空');
  }
  const { createTime, createBy, updateTime, updateBy, ...rest } = data as any;
  return requestClient.put(`/system/permission/${id}`, rest);
}

/**
 * 删除权限
 */
export async function deleteSysPermission(id: number) {
  return requestClient.delete(`/system/permission/${id}`);
}

/**
 * 切换权限状态
 */
export async function toggleSysPermissionStatus(id: number, enabled: number) {
  return requestClient.patch(`/system/permission/${id}/status`, null, { params: { enabled } });
}
