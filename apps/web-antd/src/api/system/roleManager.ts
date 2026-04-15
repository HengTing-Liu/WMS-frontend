import { requestClient } from '#/api/request';

export namespace RoleApi {
  export interface RoleItem {
    roleId: number;
    roleName: string;
    roleKey: string;
    roleSort: number;
    dataScope?: string;
    menuCheckStrictly?: boolean;
    deptCheckStrictly?: boolean;
    status: string;
    delFlag?: string;
    createBy?: string | null;
    createTime: string;
    updateBy?: string | null;
    updateTime?: string | null;
    remarks?: string | null;
    flag?: boolean;
    menuIds?: number[] | null;
    deptIds?: number[] | null;
    permissions?: string[] | null;
    admin?: boolean;
    [key: string]: any;
  }

  export interface RoleListResult {
    total: number;
    rows: RoleItem[];
  }
}

// 菜单树（菜单权限）
export namespace MenuApi {
  export interface MenuItem {
    menuId: number;
    menuName: string;
    parentId: number;
    parentName?: string | null;
    orderNum?: number;
    path?: string;
    component?: string | null;
    menuType?: string;
    visible?: string;
    status?: string;
    perms?: string;
    icon?: string;
    children?: MenuItem[];
    [key: string]: any;
  }
}

export type RoleItem = RoleApi.RoleItem;
export type MenuItem = MenuApi.MenuItem;

/** 列表查询参数 */
export interface RoleListParams {
  pageNum?: number;
  pageSize?: number;
  roleName?: string;
  roleKey?: string;
  status?: string;
  beginTime?: string;
  endTime?: string;
}

/** 新增/编辑角色请求体 */
export interface RoleSaveBody {
  roleId?: number;
  roleName: string;
  roleKey: string;
  roleSort: number;
  status: string;
  dataScope?: string;
  menuIds?: number[];
  remarks?: string;
  menuCheckStrictly?: boolean;
  deptCheckStrictly?: boolean;
  [key: string]: any;
}

/**
 * 获取角色列表
 * GET /api/role/list
 * 使用 responseReturn: 'body' 兼容后端直接返回 { total, rows } 的格式（无 code/data 包装）
 */
async function getRoleList(params?: RoleListParams) {
  return requestClient.get<RoleApi.RoleListResult>('/api/role/list', {
    params,
    responseReturn: 'body',
  });
}

/**
 * 获取菜单树（菜单权限）
 * GET /api/menu/list
 */
async function getMenuTree() {
  return requestClient.get<MenuApi.MenuItem[]>('/api/menu/list');
}

/**
 * 角色菜单树（编辑角色时回显菜单权限）
 * GET /api/menu/roleMenuTreeselect/{roleId}
 * 返回结构示例：
 * { code, msg, menus: [{ id, label, disabled?, children }], checkedKeys: number[] }
 */
async function getRoleMenuTreeSelect(roleId: number | string) {
  return requestClient.get<any>(`/api/menu/roleMenuTreeselect/${roleId}`, {
    responseReturn: 'body',
  });
}

/**
 * 获取角色菜单树
 * GET /api/menu/roleMenuTreeselect/{roleId}
 */
async function getRoleMenuTree(roleId: number | string) {
  return requestClient.get<any>(`/api/menu/roleMenuTreeselect/${roleId}`, {
    responseReturn: 'body',
  });
}

/**
 * 分配角色菜单
 * PUT /api/system/role/assignMenu
 */
async function assignRoleMenu(data: { id: number | string; menuIds: number[]; menuCheckStrictly?: boolean }) {
  return requestClient.put('/api/system/role/assignMenu', data, { responseReturn: 'body' });
}

/**
 * 新增角色
 * POST /api/role/add
 */
async function addRole(body: RoleSaveBody) {
  return requestClient.post('/api/role/add', body, { responseReturn: 'body' });
}

/**
 * 编辑角色
 * PUT /api/role/edit
 */
async function editRole(body: RoleSaveBody) {
  return requestClient.put('/api/role/edit', body, { responseReturn: 'body' });
}

/**
 * 删除角色（支持批量，多个 id 逗号分隔）
 * DELETE /api/role/{roleIds}
 */
async function deleteRole(roleIds: number | number[] | string) {
  const idStr = Array.isArray(roleIds) ? roleIds.join(',') : String(roleIds);
  return requestClient.delete(`/api/role/${idStr}`, { responseReturn: 'body' });
}

/**
 * 导出角色
 * POST /api/role/export
 */
async function exportRole(data: RoleListParams = {}) {
  return requestClient.post('/api/role/export', data, {
    responseType: 'blob',
    responseReturn: 'body',
  });
}

/**
 * 修改角色状态
 * PUT /api/role/changeStatus
 * @param roleId 角色 id
 * @param status 状态 "0" 正常 "1" 停用
 */
async function changeRoleStatus(roleId: number, status: string) {
  return requestClient.put('/api/role/changeStatus', { roleId, status }, { responseReturn: 'body' });
}

/**
 * 获取角色详情（数据权限弹框用）
 * GET /api/role/{roleId}
 * 返回 { code, data: { roleId, roleName, roleKey, dataScope, deptCheckStrictly, ... } }
 */
async function getRoleDetail(roleId: number | string) {
  return requestClient.get(`/api/role/${roleId}`);
}

/** 部门树节点（deptTree 接口返回） */
export interface RoleDeptTreeNode {
  id: number;
  label: string;
  disabled?: boolean;
  children?: RoleDeptTreeNode[];
}

/**
 * 获取角色数据权限部门树及已选中的部门 id
 * GET /api/role/deptTree/{roleId}
 * 返回 { msg, code: 200, depts: [{ id, label, disabled?, children }], checkedKeys: number[] }
 */
async function getRoleDeptTree(roleId: number | string) {
  return requestClient.get<{ code?: number; msg?: string; depts?: RoleDeptTreeNode[]; checkedKeys?: number[] }>(
    `/api/role/deptTree/${roleId}`,
    { responseReturn: 'body' },
  );
}

/**
 * 保存角色数据权限
 * PUT /api/role/dataScope  body: { roleId, dataScope, deptIds? }
 */
async function updateRoleDataScope(data: { roleId: number | string; dataScope: string; deptIds?: number[] }) {
  return requestClient.put('/api/role/dataScope', data, { responseReturn: 'body' });
}

export interface AuthUserItem {
  userId: number;
  userName: string;
  nickName: string;
  email?: string | null;
  phonenumber?: string | null;
  status: string;
  createTime: string;
  dept?: { deptName?: string } | null;
  [key: string]: any;
}

export interface AuthUserListResult {
  total: number;
  rows: AuthUserItem[];
}

/**
 * 已分配该角色的用户列表
 * GET /api/role/authUser/allocatedList?pageNum=1&pageSize=10&roleId=2
 */
async function getAuthUserAllocatedList(params: { roleId: string | number; pageNum?: number; pageSize?: number; userName?: string; phonenumber?: string }) {
  return requestClient.get<AuthUserListResult>('/api/role/authUser/allocatedList', {
    params,
    responseReturn: 'body',
  });
}

/**
 * 未分配该角色的用户列表（选择用户弹框）
 * GET /api/role/authUser/unallocatedList?pageNum=1&pageSize=10&roleId=2
 */
async function getAuthUserUnallocatedList(params: { roleId: string | number; pageNum?: number; pageSize?: number; userName?: string; phonenumber?: string }) {
  return requestClient.get<AuthUserListResult>('/api/role/authUser/unallocatedList', {
    params,
    responseReturn: 'body',
  });
}

/**
 * 取消授权：取消某用户在该角色下的授权
 * PUT /api/role/authUser/cancel   body: { userId, roleId }
 */
async function authUserCancel(data: { userId: number | string; roleId: string | number }) {
  return requestClient.put('/api/role/authUser/cancel', data, { responseReturn: 'body' });
}

/**
 * 为角色添加用户（批量授权）- 选择用户弹框确定时调用
 * PUT /api/role/authUser/selectAll?roleId=2&userIds=1,2,3
 */
async function authUserSelectAll(params: { roleId: string | number; userIds: (string | number)[] }) {
  const userIdsStr = params.userIds.map(String).join(',');
  return requestClient.put('/api/role/authUser/selectAll', null, {
    params: { roleId: params.roleId, userIds: userIdsStr },
    responseReturn: 'body',
  });
}

/**
 * 为角色添加用户（批量授权）- 原 body 方式，若后端用 selectAll 则使用 authUserSelectAll
 * PUT /api/role/authUser   body: { roleId, userIds }
 */
async function authUserAdd(data: { roleId: string | number; userIds: (string | number)[] }) {
  return requestClient.put('/api/role/authUser', data, { responseReturn: 'body' });
}

export {
  getRoleList,
  getMenuTree,
  getRoleMenuTreeSelect,
  addRole,
  editRole,
  deleteRole,
  exportRole,
  changeRoleStatus,
  getRoleDetail,
  getRoleDeptTree,
  updateRoleDataScope,
  getAuthUserAllocatedList,
  getAuthUserUnallocatedList,
  authUserCancel,
  authUserAdd,
  authUserSelectAll,
  getRoleMenuTree,
  assignRoleMenu,
};
export const getRoleById = getRoleDetail;
