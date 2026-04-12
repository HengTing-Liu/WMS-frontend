import type { Recordable } from '@vben/types';
import { requestClient } from '#/api/request';

export namespace TableMetaApi {
  // 表元数据接口
  export interface TableMeta {
    id?: number;
    tableCode: string;
    tableName: string;
    module: string;
    entityClass?: string;
    serviceClass?: string;
    permissionCode?: string;
    pageSize?: number;
    isTree?: number;
    status?: number;
    remark?: string;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
    isDeletedColumn?: string;
    hasDataPermission?: number;
    permissionField?: string;
    permissionScope?: string;
  }

  // 列表查询响应
  export interface TableMetaListResult {
    total: number;
    rows: TableMeta[];
  }

  // 单条记录结果
  export interface TableMetaResult extends TableMeta {}
}

// 导出请求参数
export interface TableMetaQuery {
  tableCode?: string;
  tableName?: string;
  module?: string;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 获取表元数据列表（分页+模糊搜索）
 */
export async function getTableMetaList(params?: TableMetaQuery) {
  const res = await requestClient.get<TableMetaApi.TableMetaListResult>(
    '/api/system/meta/table',
    { params },
  );
  return {
    total: res?.total || 0,
    rows: res?.rows || [],
  };
}

/**
 * 获取表元数据详情
 */
export async function getTableMetaById(id: string | number) {
  return requestClient.get<TableMetaApi.TableMetaResult>(
    `/api/system/meta/table/id/${id}`,
  );
}

/**
 * 通过编码查询表元数据
 */
export async function getTableMetaByCode(code: string) {
  return requestClient.get<TableMetaApi.TableMetaResult>(
    `/api/system/meta/table/code/${code}`,
  );
}

/**
 * 新增表元数据
 */
export async function addTableMeta(data: Partial<TableMetaApi.TableMeta>) {
  return requestClient.post('/api/system/meta/table', data, {
    responseReturn: 'body',
  });
}

/**
 * 更新表元数据
 */
export async function updateTableMeta(data: Partial<TableMetaApi.TableMeta>) {
  return requestClient.put(`/api/system/meta/table/${data.id}`, data, {
    responseReturn: 'body',
  });
}

/**
 * 删除表元数据
 */
export async function deleteTableMeta(id: string | number) {
  return requestClient.delete(`/api/system/meta/table/${id}`, {
    responseReturn: 'body',
  });
}

/**
 * 启用/禁用切换
 */
export async function toggleTableMetaStatus(id: string | number, _status: number) {
  return requestClient.put(`/api/system/meta/table/${id}/toggle`, undefined, {
    responseReturn: 'body',
  });
}

/**
 * 导出表元数据（待后端实现）
 */
export async function exportTableMeta(params?: TableMetaQuery) {
  return requestClient.post('/api/system/meta/table/export', params, {
    responseType: 'blob',
  });
}
