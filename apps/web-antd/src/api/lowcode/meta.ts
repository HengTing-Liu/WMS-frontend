import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace MetaApi {
  // 表元数据类型
  export interface TableMeta {
    id?: number;
    tableCode: string;
    tableName: string;
    module: 'base' | 'wms' | 'sys';
    entityClass?: string;
    serviceClass?: string;
    permissionCode?: string;
    pageSize: number;
    isTree: boolean;
    status: number;
    remark?: string;
    createTime?: string;
    updateTime?: string;
  }
}

/**
 * 获取元表列表
 */
export async function getMetaList(params?: Recordable<any>) {
  const res = await requestClient.get('/lowcode/meta/list', { params });
  return {
    total: res?.total || 0,
    rows: res?.rows || [],
  };
}

/**
 * 获取元表详情
 */
export function getMetaById(id: string | number) {
  return requestClient.get(`/lowcode/meta/${id}`);
}

/**
 * 新增元表
 */
export function addMeta(data: any) {
  return requestClient.post('/lowcode/meta', data);
}

/**
 * 修改元表
 */
export function updateMeta(data: any) {
  return requestClient.put('/lowcode/meta', data);
}

/**
 * 删除元表
 */
export function deleteMeta(id: string | number) {
  return requestClient.delete(`/lowcode/meta/${id}`);
}

/**
 * 批量删除元表
 */
export function batchDeleteMeta(ids: (string | number)[]) {
  return requestClient.delete('/lowcode/meta', { data: ids });
}

/**
 * 导出元表
 */
export function exportMeta(params?: Recordable<any>) {
  return requestClient.download('/lowcode/meta/export', params);
}

// ==================== 字段元数据 API ====================

/**
 * 获取字段列表
 */
export async function getColumnList(params?: Recordable<any>) {
  const res = await requestClient.get('/lowcode/meta/column/list', { params });
  return {
    total: res?.total || 0,
    rows: res?.rows || [],
  };
}

/**
 * 获取字段详情
 */
export function getColumnById(id: string | number) {
  return requestClient.get(`/lowcode/meta/column/${id}`);
}

/**
 * 新增字段
 */
export function addColumn(data: any) {
  return requestClient.post('/lowcode/meta/column', data);
}

/**
 * 修改字段
 */
export function updateColumn(data: any) {
  return requestClient.put('/lowcode/meta/column', data);
}

/**
 * 删除字段
 */
export function deleteColumn(id: string | number) {
  return requestClient.delete(`/lowcode/meta/column/${id}`);
}

/**
 * 批量删除字段
 */
export function batchDeleteColumn(ids: (string | number)[]) {
  return requestClient.delete('/lowcode/meta/column', { data: ids });
}

/**
 * 从数据库导入字段
 */
export function importColumnsFromDb(tableCode: string) {
  return requestClient.get(`/lowcode/meta/column/import/${tableCode}`);
}

/**
 * 保存字段列表（批量新增/更新）
 */
export function saveColumnList(data: any[]) {
  return requestClient.post('/lowcode/meta/column/batch', data);
}

// ==================== 操作配置 API ====================

/**
 * 获取操作列表
 */
export async function getOperationList(params?: Recordable<any>) {
  const res = await requestClient.get('/lowcode/meta/operation/list', { params });
  return {
    total: res?.total || 0,
    rows: res?.rows || [],
  };
}

/**
 * 获取操作详情
 */
export function getOperationById(id: string | number) {
  return requestClient.get(`/lowcode/meta/operation/${id}`);
}

/**
 * 新增操作
 */
export function addOperation(data: any) {
  return requestClient.post('/lowcode/meta/operation', data);
}

/**
 * 修改操作
 */
export function updateOperation(data: any) {
  return requestClient.put('/lowcode/meta/operation', data);
}

/**
 * 删除操作
 */
export function deleteOperation(id: string | number) {
  return requestClient.delete(`/lowcode/meta/operation/${id}`);
}

/**
 * 批量删除操作
 */
export function batchDeleteOperation(ids: (string | number)[]) {
  return requestClient.delete('/lowcode/meta/operation', { data: ids });
}
