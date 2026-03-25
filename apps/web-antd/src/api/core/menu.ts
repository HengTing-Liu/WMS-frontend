import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户菜单列表
 */
export function getMenuList() {
  return requestClient.get<RouteRecordStringComponent[]>('/menu/getRouters');
}

/**
 * 获取所有菜单（权限管理用）
 */
export function getAllMenusApi() {
  return requestClient.get<RouteRecordStringComponent[]>('/menu/list');
}

/**
 * 根据ID获取菜单
 */
export function getMenuById(menuId: number | string) {
  return requestClient.get(`/menu/${menuId}`);
}

/**
 * 新增菜单
 */
export function addMenu(data: any) {
  return requestClient.post('/menu', data);
}

/**
 * 修改菜单
 */
export function updateMenu(data: any) {
  return requestClient.put('/menu', data);
}
export const editMenu = updateMenu;

/**
 * 修改菜单状态
 */
export function changeMenuStatus(data: { menuId: number | string; status: string }) {
  return requestClient.put('/menu/changeStatus', data);
}

/**
 * 修改菜单可见性
 */
export function changeMenuVisible(data: { menuId: number | string; visible: string }) {
  return requestClient.put('/menu/changeVisible', data);
}

/**
 * 删除菜单
 */
export function deleteMenu(menuId: number | string) {
  return requestClient.delete(`/menu/${menuId}`);
}

/**
 * 获取菜单树
 */
export function getMenuTree() {
  return requestClient.get('/menu/tree');
}
