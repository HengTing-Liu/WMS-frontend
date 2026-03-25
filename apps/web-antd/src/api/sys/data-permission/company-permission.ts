import { requestClient } from '#/api/request';

/**
 * 公司数据权限类型
 */
export interface CompanyDataPermission {
  id?: number;
  companyId: number;
  companyName?: string;
  tableCode: string;
  tableName?: string;
  dataScope: string;
  dataScopeName?: string;
  deptWhitelist?: number[];
  deptBlacklist?: number[];
  userWhitelist?: number[];
  userBlacklist?: number[];
  customSql?: string;
  status?: number;
  createBy?: number;
  createByName?: string;
  createTime?: string;
  updateTime?: string;
  remark?: string;
}

/**
 * 查询公司权限列表
 */
export async function getCompanyPermissionList(params: {
  companyId?: number;
  tableCode?: string;
  dataScope?: string;
  status?: number;
  page?: number;
  pageSize?: number;
}) {
  return requestClient.get<any>('/api/permission/company/list', {
    params,
  });
}

/**
 * 获取公司权限详情
 */
export async function getCompanyPermissionDetail(id: number) {
  return requestClient.get<CompanyDataPermission>(
    `/api/permission/company/${id}`,
  );
}

/**
 * 创建公司权限
 */
export async function createCompanyPermission(data: CompanyDataPermission) {
  return requestClient.post<any>('/api/permission/company', data);
}

/**
 * 更新公司权限
 */
export async function updateCompanyPermission(
  id: number,
  data: Partial<CompanyDataPermission>,
) {
  return requestClient.put<any>(`/api/permission/company/${id}`, data);
}

/**
 * 删除公司权限
 */
export async function deleteCompanyPermission(id: number) {
  return requestClient.delete<any>(`/api/permission/company/${id}`);
}
