/**
 * 货位管理 API
 * WMS0060 货位管理 - 库区下的具体存放位置（货架/货位）
 */
import { requestClient } from '#/api/request';

// ========== Types ==========

export interface StorageQuery {
  pageNum?: number;
  pageSize?: number;
  storageCode?: string;
  storageName?: string;
  locationId?: number;
  warehouseId?: number;
  storageType?: string;
  isEnabled?: number;
}

export interface StorageResult {
  id?: number;
  storageCode: string;
  storageName: string;
  locationId?: number;
  locationName?: string;
  locationCode?: string;
  warehouseId?: number;
  warehouseName?: string;
  warehouseCode?: string;
  storageType?: string; // PLANE=平面, STEREO=立体, RACK=货架
  capacity?: number; // 容量
  isEnabled: number;
  remark?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

function normalizeStorageRow(row: any): StorageResult {
  return {
    ...row,
    id: row?.id,
    storageCode: row?.storage_code ?? row?.storageCode,
    storageName: row?.storage_name ?? row?.storageName,
    locationId: row?.location_id ?? row?.locationId,
    locationName: row?.location_name ?? row?.locationName,
    locationCode: row?.location_code ?? row?.locationCode,
    warehouseId: row?.warehouse_id ?? row?.warehouseId,
    warehouseName: row?.warehouse_name ?? row?.warehouseName,
    warehouseCode: row?.warehouse_code ?? row?.warehouseCode,
    storageType: row?.storage_type ?? row?.storageType,
    capacity: row?.capacity ?? 0,
    isEnabled: Number(row?.is_enabled ?? row?.isEnabled ?? row?.status ?? 0),
    remark: row?.remark,
    createBy: row?.create_by ?? row?.createBy,
    createTime: row?.create_time ?? row?.createTime,
    updateBy: row?.update_by ?? row?.updateBy,
    updateTime: row?.update_time ?? row?.updateTime,
  } as StorageResult;
}

// ========== Mock Data ==========

const MOCK_STORAGE_LIST: StorageResult[] = [
  { id: 1, storageCode: 'ST001', storageName: 'A区-01-01', locationName: 'A存储区', warehouseName: '华东仓', storageType: 'RACK', capacity: 100, isEnabled: 1, createTime: '2026-03-01 10:00:00' },
  { id: 2, storageCode: 'ST002', storageName: 'A区-01-02', locationName: 'A存储区', warehouseName: '华东仓', storageType: 'STEREO', capacity: 200, isEnabled: 1, createTime: '2026-03-01 10:05:00' },
  { id: 3, storageCode: 'ST003', storageName: 'B区-02-01', locationName: 'B拣货区', warehouseName: '华东仓', storageType: 'PLANE', capacity: 150, isEnabled: 0, createTime: '2026-03-02 09:00:00' },
  { id: 4, storageCode: 'ST004', storageName: 'C区-01-01', locationName: 'C存储区', warehouseName: '华南仓', storageType: 'RACK', capacity: 120, isEnabled: 1, createTime: '2026-03-02 14:30:00' },
  { id: 5, storageCode: 'ST005', storageName: 'C区-02-01', locationName: 'C存储区', warehouseName: '华南仓', storageType: 'STEREO', capacity: 80, isEnabled: 1, createTime: '2026-03-03 08:00:00' },
  { id: 6, storageCode: 'ST006', storageName: 'D区-01-01', locationName: 'D退货区', warehouseName: '华北仓', storageType: 'PLANE', capacity: 300, isEnabled: 1, createTime: '2026-03-03 16:00:00' },
  { id: 7, storageCode: 'ST007', storageName: 'D区-02-01', locationName: 'D退货区', warehouseName: '华北仓', storageType: 'RACK', capacity: 90, isEnabled: 0, createTime: '2026-03-04 11:00:00' },
  { id: 8, storageCode: 'ST008', storageName: 'E区-01-01', locationName: 'E集货区', warehouseName: '华中仓', storageType: 'PLANE', capacity: 250, isEnabled: 1, createTime: '2026-03-05 09:30:00' },
];

const MOCK_USE_MOCK = true; // 切换为 false 使用真实接口

// ========== API Functions ==========

export async function listStoragePage(params: StorageQuery) {
  if (MOCK_USE_MOCK) {
    // Mock 分页
    const { pageNum = 1, pageSize = 10, storageCode, storageName, locationId, warehouseId, storageType, isEnabled } = params ?? {};
    let filtered = [...MOCK_STORAGE_LIST];
    if (storageCode) filtered = filtered.filter((r) => r.storageCode!.toLowerCase().includes(storageCode.toLowerCase()));
    if (storageName) filtered = filtered.filter((r) => r.storageName!.toLowerCase().includes(storageName.toLowerCase()));
    if (locationId) filtered = filtered.filter((r) => r.locationId === locationId);
    if (warehouseId) filtered = filtered.filter((r) => r.warehouseId === warehouseId);
    if (storageType) filtered = filtered.filter((r) => r.storageType === storageType);
    if (isEnabled !== undefined) filtered = filtered.filter((r) => r.isEnabled === isEnabled);
    const total = filtered.length;
    const start = ((pageNum || 1) - 1) * (pageSize || 10);
    const rows = filtered.slice(start, start + (pageSize || 10));
    return { rows, total };
  }
  const res = await requestClient.get('/base/storage/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeStorageRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

export async function getStorageDetail(id: number): Promise<StorageResult> {
  if (MOCK_USE_MOCK) {
    const row = MOCK_STORAGE_LIST.find((r) => r.id === id);
    return row ? normalizeStorageRow(row) : normalizeStorageRow({});
  }
  const res = await requestClient.get(`/base/storage/${id}`);
  const data = res?.data || res;
  return normalizeStorageRow(data);
}

export async function createStorage(data: Partial<StorageResult>) {
  if (MOCK_USE_MOCK) {
    const newId = Math.max(...MOCK_STORAGE_LIST.map((r) => r.id ?? 0)) + 1;
    const newRow: StorageResult = { ...data, id: newId, createTime: new Date().toLocaleString() } as StorageResult;
    MOCK_STORAGE_LIST.unshift(newRow);
    return { code: 0, data: newRow };
  }
  const { storage_code, storage_name, location_id, location_name, warehouse_id, warehouse_name,
          storage_type, capacity, is_enabled, create_by, create_time, update_by, update_time, ...rest } = data as any;
  return requestClient.post('/base/storage', { ...rest });
}

export async function updateStorage(data: Partial<StorageResult>) {
  if (MOCK_USE_MOCK) {
    const idx = MOCK_STORAGE_LIST.findIndex((r) => r.id === data.id);
    if (idx >= 0) {
      Object.assign(MOCK_STORAGE_LIST[idx], data);
    }
    return { code: 0 };
  }
  const id = data.id;
  if (!id) throw new Error('货位ID不能为空');
  const { storage_code, storage_name, location_id, location_name, warehouse_id, warehouse_name,
          storage_type, capacity, is_enabled, create_by, create_time, update_by, update_time, ...rest } = data as any;
  return requestClient.put(`/base/storage/${id}`, { ...rest });
}

export async function toggleStorageStatus(id: number, enabled: number) {
  if (MOCK_USE_MOCK) {
    const row = MOCK_STORAGE_LIST.find((r) => r.id === id);
    if (row) row.isEnabled = enabled;
    return { code: 0 };
  }
  return requestClient.patch(`/base/storage/${id}/status`, null, { params: { enabled } });
}

export async function deleteStorage(id: number) {
  if (MOCK_USE_MOCK) {
    const idx = MOCK_STORAGE_LIST.findIndex((r) => r.id === id);
    if (idx >= 0) MOCK_STORAGE_LIST.splice(idx, 1);
    return { code: 0 };
  }
  return requestClient.delete(`/base/storage/${id}`);
}

export async function exportStorage(params: StorageQuery) {
  if (MOCK_USE_MOCK) {
    const { rows } = await listStoragePage({ ...params, pageNum: 1, pageSize: 9999 });
    const blob = new Blob([JSON.stringify(rows)], { type: 'application/json' });
    return blob;
  }
  return requestClient.post('/base/storage/export', params, { responseType: 'blob' });
}

// 库区下拉列表（用于筛选和弹框选择）
export async function listLocationSimple(params?: { warehouseId?: number }) {
  if (MOCK_USE_MOCK) {
    const mockLocations = [
      { id: 1, locationCode: 'LC001', locationName: 'A存储区', warehouseId: 1, warehouseName: '华东仓' },
      { id: 2, locationCode: 'LC002', locationName: 'B拣货区', warehouseId: 1, warehouseName: '华东仓' },
      { id: 3, locationCode: 'LC003', locationName: 'C存储区', warehouseId: 2, warehouseName: '华南仓' },
      { id: 4, locationCode: 'LC004', locationName: 'D退货区', warehouseId: 3, warehouseName: '华北仓' },
      { id: 5, locationCode: 'LC005', locationName: 'E集货区', warehouseId: 4, warehouseName: '华中仓' },
    ];
    let filtered = mockLocations;
    if (params?.warehouseId) {
      filtered = filtered.filter((r) => r.warehouseId === params.warehouseId);
    }
    return filtered.map((r) => ({
      label: `${r.locationName} (${r.locationCode})`,
      value: r.id,
    }));
  }
  const res = await requestClient.get('/base/location/list', { params: { pageNum: 1, pageSize: 999, ...params } });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return Array.isArray(rawRows) ? rawRows.map((r: any) => ({
    label: r.location_name ?? r.locationName ?? r.location_code ?? r.locationCode,
    value: r.id ?? r.locationId,
  })) : [];
}

// 仓库下拉列表
export async function listWarehouseSimple() {
  if (MOCK_USE_MOCK) {
    return [
      { label: '华东仓', value: 1 },
      { label: '华南仓', value: 2 },
      { label: '华北仓', value: 3 },
      { label: '华中仓', value: 4 },
    ];
  }
  const res = await requestClient.get('/base/warehouse/list', { params: { pageNum: 1, pageSize: 999 } });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return Array.isArray(rawRows) ? rawRows.map((r: any) => ({
    label: r.warehouse_name ?? r.warehouseName ?? r.warehouse_code ?? r.warehouseCode,
    value: r.id ?? r.warehouseId,
  })) : [];
}
