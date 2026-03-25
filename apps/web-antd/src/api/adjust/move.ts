import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 库位调整 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/adjust/move/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/adjust/move/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/adjust/move', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/adjust/move', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/adjust/move/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/adjust/move/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/adjust/move/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
