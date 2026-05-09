import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取角色列表
 */
export function getRoleList(params?: Recordable<any>) {
  return requestClient.get('/system/role/list', { params });
}

/**
 * 获取所有角色
 */
export function getAllRoles() {
  return requestClient.get('/system/role/all');
}

/**
 * 根据ID获取角色详情
 */
export function getRoleById(roleId: number | string) {
  return requestClient.get(`/api/system/role/${roleId}`);
}

/**
 * 新增角色
 */
export function addRole(data: any) {
  return requestClient.post('/system/role', data);
}

/**
 * 修改角色
 */
export function updateRole(data: any) {
  return requestClient.put('/system/role', data);
}
export const editRole = updateRole;

/**
 * 修改角色状态
 */
export function changeRoleStatus(data: { roleId: string | number; status: string }) {
  return requestClient.put('/system/role/changeStatus', data);
}

/**
 * 删除角色
 */
export function deleteRole(roleId: number | string) {
  return requestClient.delete(`/api/system/role/${roleId}`);
}

/**
 * 批量删除角色
 */
export function batchDeleteRole(roleIds: (number | string)[]) {
  return requestClient.delete('/system/role', { data: roleIds });
}

/**
 * 导出角色
 */
export function exportRole(params?: Recordable<any>) {
  return requestClient.download('/system/role/export', params);
}

/**
 * 获取角色已分配用户列表
 */
export function getAllocatedUsers(params?: Recordable<any>) {
  return requestClient.get('/system/role/authUser/allocatedList', { params });
}

/**
 * 获取角色未分配用户列表
 */
export function getUnallocatedUsers(params?: Recordable<any>) {
  return requestClient.get('/system/role/authUser/unallocatedList', { params });
}

/**
 * 批量授权用户到角色
 */
export function authUserSelectAll(data: any) {
  return requestClient.put('/system/role/authUser/selectAll', data);
}

/**
 * 取消授权用户角色
 */
export function authUserCancel(data: any) {
  return requestClient.put('/system/role/authUser/cancel', data);
}

/**
 * 批量取消授权用户角色
 */
export function authUserCancelAll(data: any) {
  return requestClient.put('/system/role/authUser/cancelAll', data);
}

/**
 * 获取角色部门树（数据权限）
 */
export function getRoleDeptTree(roleId: number | string) {
  return requestClient.get(`/api/system/role/deptTree/${roleId}`);
}

/**
 * 分配数据权限
 */
export function dataScope(data: any) {
  return requestClient.put('/system/role/dataScope', data);
}

/**
 * 获取角色菜单树
 */
export function getRoleMenuTree(roleId: number | string) {
  return requestClient.get(`/api/menu/roleMenuTreeselect/${roleId}`);
}

/**
 * 分配角色菜单
 */
export function assignRoleMenu(data: { id: number | string; menuIds: number[]; menuCheckStrictly?: boolean }) {
  return requestClient.put('/api/system/role/assignMenu', data);
}
