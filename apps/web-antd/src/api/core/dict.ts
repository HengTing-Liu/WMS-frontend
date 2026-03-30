import { requestClient } from '#/api/request';

/**
 * 基础数据 - 获取列表
 */
export async function getDictListApi(params?: any) {
  return requestClient.get<any>('/api/base/dict/list', { params });
}

/**
 * 基础数据 - 新增
 */
export async function addDictApi(data: any) {
  return requestClient.post<any>('/api/base/dict', data);
}

/**
 * 基础数据 - 修改
 */
export async function updateDictApi(data: any) {
  return requestClient.post<any>('/api/base/dict', data);
}

/**
 * 基础数据 - 删除
 */
export async function deleteDictApi(id: number) {
  return requestClient.delete<any>(`/api/base/dict/${id}`);
}
