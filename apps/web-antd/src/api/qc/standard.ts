import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 质量标准 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/qc/standard/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/qc/standard/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/qc/standard', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/qc/standard', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/qc/standard/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/qc/standard/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/qc/standard/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
