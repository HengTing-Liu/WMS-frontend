import { requestClient } from '#/api/request';

/**
 * 库位档案 API
 */

// 查询列表
export function getLocationList(params: any) {
  return requestClient.get('/base/location/list', { params });
}

// 查询详情
export function getLocationDetail(id: string) {
  return requestClient.get(`/base/location/${id}`);
}

// 查询子库位
export function getLocationChildren(parentId: string) {
  return requestClient.get(`/base/location/children/${parentId}`);
}

// 查询树形列表
export function getLocationTree(params?: any) {
  return requestClient.get('/base/location/tree', { params });
}

// 新增
export function addLocation(data: any) {
  return requestClient.post('/base/location', data);
}
export const createLocation = addLocation;

// 修改
export function updateLocation(data: any) {
  return requestClient.put('/base/location', data);
}

// 删除
export function deleteLocation(id: string) {
  return requestClient.delete(`/base/location/${id}`);
}

// 导出
export function exportLocation(params: any) {
  return requestClient.download('/base/location/export', params);
}

// 批量创建容器
export function batchCreateContainers(data: any) {
  return requestClient.post('/base/location/batch', data);
}

// 更新网格配置
export function updateGridConfig(locationId: string, gridConfig: any[]) {
  return requestClient.put(`/base/location/${locationId}/grid`, { gridConfig });
}

// 导入
export function importLocation(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/base/location/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
