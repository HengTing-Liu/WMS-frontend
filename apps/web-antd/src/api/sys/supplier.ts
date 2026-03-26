import { requestClient } from '#/api/request';

export interface SupplierQuery {
  pageNum?: number;
  pageSize?: number;
  supplierCode?: string;
  supplierName?: string;
  contactPerson?: string;
  contactPhone?: string;
  isEnabled?: number;
}

export interface SupplierResult {
  id?: number;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  contactPhone?: string;
  email?: string;
  address?: string;
  isEnabled: number;
  remark?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

const SUPPLIER_API_PREFIX = '/base/supplier';

function normalizeSupplierRow(row: any): SupplierResult {
  return {
    ...row,
    id: row?.id,
    supplierCode: row?.supplier_code ?? row?.supplierCode,
    supplierName: row?.supplier_name ?? row?.supplierName,
    contactPerson: row?.contact_person ?? row?.contactPerson,
    contactPhone: row?.contact_phone ?? row?.contactPhone,
    email: row?.email,
    address: row?.address,
    isEnabled: Number(row?.is_enabled ?? row?.isEnabled ?? row?.status ?? 0),
    remark: row?.remark,
    createBy: row?.create_by ?? row?.createBy,
    createTime: row?.create_time ?? row?.createTime,
    updateBy: row?.update_by ?? row?.updateBy,
    updateTime: row?.update_time ?? row?.updateTime,
  } as SupplierResult;
}

export async function listSupplierPage(params: SupplierQuery) {
  const res = await requestClient.get(`${SUPPLIER_API_PREFIX}/list`, { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeSupplierRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

export async function getSupplierDetail(id: number): Promise<SupplierResult> {
  const res = await requestClient.get(`${SUPPLIER_API_PREFIX}/${id}`);
  const data = res?.data || res;
  return normalizeSupplierRow(data);
}

export async function createSupplier(data: Partial<SupplierResult>) {
  const {
    supplier_code,
    supplier_name,
    contact_person,
    contact_phone,
    email,
    address,
    is_enabled,
    create_by,
    create_time,
    update_by,
    update_time,
    ...rest
  } = data as any;
  return requestClient.post(SUPPLIER_API_PREFIX, { ...rest });
}

export async function updateSupplier(data: Partial<SupplierResult>) {
  const id = data.id;
  if (!id) {
    throw new Error('供应商ID不能为空');
  }
  const {
    supplier_code,
    supplier_name,
    contact_person,
    contact_phone,
    email,
    address,
    is_enabled,
    create_by,
    create_time,
    update_by,
    update_time,
    ...rest
  } = data as any;
  return requestClient.put(`${SUPPLIER_API_PREFIX}/${id}`, { ...rest });
}

export async function toggleSupplierStatus(id: number, enabled: number) {
  return requestClient.patch(`${SUPPLIER_API_PREFIX}/${id}/status`, null, {
    params: { enabled },
  });
}

export async function deleteSupplier(id: number) {
  return requestClient.delete(`${SUPPLIER_API_PREFIX}/${id}`);
}

export async function exportSupplier(params: SupplierQuery) {
  return requestClient.post(`${SUPPLIER_API_PREFIX}/export`, params, {
    responseType: 'blob',
  });
}
