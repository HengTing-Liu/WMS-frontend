import { requestClient } from '#/api/request';

/**
 * 权限管理 API（低代码驱动 - sys_menu C/M/F 三层结构）
 */

/**
 * 获取权限树（过滤 menu_type IN ('C','M','F')）
 */
export function getPermissionTree() {
  return requestClient.get('/permission/tree');
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
 * 删除权限点（仅 F 类允许）
 */
export function deletePermission(menuId: number | string) {
  return requestClient.delete(`/permission/${menuId}`);
}
