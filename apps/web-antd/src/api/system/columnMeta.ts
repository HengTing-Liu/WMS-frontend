import type { Recordable } from '@vben/types';
import { requestClient } from '#/api/request';

export namespace ColumnMetaApi {
  // 字段元数据接口
  export interface ColumnMeta {
    id?: number;
    tableId: number;
    columnCode: string;
    columnName: string;
    fieldType: string;
    dataType: string;
    dictType?: string;
    isRequired: number;
    isUnique?: number;
    isShowInList: number;
    isShowInForm: number;
    isSortable?: number;
    listWidth?: number;
    formColSpan?: number;
    defaultValue?: string;
    placeholder?: string;
    validRules?: string;
    sortOrder: number;
    isEnabled: number;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
  }

  // 列表查询响应
  export interface ColumnMetaListResult {
    total: number;
    rows: ColumnMeta[];
  }

  // 单条记录结果
  export interface ColumnMetaResult extends ColumnMeta {}
}

// 导出请求参数
export interface ColumnMetaQuery {
  tableCode?: string;
  tableId?: number;
  columnCode?: string;
  columnName?: string;
  fieldType?: string;
  pageNum?: number;
  pageSize?: number;
}

// 批量排序参数
export interface SortOrderItem {
  id: number;
  sortOrder: number;
}

/**
 * 获取字段元数据列表（分页+模糊搜索）
 */
export async function getColumnMetaList(params?: ColumnMetaQuery) {
  // requestClient 已自动提取 data 字段，所以 res 直接就是数组
  const res = await requestClient.get<any>(
    '/api/system/meta/column',
    { params },
  );
  // res 已经是数组格式了
  return {
    total: res?.length || 0,
    rows: Array.isArray(res) ? res : [],
  };
}

/**
 * 获取字段元数据详情
 */
export async function getColumnMetaById(id: string | number) {
  return requestClient.get<ColumnMetaApi.ColumnMetaResult>(
    `/api/system/meta/column/${id}`,
  );
}

/**
 * 新增字段元数据
 */
export async function addColumnMeta(data: Partial<ColumnMetaApi.ColumnMeta>) {
  return requestClient.post('/api/system/meta/column', data, {
    responseReturn: 'body',
  });
}

/**
 * 更新字段元数据
 */
export async function updateColumnMeta(data: Partial<ColumnMetaApi.ColumnMeta>) {
  return requestClient.put(`/api/system/meta/column/${data.id}`, data, {
    responseReturn: 'body',
  });
}

/**
 * 删除字段元数据
 */
export async function deleteColumnMeta(id: string | number) {
  return requestClient.delete(`/api/system/meta/column/${id}`, {
    responseReturn: 'body',
  });
}

/**
 * 批量创建字段元数据
 */
export async function batchAddColumnMeta(data: Partial<ColumnMetaApi.ColumnMeta>[]) {
  return requestClient.post('/api/system/meta/column/batch', data, {
    responseReturn: 'body',
  });
}

/**
 * 批量更新排序
 */
export async function batchUpdateSortOrder(orders: SortOrderItem[]) {
  return requestClient.put('/api/system/meta/column/sort', { orders }, {
    responseReturn: 'body',
  });
}

/**
 * 获取表元数据列表（用于选择表）
 */
export async function getTableMetaListForSelect() {
  const res = await requestClient.get<{
    total: number;
    rows: { id: number; tableCode: string; tableName: string }[];
  }>('/api/system/meta/table', {
    params: { pageNum: 1, pageSize: 1000 },
  });
  return res?.rows || [];
}

/**
 * 获取指定表的字段列表（用于复制）
 */
export async function getColumnMetaByTableId(tableCode: string) {
  // requestClient 已自动提取 data 字段
  const res = await requestClient.get<any>(
    '/api/system/meta/column',
    { params: { tableCode, pageNum: 1, pageSize: 1000 } },
  );
  return Array.isArray(res) ? res : [];
}
