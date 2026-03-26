/**
 * 库区管理 API
 * WMS0050 库区管理
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

// ========== API Functions ==========

/**
 * 分页查询库区列表
 */
export async function listStoragePage(params: StorageQuery) {
  const res = await requestClient.get('/base/storage/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeStorageRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

/**
 * 查询所有库区（不分页）
 */
export async function listStorageAll() {
  const res = await requestClient.get('/base/storage/listAll');
  const rawRows = res?.data || res?.rows || res?.list || [];
  return Array.isArray(rawRows) ? rawRows.map(normalizeStorageRow) : [];
}

/**
 * 查询库区详情
 */
export async function getStorageDetail(id: number): Promise<StorageResult> {
  const res = await requestClient.get(`/base/storage/${id}`);
  const data = res?.data || res;
  return normalizeStorageRow(data);
}

/**
 * 新增库区
 */
export async function createStorage(data: Partial<StorageResult>) {
  const { storage_code, storage_name, location_id, location_name, warehouse_id, warehouse_name,
          storage_type, capacity, is_enabled, create_by, create_time, update_by, update_time, ...rest } = data as any;
  return requestClient.post('/base/storage', { ...rest });
}

/**
 * 更新库区
 */
export async function updateStorage(data: Partial<StorageResult>) {
  const id = data.id;
  if (!id) throw new Error('库区ID不能为空');
  const { storage_code, storage_name, location_id, location_name, warehouse_id, warehouse_name,
          storage_type, capacity, is_enabled, create_by, create_time, update_by, update_time, ...rest } = data as any;
  return requestClient.put(`/base/storage/${id}`, { ...rest });
}

/**
 * 删除库区
 */
export async function deleteStorage(id: number) {
  return requestClient.delete(`/base/storage/${id}`);
}

/**
 * 切换库区状态
 */
export async function toggleStorageStatus(id: number, enabled: number) {
  return requestClient.patch(`/base/storage/${id}/status`, null, { params: { enabled } });
}

/**
 * 导出库区
 */
export async function exportStorage(params: StorageQuery) {
  return requestClient.post('/base/storage/export', params, { responseType: 'blob' });
}

/**
 * 库区下拉列表（用于筛选和弹框选择）
 */
export async function listLocationSimple(params?: { warehouseId?: number }) {
  const res = await requestClient.get('/base/location/list', { params: { pageNum: 1, pageSize: 999, ...params } });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return Array.isArray(rawRows) ? rawRows.map((r: any) => ({
    label: r.location_name ?? r.locationName ?? r.location_code ?? r.locationCode,
    value: r.id ?? r.locationId,
  })) : [];
}

/**
 * 仓库下拉列表
 */
export async function listWarehouseSimple() {
  const res = await requestClient.get('/base/warehouse/list', { params: { pageNum: 1, pageSize: 999 } });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return Array.isArray(rawRows) ? rawRows.map((r: any) => ({
    label: r.warehouse_name ?? r.warehouseName ?? r.warehouse_code ?? r.warehouseCode,
    value: r.id ?? r.warehouseId,
  })) : [];
}
