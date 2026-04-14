import { requestClient } from '#/api/request';

export interface MaterialQuery {
  pageNum?: number;
  pageSize?: number;
  materialCode?: string;
  materialName?: string;
  specification?: string;
  unit?: string;
  category?: string;
  isEnabled?: number;
}

export interface MaterialResult {
  id?: number;
  materialCode: string;
  materialName: string;
  specification?: string;
  unit?: string;
  category?: string;
  isEnabled: number;
  remarks?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

function normalizeMaterialRow(row: any): MaterialResult {
  return {
    ...row,
    id: row?.id,
    materialCode: row?.material_code ?? row?.materialCode,
    materialName: row?.material_name ?? row?.materialName,
    specification: row?.spec ?? row?.specification,
    unit: row?.unit,
    category: row?.category,
    isEnabled: Number(row?.is_enabled ?? row?.isEnabled ?? row?.status ?? 1),
    remarks: row?.remarks,
    createBy: row?.create_by ?? row?.createBy,
    createTime: row?.create_time ?? row?.createTime,
    updateBy: row?.update_by ?? row?.updateBy,
    updateTime: row?.update_time ?? row?.updateTime,
  } as MaterialResult;
}

export async function listMaterialPage(params: MaterialQuery) {
  const res = await requestClient.get('/api/base/material/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeMaterialRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

export async function getMaterialDetail(id: number): Promise<MaterialResult> {
  const res = await requestClient.get(`/api/base/material/${id}`);
  const data = res?.data || res;
  return normalizeMaterialRow(data);
}

export async function createMaterial(data: Partial<MaterialResult>) {
  return requestClient.post('/api/base/material', data);
}

export async function updateMaterial(data: Partial<MaterialResult>) {
  const id = data.id;
  if (!id) {
    throw new Error('物料ID不能为空');
  }
  return requestClient.put(`/api/base/material/${id}`, data);
}

export async function toggleMaterialStatus(id: number, enabled: number) {
  return requestClient.patch(`/api/base/material/${id}/status`, null, {
    params: { enabled },
  });
}

export async function deleteMaterial(id: number) {
  return requestClient.delete(`/api/base/material/${id}`);
}

export async function exportMaterial(params: MaterialQuery) {
  return requestClient.post('/api/base/material/export', params, {
    responseType: 'blob',
  });
}
