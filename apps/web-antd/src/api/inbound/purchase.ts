import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 采购入库 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/inbound/purchase/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/inbound/purchase/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/inbound/purchase', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/inbound/purchase', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/inbound/purchase/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/inbound/purchase/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/inbound/purchase/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
