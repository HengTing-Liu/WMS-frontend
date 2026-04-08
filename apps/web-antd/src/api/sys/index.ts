export * from './location';
export * from './log';
export * from './material';
export * from './warehouse';
export * from './warehouse-receiver';
export * from './consignee';

import {
  listDictTypePage as _listDictTypePage,
  updateDictType as _updateDictType,
  deleteDictType as _deleteDictType,
  toggleDictTypeStatus as _toggleDictTypeStatus,
  exportDictType as _exportDictType,
  listDictDataPage as _listDictDataPage,
  updateDictData as _updateDictData,
  deleteDictData as _deleteDictData,
  toggleDictDataStatus as _toggleDictDataStatus,
  exportDictData as _exportDictData,
  listDictTypeSimple as _listDictTypeSimple,
  getDictDataDetail as _getDictDataDetail,
} from './dict';

export {
  _listDictTypePage as listDictTypePage,
  _updateDictType as updateDictType,
  _deleteDictType as deleteDictType,
  _toggleDictTypeStatus as toggleDictTypeStatus,
  _exportDictType as exportDictType,
  _listDictDataPage as listDictDataPage,
  _updateDictData as updateDictData,
  _deleteDictData as deleteDictData,
  _toggleDictDataStatus as toggleDictDataStatus,
  _exportDictData as exportDictData,
  _listDictTypeSimple as listDictTypeSimple,
  _getDictDataById as getDictDataById,
};