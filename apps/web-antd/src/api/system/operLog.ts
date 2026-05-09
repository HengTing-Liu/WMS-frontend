import { requestClient } from '#/api/request';

export interface OperLogItem {
  operId: number;
  title: string;
  businessType: number;
  businessTypes?: number[] | null;
  method: string;
  requestMethod: string;
  operatorType: number;
  operName: string | null;
  deptName: string | null;
  operUrl: string;
  operIp: string;
  operLocation?: string | null;
  operParam: string;
  jsonResult: string;
  status: number;
  errorMsg: string | null;
  operTime: string;
  costTime: number;
  [key: string]: any;
}

export interface OperLogListResult {
  total: number;
  rows: OperLogItem[];
}

/**
 * 操作日志列表
 * GET /api/operlog/list
 */
async function getOperLogList(params: Record<string, any>) {
  return requestClient.get<OperLogListResult>('/api/operlog/list', {
    params,
    responseReturn: 'body',
  });
}

/**
 * 删除操作日志（支持批量，多个 id 逗号分隔）
 * DELETE /api/operlog/{operIds}
 */
async function deleteOperLog(operIds: number | number[] | string) {
  const idStr = Array.isArray(operIds) ? operIds.join(',') : String(operIds);
  return requestClient.delete(`/api/operlog/${idStr}`, { responseReturn: 'body' });
}

/**
 * 清空操作日志
 * DELETE /api/operlog/clean
 */
async function cleanOperLog() {
  return requestClient.delete('/api/operlog/clean', { responseReturn: 'body' });
}

/**
 * 导出操作日志
 * POST /api/operlog/export
 */
async function exportOperLog(data: Record<string, any> = {}) {
  return requestClient.post('/api/operlog/export', data, {
    responseType: 'blob',
    responseReturn: 'body',
  });
}

export { getOperLogList, deleteOperLog, cleanOperLog, exportOperLog };

