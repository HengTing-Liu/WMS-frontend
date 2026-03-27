/**
 * 权限管理 API (WMS 模块)
 * 暂用 sys 模块 API，后续可替换为 wms 专用接口
 */
export {
  getPermissionTree,
  getPermissionById,
  addPermission,
  updatePermission,
  deletePermission,
  changePermissionStatus,
  exportPermission,
  getPermissionOptions,
  assignPermissions,
} from '#/api/sys/permission';
