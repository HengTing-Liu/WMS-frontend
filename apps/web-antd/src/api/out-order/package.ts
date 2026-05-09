import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 包裹单 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/out-order/package/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/out-order/package/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/out-order/package', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/out-order/package', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/out-order/package/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/out-order/package/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/out-order/package/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
