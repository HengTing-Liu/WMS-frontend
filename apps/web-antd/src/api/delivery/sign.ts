import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 配送签收 API
 */

// 查询列表
export function getList(params?: Recordable<any>) {
  return requestClient.get('/delivery/sign/list', { params });
}

// 查询详情
export function getDetail(id: string | number) {
  return requestClient.get(`/delivery/sign/${id}`);
}

// 新增
export function add(data: any) {
  return requestClient.post('/delivery/sign', data);
}

// 修改
export function update(data: any) {
  return requestClient.put('/delivery/sign', data);
}

// 删除
export function remove(id: string | number) {
  return requestClient.delete(`/delivery/sign/${id}`);
}

// 导出
export function exportData(params?: Recordable<any>) {
  return requestClient.download('/delivery/sign/export', params);
}

// 导入
export function importData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/delivery/sign/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
