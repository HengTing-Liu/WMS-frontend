import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 盘点单 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/adjust/count/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/adjust/count/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/adjust/count', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/adjust/count', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/adjust/count/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/adjust/count/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/adjust/count/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
