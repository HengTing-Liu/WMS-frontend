import { requestClient } from '#/api/request';
import type { LocationTreeNode, LocationTreeQuery } from '#/api/wms/location';
import { listWarehouseSimple } from '#/api/sys/storage';

// 重新导出仓库接口
export { listWarehouseSimple };

/**
 * 库位档案 API（废弃：旧版 /base/location 接口，请使用 wms/location.ts）
 * 本文件仅保留向后兼容，新代码请直接使用 #/api/wms/location
 */

// ========== 废弃函数（请勿使用） ==========

// 查询列表（旧版）
export function getLocationList(params: any) {
  console.warn('Deprecated: 请使用 getList from #/api/wms/location');
  return requestClient.get('/base/location/list', { params });
}

// 查询详情（旧版）
export function getLocationDetail(id: string) {
  console.warn('Deprecated: 请使用 getDetail from #/api/wms/location');
  return requestClient.get(`/base/location/${id}`);
}

// 新增（旧版）
export function addLocation(data: any) {
  console.warn('Deprecated: 请使用 add from #/api/wms/location');
  return requestClient.post('/base/location', data);
}

// 修改（旧版）
export function updateLocation(data: any) {
  console.warn('Deprecated: 请使用 update from #/api/wms/location');
  return requestClient.put('/base/location', data);
}

// 删除（旧版）
export function deleteLocation(id: string) {
  console.warn('Deprecated: 请使用 remove from #/api/wms/location');
  return requestClient.delete(`/base/location/${id}`);
}

// 导出（旧版）
export function exportLocation(params: any) {
  console.warn('Deprecated: 请使用 exportLocation from #/api/wms/location');
  return requestClient.download('/base/location/export', params);
}

// 批量创建容器（旧版）
export function batchCreateContainers(data: any) {
  console.warn('Deprecated: 请使用 batchCreate from #/api/wms/location');
  return requestClient.post('/base/location/batch', data);
}

// 更新网格配置（旧版）
export function updateGridConfig(locationId: string, gridConfig: any[]) {
  console.warn('Deprecated: 请使用 updateGridConfig from #/api/wms/location');
  return requestClient.put(`/base/location/${locationId}/grid`, { gridConfig });
}

// 导入（旧版）
export function importLocation(file: File) {
  console.warn('Deprecated: 请使用 importLocation from #/api/wms/location');
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/base/location/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ========== Story 15-05: 编辑库位 API (已迁移到 wms/location.ts) ==========

/** 查询库位占用状态（用于判断是否可编辑） */
export interface LocationBindStatus {
  isBound: boolean;
  boundType?: string;
  boundMaterialName?: string;
}

export async function checkLocationBind(id: number): Promise<LocationBindStatus> {
  const res = await requestClient.get<LocationBindStatus>(`/wms/location/check-bind/${id}`);
  return res?.data || res || { isBound: false };
}

/** 更新库位（部分更新） */
export async function updateLocationById(id: number, data: Record<string, any>) {
  return requestClient.put(`/wms/location/update`, { id, ...data });
}

// ========== Story 15-06: 删除库位 API ==========

/** 级联删除库位（及其下级所有库位） */
export async function deleteLocationRecursive(id: number) {
  return requestClient.delete(`/wms/location/deleteRecursive/${id}`);
}

/** 检查库位是否可以删除 */
export async function checkLocationCanDelete(id: number): Promise<{
  canDelete: boolean;
  childCount: number;
  message?: string;
}> {
  const res = await requestClient.get<any>(`/wms/location/check-delete/${id}`);
  return res?.data || { canDelete: true, childCount: 0 };
}

// ========== Story 15-03/04: 批量创建 API ==========

export interface BatchCreateRequest {
  warehouseCode?: string;
  parentId?: number;
  locationType: string;
  locationGrade?: string;
  quantity: number;
  storageMode?: string;
  specification?: string;
  codeRule?: string;
  prefix?: string;
  startSerial?: number;
  locationNamePrefix?: string;
  startSerialNo?: number;
  createChildren?: boolean;
  childrenQuantity?: number;
  childrenType?: string;
  remarks?: string;
}

export async function batchCreateLocation(data: BatchCreateRequest) {
  return requestClient.post('/wms/location/batch-create', data);
}

export interface LocationCodeSuggestion {
  suggestedCode: string;
  currentMaxSerial: number;
  nextSerial: number;
  parentCode: string;
  parentId?: number;
  currentLevel: number;
  codePrefix: string;
  serialLength: number;
  fullPath: string;
}

export async function suggestLocationCode(params: {
  warehouseCode: string;
  parentId?: number;
  locationType?: string;
}): Promise<LocationCodeSuggestion> {
  const res = await requestClient.get<LocationCodeSuggestion>('/wms/location/suggestCode', { params });
  return res?.data || res;
}

// ========== 统一类型定义（供 views/location 使用） ==========

/**
 * 库位树节点（统一类型）
 */
export interface LocationTreeNode {
  id: number;
  parentId?: number;
  locationGrade?: string;
  locationType: string;
  locationLevel: number;
  locationLevelCount?: number;
  internalSerialNo?: number;
  internalQuantity?: number;
  locationName: string;
  warehouseCode?: string;
  parentName?: string;
  storageMode?: string;
  specification?: string;
  isUse?: number;
  locationSortNo?: string;
  locationFullpathName?: string;
  occupancyRate?: number;
  remarks?: string;
  children?: LocationTreeNode[];
  hasChildren?: boolean;
}

/**
 * 树查询参数
 */
export interface LocationTreeQuery {
  warehouseCode?: string;
  rootId?: number;
  locationGrade?: string;
  locationType?: string;
  storageMode?: string;
  isUse?: number;
  maxLevel?: number;
}

// 重新导出WMS类型，避免重复定义
export type Container = LocationTreeNode;
export type LocationApi = {
  Container: LocationTreeNode;
};

// ========== 缺少的函数 ==========

// 查询库位树
export async function getLocationTree(params: LocationTreeQuery) {
  const res = await requestClient.get<LocationTreeNode[]>('/wms/location/tree', { params });
  return res?.data || res || [];
}

// 查询子节点
export async function getLocationChildren(parentId: number) {
  const res = await requestClient.get<LocationTreeNode[]>(`/wms/location/children/${parentId}`);
  return res?.data || res || [];
}

// 查询库位列表（分页）
export async function listLocationPage(params: any) {
  return requestClient.get('/wms/location/list', { params });
}

// 创建库位（带父节点）
export async function createLocationWithParent(data: any) {
  return requestClient.post('/wms/location/add', data);
}

// 删除库位
export async function deleteLocationById(id: number) {
  return requestClient.delete(`/wms/location/${id}`);
}
