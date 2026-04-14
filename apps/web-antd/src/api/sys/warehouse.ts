import { requestClient } from '#/api/request';

export interface WarehouseQuery {
  pageNum?: number;
  pageSize?: number;
  warehouseType?: string;
  warehouseCode?: string;
  warehouseName?: string;
  erpCompanyCode?: string;
  isEnabled?: number;
}

export interface WarehouseResult {
  id?: number;
  warehouseType?: string;
  warehouseCode: string;
  warehouseLocation?: string;
  warehouseName: string;
  temperatureZone?: string;
  qualityZone?: string;
  employeeCode?: string;
  employeeName?: string;
  deptCode?: string;
  deptNameFullPath?: string;
  erpCompanyCode?: string;
  erpCompanyName?: string;
  erpWarehouseCode?: string;
  erpLocationCode?: string;
  isEnabled: number;
  remarks?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

function normalizeWarehouseRow(row: any): WarehouseResult {
  return {
    ...row,
    id: row?.id,
    warehouseType: row?.warehouse_type ?? row?.warehouseType,
    warehouseCode: row?.warehouse_code ?? row?.warehouseCode,
    warehouseLocation: row?.warehouse_location ?? row?.warehouseLocation,
    warehouseName: row?.warehouse_name ?? row?.warehouseName,
    temperatureZone: row?.temperature_zone ?? row?.temperatureZone,
    qualityZone: row?.quality_zone ?? row?.qualityZone,
    employeeCode: row?.employee_code ?? row?.employeeCode,
    employeeName: row?.employee_name ?? row?.employeeName,
    deptCode: row?.dept_code ?? row?.deptCode,
    deptNameFullPath: row?.dept_name_full_path ?? row?.deptNameFullPath,
    erpCompanyCode: row?.erp_company_code ?? row?.erpCompanyCode,
    erpCompanyName: row?.erp_company_name ?? row?.erpCompanyName,
    erpWarehouseCode: row?.erp_warehouse_code ?? row?.erpWarehouseCode,
    erpLocationCode: row?.erp_location_code ?? row?.erpLocationCode,
    isEnabled: Number(row?.is_enabled ?? row?.isEnabled ?? row?.status ?? 0),
    remarks: row?.remarks,
    createBy: row?.create_by ?? row?.createBy,
    createTime: row?.create_time ?? row?.createTime,
    updateBy: row?.update_by ?? row?.updateBy,
    updateTime: row?.update_time ?? row?.updateTime,
  } as WarehouseResult;
}

export async function listWarehousePage(params: WarehouseQuery) {
  const res = await requestClient.get('/base/warehouse/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeWarehouseRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

export async function getWarehouseDetail(id: number): Promise<WarehouseResult> {
  const res = await requestClient.get(`/base/warehouse/${id}`);
  const data = res?.data || res;
  return normalizeWarehouseRow(data);
}

export async function createWarehouse(data: Partial<WarehouseResult>) {
  // 移除 snake_case 字段，避免后端接收参数混乱
  const {
    warehouse_code, warehouse_name, warehouse_type, warehouse_location,
    temperature_zone, quality_zone, employee_code, employee_name,
    dept_code, dept_name_full_path, erp_company_code, erp_company_name,
    erp_warehouse_code, erp_location_code,
    is_enabled, create_by, create_time, update_by, update_time, ...rest
  } = data as any;
  return requestClient.post('/base/warehouse', { ...rest });
}

export async function updateWarehouse(data: Partial<WarehouseResult>) {
  const id = data.id;
  if (!id) {
    throw new Error('仓库ID不能为空');
  }
  const {
    warehouse_code, warehouse_name, warehouse_type, warehouse_location,
    temperature_zone, quality_zone, employee_code, employee_name,
    dept_code, dept_name_full_path, erp_company_code, erp_company_name,
    erp_warehouse_code, erp_location_code,
    is_enabled, create_by, create_time, update_by, update_time, ...rest
  } = data as any;
  return requestClient.put(`/base/warehouse/${id}`, { ...rest });
}

export async function toggleWarehouseStatus(id: number, enabled: number) {
  return requestClient.patch(`/base/warehouse/${id}/status`, null, { params: { enabled } });
}

export async function deleteWarehouse(id: number) {
  return requestClient.delete(`/base/warehouse/${id}`);
}

export async function exportWarehouse(params: WarehouseQuery) {
  return requestClient.post('/base/warehouse/export', params, {
    responseType: 'blob',
  });
}
