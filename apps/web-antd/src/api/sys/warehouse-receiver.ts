import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 仓库收货地址 API
 */

export interface WarehouseReceiverParams {
  warehouseCode?: string;
  pageSize?: number;
  pageNum?: number;
}

export interface WarehouseReceiverResult {
  id: number;
  warehouseCode: string;
  consignee: string;
  phoneNumber: string;
  country: string;
  province: string;
  city: string;
  district: string;
  detailedAddress: string;
  postalCode?: string;
  isDefault: number;
  createTime: string;
  createBy?: string;
  updateTime: string;
  updateBy?: string;
}

// 查询收货地址列表
export function getWarehouseReceiverList(params: WarehouseReceiverParams) {
  return requestClient.get('/base/warehouse/receiver/list', { params });
}

// 查询收货地址详情
export function getWarehouseReceiverDetail(id: number) {
  return requestClient.get(`/base/warehouse/receiver/${id}`);
}

// 新增收货地址
export function createWarehouseReceiver(data: Partial<WarehouseReceiverResult>) {
  return requestClient.post('/base/warehouse/receiver', data);
}

// 编辑收货地址
export function updateWarehouseReceiver(id: number, data: Partial<WarehouseReceiverResult>) {
  return requestClient.put(`/base/warehouse/receiver/${id}`, data);
}

// 删除收货地址
export function deleteWarehouseReceiver(id: number) {
  return requestClient.delete(`/base/warehouse/receiver/${id}`);
}

// 设为默认地址
export function setDefaultWarehouseReceiver(id: number) {
  return requestClient.patch(`/base/warehouse/receiver/${id}/default`);
}
