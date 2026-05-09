import { requestClient } from '#/api/request';

/**
 * 库位档案 - 获取列表
 */
export async function getLocationListApi(params?: any) {
  return requestClient.get<any>('/api/base/location/list', { params });
}

/**
 * 库位档案 - 新增
 */
export async function addLocationApi(data: any) {
  return requestClient.post<any>('/api/base/location', data);
}

/**
 * 库位档案 - 修改
 */
export async function updateLocationApi(data: any) {
  return requestClient.post<any>('/api/base/location', data);
}

/**
 * 库位档案 - 删除
 */
export async function deleteLocationApi(id: number) {
  return requestClient.delete<any>(`/api/base/location/${id}`);
}
