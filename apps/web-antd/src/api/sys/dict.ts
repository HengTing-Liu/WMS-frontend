import { requestClient } from '#/api/request';

/**
 * 基础数据 API
 */

// 查询列表
export function getDictList(params: any) {
  return requestClient.get('/base/dict/list', { params });
}

// 查询详情
export function getDictDetail(id: string) {
  return requestClient.get(`/base/dict/${id}`);
}

// 新增
export function addDict(data: any) {
  return requestClient.post('/base/dict', data);
}

// 修改
export function updateDict(data: any) {
  return requestClient.put('/base/dict', data);
}

// 删除
export function deleteDict(id: string) {
  return requestClient.delete(`/base/dict/${id}`);
}

// 导出
export function exportDict(params: any) {
  return requestClient.download('/base/dict/export', params);
}

// 导入
export function importDict(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/base/dict/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
