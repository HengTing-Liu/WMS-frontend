import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 库位管理 API（统一出口）
 */

// ========== 基础 CRUD ==========

export function getList(params?: Recordable<any>) {
  return requestClient.get('/api/wms/location/list', { params });
}

export function getDetail(id: string | number) {
  return requestClient.get(`/api/wms/location/${id}`);
}

export function add(data: any) {
  return requestClient.post('/api/wms/location', data);
}

export function update(data: any) {
  return requestClient.put('/api/wms/location/update', data);
}

export function remove(id: string | number) {
  return requestClient.delete(`/api/wms/location/${id}`);
}

// ========== 树形结构 ==========

/**
 * 库位树节点（完整类型）
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
  warehouseName?: string;
  warehouseLocation?: string;
  temperatureZone?: string;
  qualityZone?: string;
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

export interface LocationTreeQuery {
  warehouseCode?: string;
  rootId?: number;
  locationGrade?: string;
  locationType?: string;
  storageMode?: string;
  isUse?: number;
  maxLevel?: number;
}

export function getTree(params?: LocationTreeQuery) {
  return requestClient.get<LocationTreeNode[]>('/api/wms/location/tree', { params });
}

export function getChildren(parentId: number) {
  return requestClient.get<LocationTreeNode[]>(`/api/wms/location/children/${parentId}`);
}

// ========== 批量操作 ==========

export interface BatchCreateRequest {
  parentId?: number;
  warehouseCode?: string;
  locationGrade?: string;
  locationType: string;
  quantity: number;
  locationNamePrefix?: string;
  startSerialNo?: number;
  storageMode?: string;
  specification?: string;
  codeRule?: string;
  createChildren?: boolean;
  childrenQuantity?: number;
  childrenType?: string;
  remarks?: string;
}

export function batchCreate(data: BatchCreateRequest) {
  return requestClient.post('/api/wms/location/batch-create', data);
}

// ========== 层级批量创建 ==========

export interface LevelConfig {
  locationType: string;
  quantity: number;
  startSerialNo?: number;
}

export interface ContainerConfig {
  locationType: string;
  quantity: number;
  specification?: string;
  childrenQuantity?: number;
  childrenType?: string;
  locationName?: string;
}

export interface BatchCreateHierarchyRequest {
  parentId: number;
  warehouseCode: string;
  levels: LevelConfig[];
  container?: ContainerConfig;
}

export function batchCreateHierarchy(data: BatchCreateHierarchyRequest) {
  return requestClient.post('/api/wms/location/batch-create-hierarchy', data);
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

export function suggestCode(params: { warehouseCode: string; parentId?: number; locationType?: string }) {
  return requestClient.get<LocationCodeSuggestion>('/api/wms/location/suggestCode', { params });
}

// ========== 编辑相关 ==========

export interface LocationBindStatus {
  isBound: boolean;
  boundType?: string;
  boundMaterialName?: string;
}

export function checkBind(id: number) {
  return requestClient.get<LocationBindStatus>(`/api/wms/location/check-bind/${id}`);
}

export function updateLocationById(id: number, data: Record<string, any>) {
  return requestClient.put(`/api/wms/location/update`, { id, ...data });
}

// ========== 删除相关 ==========

export function deleteRecursive(id: number) {
  return requestClient.delete(`/api/wms/location/deleteRecursive/${id}`);
}

export function checkCanDelete(id: number) {
  return requestClient.get<{ canDelete: boolean; childCount: number; message?: string }>(`/api/wms/location/check-delete/${id}`);
}

// ========== 导入导出 ==========

export interface LocationImportResponse {
  successCount: number;
  failCount: number;
  errors: Array<{ row: number; message: string }>;
}

export function importLocation(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<LocationImportResponse>('/api/wms/location/importData', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function exportLocation(params?: Recordable<any>) {
  return requestClient.download('/api/wms/location/export', params, 'POST');
}

export function downloadTemplate() {
  return requestClient.download('/api/wms/location/downloadTemplate', {}, 'POST');
}

// ========== 分配仓库 ==========

export interface ContainerWarehouseInfo {
  containerId: number;
  containerName: string;
  containerNo: string;
  warehouseCode: string;
  warehouseName: string;
  temperatureZone: string;
  erpCompanyName?: string;
  warehouseType?: string;
  warehouseLocation?: string;
  qualityZone?: string;
  locationGrade?: string;
  locationFullpathName?: string;
  selected?: boolean;
}

export interface AvailableWarehouse {
  warehouseCode: string;
  warehouseName: string;
  warehouseType: string;
  temperatureZone: string;
  displayName: string;
}

export interface AssignWarehouseInitResponse {
  originalWarehouseCode: string;
  originalWarehouseName: string;
  originalTemperatureZone: string;
  originalWarehouseType?: string;
  originalErpCompanyName?: string;
  originalWarehouseLocation?: string;
  originalQualityZone?: string;
  originalEmployeeName?: string;
  originalStoredMaterial?: string;
  originalDeptNameFullPath?: string;
  containers: ContainerWarehouseInfo[];
  availableWarehouses: AvailableWarehouse[];
}

export interface AssignWarehouseRequest {
  locationId: number;
  containerIds: number[];
  targetWarehouseCode: string;
}

export function initAssignWarehouse(locationId: number, containerIds?: number[]) {
  return requestClient.get<AssignWarehouseInitResponse>('/api/wms/location/assign-warehouse/init', {
    params: { locationId, containerIds },
  });
}

export function assignWarehouse(data: AssignWarehouseRequest) {
  return requestClient.put('/api/wms/location/assign-warehouse', data);
}

// ========== 占用率统计 ==========

export interface OccupancyResponse {
  locationId: number;
  locationName: string;
  warehouseCode: string;
  capacityFree: number;
  occupancyRate: number;
  storageMode: string;
  locationLevel: number;
}

export function getOccupancy(locationId: number) {
  return requestClient.get<OccupancyResponse>(`/api/wms/location/occupancy/${locationId}`);
}
