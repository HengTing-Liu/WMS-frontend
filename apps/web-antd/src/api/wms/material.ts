/**
 * 物料管理 API (WMS 模块)
 * 暂用 sys 模块 API，后续可替换为 wms 专用接口
 */
export {
  listMaterialPage,
  getMaterialDetail,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  toggleMaterialStatus,
  exportMaterial,
  type MaterialQuery,
  type MaterialResult,
} from '#/api/sys/material';
