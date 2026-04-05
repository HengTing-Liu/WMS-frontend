import { requestClient } from '#/api/request';

/**
 * 库位档案 API
 */

// ========== 原有函数（供 src/views/location 使用） ==========

// 查询列表
export function getLocationList(params: any) {
  return requestClient.get('/base/location/list', { params });
}

// 查询详情
export function getLocationDetail(id: string) {
  return requestClient.get(`/base/location/${id}`);
}

// 查询子库位
export function getLocationChildren(parentId: string) {
  return requestClient.get(`/base/location/children/${parentId}`);
}

// 查询树形列表
export function getLocationTree(params?: any) {
  return requestClient.get('/base/location/tree', { params });
}

// 新增
export function addLocation(data: any) {
  return requestClient.post('/base/location', data);
}

// 修改
export function updateLocation(data: any) {
  return requestClient.put('/base/location', data);
}

// 删除
export function deleteLocation(id: string) {
  return requestClient.delete(`/base/location/${id}`);
}

// 导出
export function exportLocation(params: any) {
  return requestClient.download('/base/location/export', params);
}

// 批量创建容器
export function batchCreateContainers(data: any) {
  return requestClient.post('/base/location/batch', data);
}

// 更新网格配置
export function updateGridConfig(locationId: string, gridConfig: any[]) {
  return requestClient.put(`/base/location/${locationId}/grid`, { gridConfig });
}

// 导入
export function importLocation(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/base/location/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// ========== 新函数（供 src/views/sys/location 使用） ==========

export interface LocationQuery {
  pageNum?: number;
  pageSize?: number;
  locationCode?: string;
  locationName?: string;
  warehouseId?: number;
  locationType?: string;
  isEnabled?: number;
}

export interface LocationResult {
  id?: number;
  locationCode: string;
  locationName: string;
  warehouseId?: number;
  warehouseName?: string;
  warehouseCode?: string;
  locationType?: string;
  isEnabled: number;
  remark?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

function normalizeLocationRow(row: any): LocationResult {
  return {
    ...row,
    id: row?.id,
    locationCode: row?.location_code ?? row?.locationCode,
    locationName: row?.location_name ?? row?.locationName,
    warehouseId: row?.warehouse_id ?? row?.warehouseId,
    warehouseName: row?.warehouse_name ?? row?.warehouseName,
    warehouseCode: row?.warehouse_code ?? row?.warehouseCode,
    locationType: row?.location_type ?? row?.locationType,
    isEnabled: Number(row?.is_enabled ?? row?.isEnabled ?? row?.status ?? 0),
    remark: row?.remark,
    createBy: row?.create_by ?? row?.createBy,
    createTime: row?.create_time ?? row?.createTime,
    updateBy: row?.update_by ?? row?.updateBy,
    updateTime: row?.update_time ?? row?.updateTime,
  } as LocationResult;
}

export async function listLocationPage(params: LocationQuery) {
  const res = await requestClient.get('/base/location/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeLocationRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

export async function getLocationDetailById(id: number): Promise<LocationResult> {
  const res = await requestClient.get(`/base/location/${id}`);
  const data = res?.data || res;
  return normalizeLocationRow(data);
}

export async function createLocation(data: Partial<LocationResult>) {
  const { location_code, location_name, warehouse_id, warehouse_name, warehouse_code,
          location_type, is_enabled, create_by, create_time, update_by, update_time, ...rest } = data as any;
  return requestClient.post('/base/location', { ...rest });
}

// updateLocation already exists above (legacy), reuse via overload

export async function toggleLocationStatus(id: number, enabled: number) {
  return requestClient.patch(`/base/location/${id}/status`, null, { params: { enabled } });
}

// deleteLocation already exists above (legacy)

// exportLocation already exists above (legacy)

// 仓库下拉列表
export async function listWarehouseSimple() {
  const res = await requestClient.get('/base/warehouse/list', { params: { pageNum: 1, pageSize: 999 } });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return Array.isArray(rawRows) ? rawRows.map((r: any) => ({
    label: r.warehouse_name ?? r.warehouseName ?? r.warehouse_code ?? r.warehouseCode,
    value: r.id ?? r.warehouseId,
  })) : [];
}
