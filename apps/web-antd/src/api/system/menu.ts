import { requestClient } from '#/api/request';

export interface MenuItem {
  menuId: number;
  menuName: string;
  parentId: number;
  parentName?: string | null;
  orderNum: number;
  path: string;
  component: string | null;
  query?: string | null;
  routeName?: string | null;
  isFrame: string;
  isCache: string;
  menuType: string;
  visible: string;
  status: string;
  perms: string;
  icon: string;
  createTime?: string | null;
  children?: MenuItem[];
  [key: string]: any;
}

/**
 * 菜单列表
 * GET /api/menu/list
 */
async function getMenuList(params?: Record<string, any>) {
  return requestClient.get<{ code?: number; msg?: string; data?: MenuItem[] }>(
    '/api/menu/list',
    { params, responseReturn: 'body' },
  );
}

/**
 * 菜单详情（回显）
 * GET /api/menu/:id
 */
async function getMenuDetail(menuId: number | string) {
  return requestClient.get<{ code?: number; msg?: string; data?: MenuItem }>(
    `/api/menu/${menuId}`,
    { responseReturn: 'body' },
  );
}

/**
 * 新增菜单
 * POST /api/menu
 */
async function addMenu(data: Record<string, any>) {
  return requestClient.post<{ code?: number; msg?: string }>('/api/menu', data, {
    responseReturn: 'body',
  });
}

/**
 * 修改菜单
 * PUT /api/menu
 */
async function updateMenu(data: Record<string, any>) {
  return requestClient.put<{ code?: number; msg?: string }>('/api/menu', data, {
    responseReturn: 'body',
  });
}

/**
 * 删除菜单
 * DELETE /api/menu/:id
 */
async function deleteMenu(menuId: number | string) {
  return requestClient.delete<{ code?: number; msg?: string }>(
    `/api/menu/${menuId}`,
    { responseReturn: 'body' },
  );
}

/**
 * 获取按钮列表（按父菜单ID和类型过滤）
 */
async function getButtonList(parentId: number | string) {
  return requestClient.get<{ code?: number; msg?: string; data?: MenuItem[] }>(
    '/api/menu/list',
    { params: { menuType: 'F', parentId }, responseReturn: 'body' },
  );
}

export { getMenuList, getMenuDetail, addMenu, updateMenu, deleteMenu, getButtonList };
export const getMenuById = getMenuDetail;
export const editMenu = updateMenu;

