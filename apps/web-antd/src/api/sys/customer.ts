import { requestClient } from '#/api/request';

export interface CustomerQuery {
  pageNum?: number;
  pageSize?: number;
  customerCode?: string;
  customerName?: string;
  contactPerson?: string;
  contactPhone?: string;
  mobile?: string;
  isEnabled?: number;
}

export interface CustomerResult {
  id?: number;
  customerCode: string;
  customerName: string;
  contactPerson?: string;
  contactPhone?: string;
  mobile?: string;
  email?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  isEnabled: number;
  remark?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

function normalizeCustomerRow(row: any): CustomerResult {
  return {
    ...row,
    id: row?.id,
    customerCode: row?.customer_code ?? row?.customerCode,
    customerName: row?.customer_name ?? row?.customerName,
    contactPerson: row?.contact_person ?? row?.contactPerson,
    contactPhone: row?.contact_phone ?? row?.contactPhone,
    mobile: row?.mobile,
    email: row?.email,
    province: row?.province,
    city: row?.city,
    district: row?.district,
    address: row?.address,
    isEnabled: Number(row?.is_enabled ?? row?.isEnabled ?? row?.status ?? 0),
    remark: row?.remark,
    createBy: row?.create_by ?? row?.createBy,
    createTime: row?.create_time ?? row?.createTime,
    updateBy: row?.update_by ?? row?.updateBy,
    updateTime: row?.update_time ?? row?.updateTime,
  } as CustomerResult;
}

export async function listCustomerPage(params: CustomerQuery) {
  const res = await requestClient.get('/base/customer/list', { params });
  const rawRows = res?.rows || res?.list || res?.data?.rows || res?.data?.list || [];
  return {
    rows: Array.isArray(rawRows) ? rawRows.map(normalizeCustomerRow) : [],
    total: Number(res?.total || res?.data?.total || 0),
  };
}

export async function getCustomerDetail(id: number): Promise<CustomerResult> {
  const res = await requestClient.get(`/base/customer/${id}`);
  const data = res?.data || res;
  return normalizeCustomerRow(data);
}

export async function createCustomer(data: Partial<CustomerResult>) {
  const { customer_code, customer_name, contact_person, contact_phone,
          mobile, email, province, city, district, address,
          is_enabled, remark, create_by, create_time, update_by, update_time, ...rest } = data as any;
  return requestClient.post('/base/customer', { ...rest });
}

export async function updateCustomer(data: Partial<CustomerResult>) {
  const id = data.id;
  if (!id) {
    throw new Error('客户ID不能为空');
  }
  const { customer_code, customer_name, contact_person, contact_phone,
          mobile, email, province, city, district, address,
          is_enabled, remark, create_by, create_time, update_by, update_time, ...rest } = data as any;
  return requestClient.put(`/base/customer/${id}`, { ...rest });
}

export async function toggleCustomerStatus(id: number, enabled: number) {
  return requestClient.patch(`/base/customer/${id}/status`, null, { params: { enabled } });
}

export async function deleteCustomer(id: number) {
  return requestClient.delete(`/base/customer/${id}`);
}

export async function exportCustomer(params: CustomerQuery) {
  return requestClient.post('/base/customer/export', params, {
    responseType: 'blob',
  });
}
