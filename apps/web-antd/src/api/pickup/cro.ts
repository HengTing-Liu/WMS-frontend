import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * CRO提货单 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/pickup/cro/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/pickup/cro/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/pickup/cro', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/pickup/cro', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/pickup/cro/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/pickup/cro/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/pickup/cro/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
