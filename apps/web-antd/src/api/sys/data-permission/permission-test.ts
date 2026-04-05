import { requestClient } from '#/api/request';

/**
 * 模拟查询请求
 */
export interface SimulateQueryRequest {
  userId: number;
  tableCode: string;
  baseSql: string;
  params?: Record<string, any>;
  previewSql?: boolean;
}

/**
 * 模拟查询响应
 */
export interface SimulateQueryResponse {
  originalSql: string;
  finalSql: string;
  permissionInfo: {
    dimension: string;
    dataScope: string;
    whereCondition: string;
  };
  result?: any;
}

/**
 * 权限覆盖率分析响应
 */
export interface CoverageAnalysisResponse {
  totalCount: number;
  allowedCount: number;
  deniedCount: number;
  coverageRate: number;
  permissionInfo: {
    dimension: string;
    dataScope: string;
    whereCondition: string;
  };
}

/**
 * 模拟用户查询（SQL权限过滤测试）
 */
export async function simulateQuery(data: SimulateQueryRequest) {
  return requestClient.post<any>('/api/permission/test/simulate-query', {
    data,
  });
}

/**
 * 权限覆盖率分析
 */
export async function analyzeCoverage(params: {
  userId: number;
  tableCode: string;
}) {
  return requestClient.get<any>('/api/permission/test/coverage-analysis', {
    params,
  });
}

/**
 * 清除权限缓存
 */
export async function clearPermissionCache() {
  return requestClient.get<any>('/api/permission/test/clear-cache');
}
