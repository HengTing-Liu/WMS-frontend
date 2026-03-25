import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 生产入库 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/inbound/production/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/inbound/production/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/inbound/production', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/inbound/production', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/inbound/production/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/inbound/production/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/inbound/production/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
