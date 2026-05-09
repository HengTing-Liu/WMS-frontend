/**
 * 库区管理 API (WMS 模块)
 * 暂用 sys 模块 API，后续可替换为 wms 专用接口
 */
export {
  listStoragePage,
  getStorageById,
  addStorage,
  updateStorage,
  deleteStorage,
  toggleStorageStatus,
  exportStorage,
  listLocationSimple,
  type StorageQuery,
  type StorageResult,
} from '#/api/sys/storage';

export { listWarehouseSimpleForLocation } from '#/api/sys/warehouse';
