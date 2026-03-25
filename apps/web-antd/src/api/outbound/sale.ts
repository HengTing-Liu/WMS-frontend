import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 销售出库 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/outbound/sale/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/outbound/sale/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/outbound/sale', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/outbound/sale', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/outbound/sale/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/outbound/sale/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/outbound/sale/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
