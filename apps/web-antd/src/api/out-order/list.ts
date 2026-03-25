import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 出库单 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/out-order/list/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/out-order/list/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/out-order/list', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/out-order/list', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/out-order/list/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/out-order/list/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/out-order/list/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
