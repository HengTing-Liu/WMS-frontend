import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 报关列表 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/foreign/customs/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/foreign/customs/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/foreign/customs', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/foreign/customs', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/foreign/customs/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/foreign/customs/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/foreign/customs/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
