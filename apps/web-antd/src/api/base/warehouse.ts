import { requestClient } from '#/api/request';

/**
 * 仓库档案 API - 标准接口
 * 接口路径: /base/warehouse/*
 */

/**
 * 仓库数据类型（标准接口）
 */
export interface WarehouseItem {
  id?: number | string;
  warehouseCode: string;
  warehouseName: string;
  company?: string;
  temperatureZone?: string;
  qualityZone?: string;
  isEnabled: number;
  remarks?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

/**
 * 列表查询参数
 */
export interface WarehouseListParams {
  pageNum?: number;
  pageSize?: number;
  warehouseCode?: string;
  warehouseName?: string;
  company?: string;
}

/**
 * 列表返回结果
 */
export interface WarehouseListResult {
  rows: WarehouseItem[];
  total: number;
}

/**
 * 通用响应结构
 */
export interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  data?: T;
}

/**
 * 查询仓库列表
 * @param params 查询参数
 */
export function getWarehouseList(params: WarehouseListParams) {
  return requestClient.get<WarehouseListResult>('/base/warehouse/list', { params });
}

/**
 * 获取仓库详情
 * @param id 仓库ID
 */
export function getWarehouseDetail(id: number | string) {
  return requestClient.get<WarehouseItem>(`/base/warehouse/${id}`);
}

/**
 * 新增仓库
 * @param data 仓库数据
 */
export function addWarehouse(data: Partial<WarehouseItem>) {
  return requestClient.post<WarehouseItem>('/base/warehouse', data);
}

/**
 * 更新仓库
 * @param data 仓库数据
 */
export function updateWarehouse(data: Partial<WarehouseItem>) {
  const id = data.id;
  return requestClient.put<WarehouseItem>(`/base/warehouse/${id}`, data);
}

/**
 * 删除仓库
 * @param id 仓库ID
 */
export function deleteWarehouse(id: number | string) {
  return requestClient.delete(`/base/warehouse/${id}`);
}

/**
 * 导出仓库
 * @param params 查询参数
 */
export function exportWarehouse(params?: WarehouseListParams) {
  return requestClient.download('/base/warehouse/export', params);
}

/**
 * 更新仓库状态
 * @param id 仓库ID
 * @param isEnabled 是否启用
 */
export function updateWarehouseStatus(id: number | string, isEnabled: number) {
  return requestClient.put(`/base/warehouse/${id}`, { isEnabled });
}
