import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 销售提货单 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/pickup/sale/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/pickup/sale/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/pickup/sale', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/pickup/sale', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/pickup/sale/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/pickup/sale/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/pickup/sale/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
