import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 查询流水 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/query/flow/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/query/flow/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/query/flow', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/query/flow', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/query/flow/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/query/flow/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/query/flow/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
