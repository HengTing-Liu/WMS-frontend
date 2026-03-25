import type { MenuApi } from '#/api';
import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取菜单列表
 */
export async function getMenuList(params?: Recordable<any>) {
  const res = await requestClient.get('/menu/list', { params });
  return {
    total: res?.total || 0,
    rows: res?.rows || [],
  };
}

/**
 * 获取角色菜单树（包含已勾选菜单）
 */
export async function getRoleMenuTree(roleId: number | string) {
  const res = await requestClient.get<any>(`/menu/roleMenuTreeselect/${roleId}`, {
    responseReturn: 'body',
  });
  if (res?.code === 200) {
    return {
      checkedKeys: res.checkedKeys || [],
      menus: res.menus || [],
    };
  }
  return { checkedKeys: [], menus: [] };
}

/**
 * 根据ID获取菜单详情
 */
export async function getMenuById(menuId: number | string) {
  return requestClient.get(`/menu/${menuId}`);
}

/**
 * 新增菜单
 */
export async function addMenu(data: Partial<MenuApi.Menu>) {
  return requestClient.post('/menu', data);
}

/**
 * 修改菜单
 */
export async function editMenu(data: Partial<MenuApi.Menu>) {
  return requestClient.put('/menu', data);
}

/**
 * 修改菜单状态
 */
export async function changeMenuStatus(data: { menuId: number; status: string }) {
  return requestClient.put('/menu/changeStatus', data);
}

/**
 * 修改菜单显示状态
 */
export async function changeMenuVisible(data: { menuId: number; visible: string }) {
  return requestClient.put('/menu/changeVisible', data);
}

/**
 * 删除菜单
 */
export async function deleteMenu(menuId: number | string) {
  return requestClient.delete(`/menu/${menuId}`);
}
