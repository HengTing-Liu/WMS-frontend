import { requestClient, baseRequestClient } from '#/api/request';

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
  return requestClient.put<any>(`/api/base/warehouse/${data.id}`, data);
}

/**
 * 仓库档案 - 删除
 */
export async function deleteWarehouseApi(id: number) {
  return requestClient.delete<any>(`/api/base/warehouse/${id}`);
}

/**
 * 仓库档案 - 获取公司下拉列表
 */
export async function getWarehouseCompanyListApi() {
  return requestClient.get<any>('/api/base/warehouse/companyList');
}

/**
 * 仓库档案 - 导出（使用 fetch 避免拦截器干扰 blob）
 */
export async function exportWarehouseApi(params?: any) {
  const token = localStorage.getItem('access_token') || '';
  const response = await fetch(`/api/base/warehouse/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `导出失败: ${response.status}`);
  }

  return response.blob();
}

// ==================== 仓库收货地址 API ====================

/**
 * 仓库收货地址 - 获取列表
 */
export async function getWarehouseReceiverListApi(warehouseCode: string) {
  return requestClient.get<any>('/api/base/warehouse/receiver/list', {
    params: { warehouseCode },
  });
}

/**
 * 仓库收货地址 - 新增
 */
export async function addWarehouseReceiverApi(data: any) {
  return requestClient.post<any>('/api/base/warehouse/receiver', data);
}

/**
 * 仓库收货地址 - 修改
 */
export async function updateWarehouseReceiverApi(data: any) {
  return requestClient.put<any>(`/api/base/warehouse/receiver/${data.id}`, data);
}

/**
 * 仓库收货地址 - 删除
 */
export async function deleteWarehouseReceiverApi(id: number) {
  return requestClient.delete<any>(`/api/base/warehouse/receiver/${id}`);
}

/**
 * 仓库收货地址 - 设为默认
 */
export async function setWarehouseReceiverDefaultApi(id: number) {
  return requestClient.patch<any>(`/api/base/warehouse/receiver/${id}/default`);
}
