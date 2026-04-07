/**
 * 瀛楀吀绠＄悊 API
 * WMS0070 瀛楀吀绠＄悊 - 绯荤粺瀛楀吀绫诲瀷鍜屽瓧鍏告暟鎹? */
import { requestClient } from '#/api/request';

// ========== 瀛楀吀绫诲瀷 Types ==========

export interface DictTypeQuery {
  pageNum?: number;
  pageSize?: number;
  dictCode?: string;
  dictName?: string;
  isEnabled?: number;
}

export interface DictTypeResult {
  id?: number;
  dictCode: string;
  dictName: string;
  dictType?: string; // system=绯荤粺瀛楀吀, custom=鑷畾涔?  isEnabled: number;
  remark?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

// ========== 瀛楀吀鏁版嵁 Types ==========

export interface DictDataQuery {
  pageNum?: number;
  pageSize?: number;
  dictType?: string; // 鎵€灞炵被鍨嬬紪鐮?  dictLabel?: string;
  dictValue?: string;
  isEnabled?: number;
}

export interface DictDataResult {
  id?: number;
  dictType?: string;   // 鎵€灞炵被鍨嬬紪鐮?  dictTypeName?: string; // 鎵€灞炵被鍨嬪悕绉?  dictCode?: string;  // 瀛楀吀缂栫爜锛堝悓 dictType锛?  dictLabel: string;  // 瀛楀吀鏍囩
  dictValue: string;  // 瀛楀吀鍊?  sortOrder?: number; // 鎺掑簭
  isEnabled: number;
  remark?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

function normalizeDictTypeRow(row: any): DictTypeResult {
  return {
    ...row,
    id: row?.id,
    dictCode: row?.dict_code ?? row?.dictCode,
    dictName: row?.dict_name ?? row?.dictName,
    dictType: row?.dict_type ?? row?.dictType,
    isEnabled: Number(row?.is_enabled ?? row?.isEnabled ?? row?.status ?? 0),
    remark: row?.remark,
    createBy: row?.create_by ?? row?.createBy,
    createTime: row?.create_time ?? row?.createTime,
    updateBy: row?.update_by ?? row?.updateBy,
    updateTime: row?.update_time ?? row?.updateTime,
  } as DictTypeResult;
}

function normalizeDictDataRow(row: any): DictDataResult {
  return {
    ...row,
    id: row?.id,
    dictType: row?.dict_type ?? row?.dictType,
    dictTypeName: row?.dict_type_name ?? row?.dictTypeName,
    dictCode: row?.dict_code ?? row?.dictCode,
    dictLabel: row?.dict_label ?? row?.dictLabel,
    dictValue: row?.dict_value ?? row?.dictValue,
    sortOrder: row?.sort_order ?? row?.sortOrder ?? 0,
    isEnabled: Number(row?.is_enabled ?? row?.isEnabled ?? row?.status ?? 0),
    remark: row?.remark,
    createBy: row?.create_by ?? row?.createBy,
    createTime: row?.create_time ?? row?.createTime,
    updateBy: row?.update_by ?? row?.updateBy,
    updateTime: row?.update_time ?? row?.updateTime,
  } as DictDataResult;
}

// ========== Mock Data ==========

const MOCK_DICT_TYPE_LIST: DictTypeResult[] = [
  { id: 1, dictCode: 'sys_user_sex', dictName: '用户性别', dictType: 'system', isEnabled: 1, remark: '系统内置', createTime: '2026-01-01 10:00:00' },
  { id: 2, dictCode: 'sys_yes_no', dictName: '是否', dictType: 'system', isEnabled: 1, remark: '通用是否标识', createTime: '2026-01-01 10:05:00' },
  { id: 3, dictCode: 'sys_normal_disable', dictName: '状态', dictType: 'system', isEnabled: 1, remark: '正常/停用状态', createTime: '2026-01-01 10:10:00' },
  { id: 4, dictCode: 'wms_order_type', dictName: '订单类型', dictType: 'custom', isEnabled: 1, remark: 'WMS订单类型', createTime: '2026-02-01 09:00:00' },
  { id: 5, dictCode: 'wms_goods_type', dictName: '货物类型', dictType: 'custom', isEnabled: 1, remark: '货物类型分类', createTime: '2026-02-01 09:30:00' },
  { id: 6, dictCode: 'wms_priority', dictName: '优先级', dictType: 'custom', isEnabled: 0, remark: '订单优先级', createTime: '2026-02-15 14:00:00' },
  { id: 7, dictCode: 'wms_zone_type', dictName: '库区类型', dictType: 'custom', isEnabled: 1, remark: '库区功能分类', createTime: '2026-03-01 08:00:00' },
  { id: 8, dictCode: 'wms_storage_type', dictName: '货位类型', dictType: 'custom', isEnabled: 1, remark: '货位存储类型', createTime: '2026-03-01 08:30:00' },
];

const MOCK_DICT_DATA_LIST: DictDataResult[] = [
  { id: 1, dictType: 'sys_user_sex', dictTypeName: '用户性别', dictLabel: '男', dictValue: '1', sortOrder: 1, isEnabled: 1, createTime: '2026-01-01 10:00:00' },
  { id: 2, dictType: 'sys_user_sex', dictTypeName: '用户性别', dictLabel: '女', dictValue: '2', sortOrder: 2, isEnabled: 1, createTime: '2026-01-01 10:00:00' },
  { id: 3, dictType: 'sys_user_sex', dictTypeName: '用户性别', dictLabel: '未知', dictValue: '0', sortOrder: 3, isEnabled: 1, createTime: '2026-01-01 10:00:00' },
  { id: 4, dictType: 'sys_yes_no', dictTypeName: '是否', dictLabel: '是', dictValue: 'Y', sortOrder: 1, isEnabled: 1, createTime: '2026-01-01 10:05:00' },
  { id: 5, dictType: 'sys_yes_no', dictTypeName: '是否', dictLabel: '否', dictValue: 'N', sortOrder: 2, isEnabled: 1, createTime: '2026-01-01 10:05:00' },
  { id: 6, dictType: 'sys_normal_disable', dictTypeName: '状态', dictLabel: '正常', dictValue: '1', sortOrder: 1, isEnabled: 1, createTime: '2026-01-01 10:10:00' },
  { id: 7, dictType: 'sys_normal_disable', dictTypeName: '状态', dictLabel: '停用', dictValue: '0', sortOrder: 2, isEnabled: 1, createTime: '2026-01-01 10:10:00' },
  { id: 8, dictType: 'wms_order_type', dictTypeName: '订单类型', dictLabel: '入库单', dictValue: 'IN', sortOrder: 1, isEnabled: 1, createTime: '2026-02-01 09:00:00' },
  { id: 9, dictType: 'wms_order_type', dictTypeName: '订单类型', dictLabel: '出库单', dictValue: 'OUT', sortOrder: 2, isEnabled: 1, createTime: '2026-02-01 09:00:00' },
  { id: 10, dictType: 'wms_order_type', dictTypeName: '订单类型', dictLabel: '调拨单', dictValue: 'TRANSFER', sortOrder: 3, isEnabled: 1, createTime: '2026-02-01 09:00:00' },
  { id: 11, dictType: 'wms_goods_type', dictTypeName: '货物类型', dictLabel: '普通货物', dictValue: 'NORMAL', sortOrder: 1, isEnabled: 1, createTime: '2026-02-01 09:30:00' },
  { id: 12, dictType: 'wms_goods_type', dictTypeName: '货物类型', dictLabel: '危险品', dictValue: 'DANGER', sortOrder: 2, isEnabled: 0, createTime: '2026-02-01 09:30:00' },
  { id: 13, dictType: 'wms_goods_type', dictTypeName: '货物类型', dictLabel: '易碎品', dictValue: 'FRAGILE', sortOrder: 3, isEnabled: 1, createTime: '2026-02-01 09:30:00' },
  { id: 14, dictType: 'wms_priority', dictTypeName: '优先级', dictLabel: '紧急', dictValue: 'URGENT', sortOrder: 1, isEnabled: 1, createTime: '2026-02-15 14:00:00' },
  { id: 15, dictType: 'wms_priority', dictTypeName: '优先级', dictLabel: '高', dictValue: 'HIGH', sortOrder: 2, isEnabled: 1, createTime: '2026-02-15 14:00:00' },
  { id: 16, dictType: 'wms_priority', dictTypeName: '优先级', dictLabel: '普通', dictValue: 'NORMAL', sortOrder: 3, isEnabled: 1, createTime: '2026-02-15 14:00:00' },
  { id: 17, dictType: 'wms_zone_type', dictTypeName: '库区类型', dictLabel: '存储区', dictValue: 'STORAGE', sortOrder: 1, isEnabled: 1, createTime: '2026-03-01 08:00:00' },
  { id: 18, dictType: 'wms_zone_type', dictTypeName: '库区类型', dictLabel: '拣货区', dictValue: 'PICK', sortOrder: 2, isEnabled: 1, createTime: '2026-03-01 08:00:00' },
  { id: 19, dictType: 'wms_zone_type', dictTypeName: '库区类型', dictLabel: '退货区', dictValue: 'RETURN', sortOrder: 3, isEnabled: 1, createTime: '2026-03-01 08:00:00' },
  { id: 20, dictType: 'wms_zone_type', dictTypeName: '库区类型', dictLabel: '集货区', dictValue: 'COLLECT', sortOrder: 4, isEnabled: 1, createTime: '2026-03-01 08:00:00' },
  { id: 21, dictType: 'wms_storage_type', dictTypeName: '货位类型', dictLabel: '平面', dictValue: 'PLANE', sortOrder: 1, isEnabled: 1, createTime: '2026-03-01 08:30:00' },
  { id: 22, dictType: 'wms_storage_type', dictTypeName: '货位类型', dictLabel: '立体', dictValue: 'STEREO', sortOrder: 2, isEnabled: 1, createTime: '2026-03-01 08:30:00' },
  { id: 23, dictType: 'wms_storage_type', dictTypeName: '货位类型', dictLabel: '货架', dictValue: 'RACK', sortOrder: 3, isEnabled: 1, createTime: '2026-03-01 08:30:00' },
];

const MOCK_USE_MOCK = false;

// ========== 瀛楀吀绫诲瀷 API ==========

export async function listDictTypePage(params: DictTypeQuery) {
  if (MOCK_USE_MOCK) {
    const { pageNum = 1, pageSize = 10, dictCode, dictName, isEnabled } = params ?? {};
    let filtered = [...MOCK_DICT_TYPE_LIST];
    if (dictCode) filtered = filtered.filter((r) => r.dictCode!.toLowerCase().includes(dictCode.toLowerCase()));
    if (dictName) filtered = filtered.filter((r) => r.dictName!.toLowerCase().includes(dictName.toLowerCase()));
    if (isEnabled !== undefined) filtered = filtered.filter((r) => r.isEnabled === isEnabled);
    const total = filtered.length;
    const start = ((pageNum || 1) - 1) * (pageSize || 10);
    const rows = filtered.slice(start, start + (pageSize || 10));
    return { rows, total };
  }
  const res = await requestClient.get('/sys/dict/type/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return { rows: Array.isArray(rawRows) ? rawRows.map(normalizeDictTypeRow) : [], total: Number(res?.total || res?.data?.total || 0) };
}

export async function getDictTypeDetail(id: number): Promise<DictTypeResult> {
  if (MOCK_USE_MOCK) {
    const row = MOCK_DICT_TYPE_LIST.find((r) => r.id === id);
    return row ? normalizeDictTypeRow(row) : normalizeDictTypeRow({});
  }
  const res = await requestClient.get(`/sys/dict/type/${id}`);
  return normalizeDictTypeRow(res?.data || res);
}

export async function createDictType(data: Partial<DictTypeResult>) {
  if (MOCK_USE_MOCK) {
    const newId = Math.max(...MOCK_DICT_TYPE_LIST.map((r) => r.id ?? 0)) + 1;
    const newRow: DictTypeResult = { ...data, id: newId, createTime: new Date().toLocaleString() } as DictTypeResult;
    MOCK_DICT_TYPE_LIST.unshift(newRow);
    return { code: 0, data: newRow };
  }
  return requestClient.post('/sys/dict/type', data);
}

export async function updateDictType(data: Partial<DictTypeResult>) {
  if (MOCK_USE_MOCK) {
    const idx = MOCK_DICT_TYPE_LIST.findIndex((r) => r.id === data.id);
    if (idx >= 0) Object.assign(MOCK_DICT_TYPE_LIST[idx], data);
    return { code: 0 };
  }
  const id = data.id;
  if (!id) throw new Error('瀛楀吀绫诲瀷ID涓嶈兘涓虹┖');
  return requestClient.put(`/sys/dict/type/${id}`, data);
}

export async function toggleDictTypeStatus(id: number, enabled: number) {
  if (MOCK_USE_MOCK) {
    const row = MOCK_DICT_TYPE_LIST.find((r) => r.id === id);
    if (row) row.isEnabled = enabled;
    return { code: 0 };
  }
  return requestClient.patch(`/sys/dict/type/${id}/status`, null, { params: { enabled } });
}

export async function deleteDictType(id: number) {
  if (MOCK_USE_MOCK) {
    const idx = MOCK_DICT_TYPE_LIST.findIndex((r) => r.id === id);
    if (idx >= 0) MOCK_DICT_TYPE_LIST.splice(idx, 1);
    return { code: 0 };
  }
  return requestClient.delete(`/sys/dict/type/${id}`);
}

export async function exportDictType(params: DictTypeQuery) {
  if (MOCK_USE_MOCK) {
    const { rows } = await listDictTypePage({ ...params, pageNum: 1, pageSize: 9999 });
    const blob = new Blob([JSON.stringify(rows)], { type: 'application/json' });
    return blob;
  }
  return requestClient.post('/sys/dict/type/export', params, { responseType: 'blob' });
}

// ========== 瀛楀吀鏁版嵁 API ==========

export async function listDictDataPage(params: DictDataQuery) {
  if (MOCK_USE_MOCK) {
    const { pageNum = 1, pageSize = 10, dictType, dictLabel, dictValue, isEnabled } = params ?? {};
    let filtered = [...MOCK_DICT_DATA_LIST];
    if (dictType) filtered = filtered.filter((r) => r.dictType === dictType);
    if (dictLabel) filtered = filtered.filter((r) => r.dictLabel!.toLowerCase().includes(dictLabel.toLowerCase()));
    if (dictValue) filtered = filtered.filter((r) => r.dictValue!.toLowerCase().includes(dictValue.toLowerCase()));
    if (isEnabled !== undefined) filtered = filtered.filter((r) => r.isEnabled === isEnabled);
    const total = filtered.length;
    const start = ((pageNum || 1) - 1) * (pageSize || 10);
    const rows = filtered.slice(start, start + (pageSize || 10));
    return { rows, total };
  }
  const res = await requestClient.get('/sys/dict/data/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return { rows: Array.isArray(rawRows) ? rawRows.map(normalizeDictDataRow) : [], total: Number(res?.total || res?.data?.total || 0) };
}

export async function getDictDataDetail(id: number): Promise<DictDataResult> {
  if (MOCK_USE_MOCK) {
    const row = MOCK_DICT_DATA_LIST.find((r) => r.id === id);
    return row ? normalizeDictDataRow(row) : normalizeDictDataRow({});
  }
  const res = await requestClient.get(`/sys/dict/data/${id}`);
  return normalizeDictDataRow(res?.data || res);
}

export async function createDictData(data: Partial<DictDataResult>) {
  if (MOCK_USE_MOCK) {
    const newId = Math.max(...MOCK_DICT_DATA_LIST.map((r) => r.id ?? 0)) + 1;
    const newRow: DictDataResult = { ...data, id: newId, createTime: new Date().toLocaleString() } as DictDataResult;
    MOCK_DICT_DATA_LIST.unshift(newRow);
    return { code: 0, data: newRow };
  }
  return requestClient.post('/sys/dict/data', data);
}

export async function updateDictData(data: Partial<DictDataResult>) {
  if (MOCK_USE_MOCK) {
    const idx = MOCK_DICT_DATA_LIST.findIndex((r) => r.id === data.id);
    if (idx >= 0) Object.assign(MOCK_DICT_DATA_LIST[idx], data);
    return { code: 0 };
  }
  const id = data.id;
  if (!id) throw new Error('瀛楀吀鏁版嵁ID涓嶈兘涓虹┖');
  return requestClient.put(`/sys/dict/data/${id}`, data);
}

export async function toggleDictDataStatus(id: number, enabled: number) {
  if (MOCK_USE_MOCK) {
    const row = MOCK_DICT_DATA_LIST.find((r) => r.id === id);
    if (row) row.isEnabled = enabled;
    return { code: 0 };
  }
  return requestClient.patch(`/sys/dict/data/${id}/status`, null, { params: { enabled } });
}

export async function deleteDictData(id: number) {
  if (MOCK_USE_MOCK) {
    const idx = MOCK_DICT_DATA_LIST.findIndex((r) => r.id === id);
    if (idx >= 0) MOCK_DICT_DATA_LIST.splice(idx, 1);
    return { code: 0 };
  }
  return requestClient.delete(`/sys/dict/data/${id}`);
}

export async function exportDictData(params: DictDataQuery) {
  if (MOCK_USE_MOCK) {
    const { rows } = await listDictDataPage({ ...params, pageNum: 1, pageSize: 9999 });
    const blob = new Blob([JSON.stringify(rows)], { type: 'application/json' });
    return blob;
  }
  return requestClient.post('/sys/dict/data/export', params, { responseType: 'blob' });
}

// 鑾峰彇鎵€鏈夊瓧鍏哥被鍨嬶紙涓嬫媺鍒楄〃鐢級
export async function listDictTypeSimple() {
  if (MOCK_USE_MOCK) {
    return MOCK_DICT_TYPE_LIST.map((r) => ({
      label: `${r.dictName} (${r.dictCode})`,
      value: r.dictCode,
    }));
  }
  const res = await requestClient.get('/sys/dict/type/list', { params: { pageNum: 1, pageSize: 999, isEnabled: 1 } });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return Array.isArray(rawRows) ? rawRows.map((r: any) => ({
    label: `${r.dict_name ?? r.dictName} (${r.dict_code ?? r.dictCode})`,
    value: r.dict_code ?? r.dictCode,
  })) : [];
}

