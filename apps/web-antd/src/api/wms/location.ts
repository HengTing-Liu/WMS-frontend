import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 库位管理 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/wms/location/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/wms/location/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/wms/location', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/wms/location', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/wms/location/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/wms/location/export', params);
}

// 批量创建库位
export function batchCreate(data: any) {
  return requestClient.post('/wms/location/batch', data);
}

// 获取库位树
export function getTree(params?: Recordable<any>) {
  return requestClient.get('/wms/location/tree', { params });
}
