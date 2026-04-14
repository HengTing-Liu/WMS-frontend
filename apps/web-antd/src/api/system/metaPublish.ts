import type { Recordable } from '@vben/types';
import { requestClient } from '#/api/request';

export namespace MetaPublishApi {
  // 发布主记录
  export interface MetaPublish {
    id?: number;
    publishCode?: string;
    tableCode?: string;
    tableName?: string;
    version?: number;
    status?: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
    totalSqls?: number;
    successSqls?: number;
    failedSqls?: number;
    errorMessage?: string;
    forced?: boolean;
    publishBy?: string;
    publishByName?: string;
    publishTime?: string;
    remarks?: string;
    createdAt?: string;
    updatedAt?: string;
  }

  // 校验结果
  export interface ValidationResult {
    passed?: boolean;
    errors?: string[];
    warnings?: string[];
  }

  // Diff 列
  export interface DiffColumn {
    columnCode?: string;
    columnName?: string;
    metaValue?: string;
    dbValue?: string;
    changeType?: 'ADD' | 'MODIFY' | 'REMOVE';
  }

  // Diff 结果
  export interface DiffResult {
    tableExists?: boolean;
    addedColumns?: DiffColumn[];
    modifiedColumns?: DiffColumn[];
    removedColumns?: DiffColumn[];
  }

  // SQL 条目
  export interface SqlItem {
    seq?: number;
    sqlType?: string;
    sqlText?: string;
    riskLevel?: 'SAFE' | 'WARNING' | 'DANGER';
    riskReason?: string;
    detailId?: number;
  }

  // 发布计划响应
  export interface PublishPlanResponse {
    tableCode?: string;
    tableName?: string;
    version?: number;
    validation?: ValidationResult;
    diff?: DiffResult;
    sqlList?: SqlItem[];
    overallRisk?: string;
    canPublish?: boolean;
    reason?: string;
  }

  // 发布明细
  export interface PublishDetail {
    id?: number;
    seq?: number;
    sqlType?: string;
    sqlText?: string;
    riskLevel?: string;
    executionTime?: number;
    resultStatus?: string;
    errorMessage?: string;
    executedAt?: string;
  }

  // 发布响应
  export interface PublishResponse extends MetaPublish {
    details?: PublishDetail[];
  }

  // 发布历史查询
  export interface PublishHistoryQuery {
    tableCode?: string;
    status?: string;
    publishBy?: string;
    beginTime?: string;
    endTime?: string;
  }
}

// 生成发布计划（预览）
export async function generatePublishPlan(params: { tableCodes: string[]; forced?: boolean; remarks?: string }) {
  return requestClient.post<MetaPublishApi.PublishPlanResponse[]>(
    '/api/system/meta/publish/plan',
    params,
  );
}

// 保存发布计划
export async function savePublishPlan(params: { tableCodes: string[]; forced?: boolean; remarks?: string }) {
  return requestClient.post<MetaPublishApi.MetaPublish>(
    '/api/system/meta/publish/save',
    params,
  );
}

// 执行发布
export async function executePublish(params: { publishCode: string; forced?: boolean; detailIds?: number[] }) {
  return requestClient.post<MetaPublishApi.PublishResponse>(
    '/api/system/meta/publish/execute',
    params,
  );
}

// 查询发布历史
export async function getPublishHistory(params?: MetaPublishApi.PublishHistoryQuery) {
  return requestClient.get<MetaPublishApi.PublishResponse[]>(
    '/api/system/meta/publish/history',
    { params },
  );
}

// 查询发布详情
export async function getPublishById(id: number) {
  return requestClient.get<MetaPublishApi.PublishResponse>(
    `/api/system/meta/publish/${id}`,
  );
}

// 查询发布详情（通过编码）
export async function getPublishByCode(publishCode: string) {
  return requestClient.get<MetaPublishApi.PublishResponse>(
    `/api/system/meta/publish/code/${publishCode}`,
  );
}

// 回滚（V2）
export async function rollbackPublish(id: number) {
  return requestClient.post(`/api/system/meta/publish/rollback/${id}`);
}
