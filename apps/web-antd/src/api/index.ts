export * from './core';
export * from './basicArchive';
export * from './sys';
export * from './system';

// system/dictType 的字典函数（与 sys/dict 有同名冲突，在 index.ts 顶层显式重导出）
import {
  getDictTypeList,
  addDictType,
  getDictTypeDetail,
  editDictType,
  deleteDictType,
  exportDictType,
  refreshDictCache,
  getDictDataList,
  getDictDataDetail,
  addDictData,
  editDictData,
  deleteDictData,
  changeDictDataStatus,
} from './system/dictType';

export {
  getDictTypeList,
  addDictType,
  getDictTypeDetail,
  editDictType,
  deleteDictType,
  exportDictType,
  refreshDictCache,
  getDictDataList,
  getDictDataDetail,
  addDictData,
  editDictData,
  deleteDictData,
  changeDictDataStatus,
};