/**
 * 用户管理 API (WMS 模块)
 * 暂用 sys 模块 API，后续可替换为 wms 专用接口
 */
export {
  listUserPage,
  getUserDetail,
  getUserWithRoles,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUser,
  toggleUserStatus,
  getAllRoles,
  getRoleList,
  getDeptTree,
  exportUser,
  getUserRoleIds,
  type SysUserQuery,
  type SysUserResult,
} from '#/api/sys/user';
