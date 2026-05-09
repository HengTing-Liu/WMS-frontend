import type { Recordable } from '@vben/types';
import { requestClient } from '#/api/request';

export interface StorageQuery {
  pageNum?: number;
  pageSize?: number;
  warehouseId?: number;
  locationId?: number;
  storageCode?: string;
  storageName?: string;
  status?: number;
}

export interface StorageResult {
  storageId?: number;
  warehouseId?: number;
  warehouseName?: string;
  locationId?: number;
  locationName?: string;
  storageCode: string;
  storageName: string;
  status: number;
  remarks?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

function normalizeStorageRow(row: any): StorageResult {
  return {
    ...row,
    storageId: row?.storageId ?? row?.storage_id,
    warehouseId: row?.warehouseId ?? row?.warehouse_id,
    warehouseName: row?.warehouseName ?? row?.warehouse_name,
    locationId: row?.locationId ?? row?.location_id,
    locationName: row?.locationName ?? row?.location_name,
    storageCode: row?.storageCode ?? row?.storage_code,
    storageName: row?.storageName ?? row?.storage_name,
    status: Number(row?.status ?? 1),
    remarks: row?.remarks,
    createBy: row?.createBy ?? row?.create_by,
    createTime: row?.createTime ?? row?.create_time,
    updateBy: row?.updateBy ?? row?.update_by,
    updateTime: row?.updateTime ?? row?.update_time,
  } as StorageResult;
}

export async function listStoragePage(params: StorageQuery) {
  const res = await requestClient.get('/wms/storage/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeStorageRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

export async function getStorageById(id: number): Promise<StorageResult> {
  const res = await requestClient.get(`/wms/storage/${id}`);
  return normalizeStorageRow(res?.data || res);
}

export async function addStorage(data: Partial<StorageResult>) {
  return requestClient.post('/wms/storage', data);
}

export async function updateStorage(data: Partial<StorageResult>) {
  return requestClient.put(`/wms/storage/${data.storageId}`, data);
}

export async function deleteStorage(id: number) {
  return requestClient.delete(`/wms/storage/${id}`);
}

export async function toggleStorageStatus(id: number, enabled: number) {
  return requestClient.patch(`/wms/storage/${id}/status`, null, { params: { enabled } });
}

export async function exportStorage(params: StorageQuery) {
  return requestClient.post('/wms/storage/export', params, { responseType: 'blob' });
}

export async function listLocationSimple(warehouseId?: number) {
  const res = await requestClient.get('/wms/location/simple', { params: { warehouseId } });
  return res?.data || res || [];
}