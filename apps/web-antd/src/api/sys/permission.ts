/**
 * 兼容旧路径 #/api/sys/permission
 * 实际 API 定义在 #/api/system/permission
 */
export {
  addPermission,
  assignPermissionMenu,
  changePermissionStatus,
  deletePermission,
  exportPermission,
  getPermissionById,
  getPermissionMenuMap,
  getPermissionMenuTree,
  getPermissionTree,
  updatePermission,
} from '#/api/system/permission';