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
  remark?: string;
  createTime: string;
  createBy?: string;
  updateTime: string;
  updateBy?: string;
}

function unwrapData<T = any>(res: any): T {
  return (res?.data ?? res) as T;
}

function normalizeReceiver(item: Recordable<any>): WarehouseReceiverResult {
  return {
    id: Number(item.id ?? item.receiverId ?? 0),
    warehouseCode: String(item.warehouseCode ?? item.warehouse_code ?? ''),
    consignee: String(item.consignee ?? ''),
    phoneNumber: String(item.phoneNumber ?? item.phone_number ?? ''),
    country: String(item.country ?? '中国'),
    province: String(item.province ?? ''),
    city: String(item.city ?? ''),
    district: String(item.district ?? ''),
    detailedAddress: String(item.detailedAddress ?? item.detailed_address ?? ''),
    postalCode: (item.postalCode ?? item.postal_code ?? '') || undefined,
    isDefault: Number(item.isDefault ?? item.is_default ?? 0),
    remark: (item.remark ?? '') || undefined,
    createTime: String(item.createTime ?? item.create_time ?? ''),
    createBy: (item.createBy ?? item.create_by ?? '') || undefined,
    updateTime: String(item.updateTime ?? item.update_time ?? ''),
    updateBy: (item.updateBy ?? item.update_by ?? '') || undefined,
  };
}

function normalizePayload(data: Partial<WarehouseReceiverResult>) {
  return {
    warehouseCode: data.warehouseCode ?? '',
    consignee: data.consignee ?? '',
    phoneNumber: data.phoneNumber ?? '',
    country: data.country ?? '中国',
    province: data.province ?? '',
    city: data.city ?? '',
    district: data.district ?? '',
    detailedAddress: data.detailedAddress ?? '',
    postalCode: data.postalCode ?? '',
    isDefault: Number(data.isDefault ?? 0),
    remark: data.remark ?? '',
  };
}

// 查询收货地址列表
export async function getWarehouseReceiverList(
  params: WarehouseReceiverParams,
): Promise<WarehouseReceiverResult[]> {
  const res = await requestClient.get('/api/base/warehouse/receiver/list', {
    params,
  });
  const data = unwrapData<any>(res);
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.list)
      ? data.list
      : Array.isArray(data?.rows)
        ? data.rows
        : [];
  return list.map((item) => normalizeReceiver(item));
}

// 查询收货地址详情
export async function getWarehouseReceiverDetail(
  id: number,
): Promise<WarehouseReceiverResult | null> {
  const res = await requestClient.get(`/api/base/warehouse/receiver/${id}`);
  const data = unwrapData<Recordable<any> | null>(res);
  if (!data) return null;
  return normalizeReceiver(data);
}

// 新增收货地址
export function createWarehouseReceiver(data: Partial<WarehouseReceiverResult>) {
  return requestClient.post('/api/base/warehouse/receiver', normalizePayload(data));
}

// 编辑收货地址
export function updateWarehouseReceiver(
  id: number,
  data: Partial<WarehouseReceiverResult>,
) {
  return requestClient.put(
    `/api/base/warehouse/receiver/${id}`,
    normalizePayload(data),
  );
}

// 删除收货地址
export function deleteWarehouseReceiver(id: number) {
  return requestClient.delete(`/api/base/warehouse/receiver/${id}`);
}

// 设为默认地址
export function setDefaultWarehouseReceiver(id: number) {
  return requestClient.patch(`/api/base/warehouse/receiver/${id}/default`);
}
