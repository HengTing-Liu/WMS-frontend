import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace OperationMetaApi {
  export interface OperationMeta {
    id?: number;
    tableCode: string;
    operationCode: string;
    operationName: string;
    operationType: string;
    icon?: string;
    permission?: string;
    position?: 'toolbar' | 'row' | string;
    sortOrder?: number;
    status?: number;
    menuId?: number;
    eventType?: string;
    eventConfig?: string;
    confirmMessage?: string;
  }
}

export interface OperationMetaListResult {
  total: number;
  rows: OperationMetaApi.OperationMeta[];
}

function unwrapData<T = any>(res: any): T {
  return (res?.data ?? res) as T;
}

/** 检查后端业务响应码，非成功则抛出错误 */
function checkResponseCode(res: any, action: string) {
  const code = res?.code ?? res?.data?.code;
  const message = res?.msg ?? res?.data?.msg ?? res?.message ?? res?.data?.message;
  if (code !== 0 && code !== 200) {
    throw new Error(message || `${action}失败`);
  }
}

function normalizeOperation(item: Recordable<any>): OperationMetaApi.OperationMeta {
  return {
    id: item.id,
    tableCode: item.tableCode ?? item.table_code ?? '',
    operationCode: item.operationCode ?? item.operation_code ?? '',
    operationName: item.operationName ?? item.operation_name ?? '',
    operationType: item.operationType ?? item.operation_type ?? 'button',
    icon: item.icon ?? '',
    permission: item.permission ?? '',
    position: item.position ?? 'toolbar',
    sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
    status: Number(item.status ?? 1),
    menuId: item.menuId ?? item.menu_id,
    eventType: item.eventType ?? item.event_type ?? '',
    eventConfig: item.eventConfig ?? item.event_config ?? '',
    confirmMessage: item.confirmMessage ?? item.confirm_message ?? '',
  };
}

export async function getOperationMetaList(tableCode: string): Promise<OperationMetaListResult> {
  if (!tableCode) return { total: 0, rows: [] };
  const res = await requestClient.get<any>(`/api/system/meta/operation/list/${tableCode}`);
  const data = unwrapData<any>(res);
  const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
  return {
    total: Number(data?.total ?? rows.length),
    rows: rows.map((item) => normalizeOperation(item)),
  };
}

export async function getOperationMetaById(id: number | string) {
  const res = await requestClient.get<any>(`/api/system/meta/operation/${id}`);
  const data = unwrapData<any>(res);
  return data ? normalizeOperation(data) : null;
}

export async function addOperationMeta(data: Partial<OperationMetaApi.OperationMeta>) {
  const res = await requestClient.post('/api/system/meta/operation', data, {
    responseReturn: 'body',
  });
  checkResponseCode(res, '新增操作');
  return res;
}

export async function updateOperationMeta(
  id: number | string,
  data: Partial<OperationMetaApi.OperationMeta>,
) {
  const res = await requestClient.put(`/api/system/meta/operation/${id}`, data, {
    responseReturn: 'body',
  });
  checkResponseCode(res, '更新操作');
  return res;
}

export async function deleteOperationMeta(id: number | string) {
  const res = await requestClient.delete(`/api/system/meta/operation/${id}`, {
    responseReturn: 'body',
  });
  checkResponseCode(res, '删除操作');
  return res;
}

export async function batchDeleteOperationMeta(ids: number[]) {
  const res = await requestClient.delete('/api/system/meta/operation', {
    data: ids,
    responseReturn: 'body',
  });
  checkResponseCode(res, '批量删除操作');
  return res;
}

export async function batchSortOperationMeta(
  list: Array<Pick<OperationMetaApi.OperationMeta, 'id' | 'sortOrder'>>,
) {
  const res = await requestClient.put('/api/system/meta/operation/sort', list, {
    responseReturn: 'body',
  });
  checkResponseCode(res, '批量排序操作');
  return res;
}
