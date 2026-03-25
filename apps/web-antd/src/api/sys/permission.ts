import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 权限管理 API（低代码驱动 - sys_menu C/M/F 三层结构）
 */

/**
 * 获取权限树
 */
export function getPermissionTree(params?: Recordable<any>) {
  return requestClient.get('/permission/tree', { params });
}

/**
 * 获取权限点低代码配置映射
 */
export function getPermissionMenuMap() {
  return requestClient.get('/permission/menu-map');
}

/**
 * 获取权限点详情
 */
export function getPermissionById(menuId: number | string) {
  return requestClient.get(`/permission/${menuId}`);
}

/**
 * 新增权限点
 */
export function addPermission(data: any) {
  return requestClient.post('/permission', data);
}

/**
 * 更新权限点
 */
export function updatePermission(data: any) {
  return requestClient.put(`/permission/${data.menuId}`, data);
}

/**
 * 删除权限点
 */
export function deletePermission(menuId: number | string) {
  return requestClient.delete(`/permission/${menuId}`);
}

/**
 * 修改权限状态
 */
export function changePermissionStatus(data: { permissionId: number | string; status: number }) {
  return requestClient.put('/permission/changeStatus', data);
}

/**
 * 导出权限
 */
export function exportPermission(params?: Recordable<any>) {
  return requestClient.download('/permission/export', params);
}

/**
 * 获取角色菜单树（用于分配权限）
 */
export function getPermissionMenuTree(permissionId: number | string) {
  return requestClient.get(`/permission/menuTree/${permissionId}`);
}

/**
 * 分配角色菜单（权限分配）
 */
export function assignPermissionMenu(data: {
  permissionId: number | string;
  menuIds: number[];
  checkStrictly: boolean;
}) {
  return requestClient.put('/permission/menu', data);
}
