import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 售后退货入库 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/inbound/return/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/inbound/return/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/inbound/return', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/inbound/return', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/inbound/return/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/inbound/return/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/inbound/return/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
