/**
 * 字典管理 API (WMS 模块)
 * 暂用 sys 模块 API，后续可替换为 wms 专用接口
 */
export {
  listDictTypePage,
  listDictDataPage,
  listDictTypeSimple,
  getDictTypeById,
  getDictDataById,
  addDictType,
  updateDictType,
  deleteDictType,
  toggleDictTypeStatus,
  addDictData,
  updateDictData,
  deleteDictData,
  toggleDictDataStatus,
  exportDictType,
  exportDictData,
  type DictTypeQuery,
  type DictTypeResult,
  type DictDataQuery,
  type DictDataResult,
} from '#/api/sys/dict';
