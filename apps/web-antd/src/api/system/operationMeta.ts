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
  return requestClient.post('/api/system/meta/operation', data, {
    responseReturn: 'body',
  });
}

export async function updateOperationMeta(
  id: number | string,
  data: Partial<OperationMetaApi.OperationMeta>,
) {
  return requestClient.put(`/api/system/meta/operation/${id}`, data, {
    responseReturn: 'body',
  });
}

export async function deleteOperationMeta(id: number | string) {
  return requestClient.delete(`/api/system/meta/operation/${id}`, {
    responseReturn: 'body',
  });
}

export async function batchDeleteOperationMeta(ids: number[]) {
  return requestClient.delete('/api/system/meta/operation', {
    data: ids,
    responseReturn: 'body',
  });
}

export async function batchSortOperationMeta(
  list: Array<Pick<OperationMetaApi.OperationMeta, 'id' | 'sortOrder'>>,
) {
  return requestClient.put('/api/system/meta/operation/sort', list, {
    responseReturn: 'body',
  });
}
