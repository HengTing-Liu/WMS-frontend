import { requestClient } from '#/api/request';

export namespace GroupMetaApi {
  export interface GroupMeta {
    id?: number;
    tableCode: string;
    groupCode: string;
    groupTitle: string;
    groupType?: 'card' | 'collapse' | string;
    sortOrder?: number;
    defaultOpen?: number;
    status?: number;
    remarks?: string;
  }
}

export interface GroupMetaListResult {
  total: number;
  rows: GroupMetaApi.GroupMeta[];
}

function unwrapData<T = any>(res: any): T {
  return (res?.data ?? res) as T;
}

function checkResponseCode(res: any, action: string) {
  const code = res?.code ?? res?.data?.code;
  const message = res?.msg ?? res?.data?.msg ?? res?.message ?? res?.data?.message;
  if (code !== 0 && code !== 200) {
    throw new Error(message || `${action}失败`);
  }
}

function normalizeGroup(item: any): GroupMetaApi.GroupMeta {
  return {
    id: item.id,
    tableCode: item.tableCode ?? item.table_code ?? '',
    groupCode: item.groupCode ?? item.group_code ?? '',
    groupTitle: item.groupTitle ?? item.group_title ?? '',
    groupType: item.groupType ?? item.group_type ?? 'card',
    sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
    defaultOpen: Number(item.defaultOpen ?? item.default_open ?? 1),
    status: Number(item.status ?? 1),
    remarks: item.remarks ?? '',
  };
}

export async function getGroupMetaList(tableCode: string): Promise<GroupMetaListResult> {
  if (!tableCode) return { total: 0, rows: [] };
  const res = await requestClient.get<any>(`/api/system/meta/group/list/${tableCode}`);
  const data = unwrapData<any>(res);
  const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
  return {
    total: Number(data?.total ?? rows.length),
    rows: rows.map((item: any) => normalizeGroup(item)),
  };
}

export async function getGroupMetaById(id: number | string) {
  const res = await requestClient.get<any>(`/api/system/meta/group/${id}`);
  const data = unwrapData<any>(res);
  return data ? normalizeGroup(data) : null;
}

export async function addGroupMeta(data: Partial<GroupMetaApi.GroupMeta>) {
  const res = await requestClient.post('/api/system/meta/group', data, {
    responseReturn: 'body',
  });
  checkResponseCode(res, '新增分组');
  return res;
}

export async function updateGroupMeta(id: number | string, data: Partial<GroupMetaApi.GroupMeta>) {
  const res = await requestClient.put(`/api/system/meta/group/${id}`, data, {
    responseReturn: 'body',
  });
  checkResponseCode(res, '更新分组');
  return res;
}

export async function deleteGroupMeta(id: number | string) {
  const res = await requestClient.delete(`/api/system/meta/group/${id}`, {
    responseReturn: 'body',
  });
  checkResponseCode(res, '删除分组');
  return res;
}

export async function batchSortGroupMeta(
  list: Array<Pick<GroupMetaApi.GroupMeta, 'id' | 'sortOrder'>>,
) {
  const res = await requestClient.put('/api/system/meta/group/sort', list, {
    responseReturn: 'body',
  });
  checkResponseCode(res, '保存分组排序');
  return res;
}
