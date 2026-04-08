import { requestClient } from '#/api/request';

export interface CustomerQuery {
  pageNum?: number;
  pageSize?: number;
  customerCode?: string;
  customerName?: string;
  contact?: string;
  phone?: string;
  status?: number;
}

export interface CustomerResult {
  customerId?: number;
  customerCode?: string;
  customerName: string;
  contact?: string;
  phone?: string;
  address?: string;
  status: number;
  remark?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

function normalizeCustomerRow(row: any): CustomerResult {
  return {
    ...row,
    customerId: row?.customerId ?? row?.customer_id,
    customerCode: row?.customerCode ?? row?.customer_code,
    customerName: row?.customerName ?? row?.customer_name,
    contact: row?.contact,
    phone: row?.phone,
    address: row?.address,
    status: Number(row?.status ?? 1),
    remark: row?.remark,
    createBy: row?.createBy ?? row?.create_by,
    createTime: row?.createTime ?? row?.create_time,
    updateBy: row?.updateBy ?? row?.update_by,
    updateTime: row?.updateTime ?? row?.update_time,
  } as CustomerResult;
}

export async function listCustomerPage(params: CustomerQuery) {
  const res = await requestClient.get('/wms/customer/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeCustomerRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

export async function getCustomerById(id: number): Promise<CustomerResult> {
  const res = await requestClient.get(`/wms/customer/${id}`);
  return normalizeCustomerRow(res?.data || res);
}

export async function addCustomer(data: Partial<CustomerResult>) {
  return requestClient.post('/wms/customer', data);
}

export async function updateCustomer(data: Partial<CustomerResult>) {
  return requestClient.put(`/wms/customer/${data.customerId}`, data);
}

export async function deleteCustomer(id: number) {
  return requestClient.delete(`/wms/customer/${id}`);
}

export async function toggleCustomerStatus(id: number, enabled: number) {
  return requestClient.patch(`/wms/customer/${id}/status`, null, { params: { enabled } });
}

export async function exportCustomer(params: CustomerQuery) {
  return requestClient.post('/wms/customer/export', params, { responseType: 'blob' });
}