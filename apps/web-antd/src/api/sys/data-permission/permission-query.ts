import { requestClient } from '#/api/request';

/**
 * 权限继承链项
 */
export interface PermissionInheritChain {
  priority: number;
  dimension: string;
  dimensionName: string;
  dataScope: string;
  dataScopeName: string;
  overridden: boolean;
  reason: string;
  config?: Record<string, any>;
}

/**
 * 用户数据权限配置（最终生效的）
 */
export interface UserDataPermissionResult {
  dimension: string;
  dimensionName: string;
  tableCode: string;
  tableName: string;
  dataScope: string;
  dataScopeName: string;
  deptWhitelist?: number[];
  deptBlacklist?: number[];
  userWhitelist?: number[];
  userBlacklist?: number[];
  customSql?: string;
  sqlCondition: string;
  inheritChain: PermissionInheritChain[];
}

/**
 * 用户所有表权限配置
 */
export interface UserAllPermissionsResult {
  userId: number;
  userName: string;
  permissions: Array<{
    tableCode: string;
    dimension: string;
    dataScope: string;
    sqlCondition: string;
  }>;
}

/**
 * 获取用户数据权限配置
 */
export async function getUserDataPermission(params: {
  userId: number;
  tableCode: string;
}) {
  return requestClient.get<any>('/api/permission/query/user-data-permission', {
    params,
  });
}

/**
 * 获取用户所有表的权限配置
 */
export async function getUserAllPermissions(params: {
  userId: number;
}) {
  return requestClient.get<any>('/api/permission/query/user-all-permissions', {
    params,
  });
}

/**
 * 刷新用户权限缓存
 */
export async function refreshUserPermissionCache(params: {
  userId?: number;
  tableCode?: string;
}) {
  return requestClient.post<any>('/api/permission/query/refresh-cache', params);
}

/**
 * 获取权限继承链
 */
export async function getPermissionInheritChain(params: {
  userId: number;
  tableCode: string;
}) {
  return requestClient.get<any>('/api/permission/test/inherit-chain', {
    params,
  });
}
