import { requestClient } from '#/api/request';

/**
 * 仓库档案 - 获取列表
 */
export async function getWarehouseListApi(params?: any) {
  return requestClient.get<any>('/api/base/warehouse/list', { params });
}

/**
 * 仓库档案 - 新增
 */
export async function addWarehouseApi(data: any) {
  return requestClient.post<any>('/api/base/warehouse', data);
}

/**
 * 仓库档案 - 修改
 */
export async function updateWarehouseApi(data: any) {
  return requestClient.post<any>('/api/base/warehouse', data);
}

/**
 * 仓库档案 - 删除
 */
export async function deleteWarehouseApi(id: number) {
  return requestClient.delete<any>(`/api/base/warehouse/${id}`);
}
