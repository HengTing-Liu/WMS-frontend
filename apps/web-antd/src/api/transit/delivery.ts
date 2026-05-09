import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 中转仓送货 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/transit/delivery/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/transit/delivery/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/transit/delivery', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/transit/delivery', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/transit/delivery/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/transit/delivery/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/transit/delivery/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
