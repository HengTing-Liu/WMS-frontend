import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 领用出库 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/outbound/use/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/outbound/use/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/outbound/use', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/outbound/use', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/outbound/use/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/outbound/use/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/outbound/use/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
