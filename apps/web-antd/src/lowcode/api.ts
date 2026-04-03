/**
 * Lowcode 模块 - 统一 API 接口
 *
 * 接口约定：
 * - 列表：GET  /api/{module}/{entity}/list
 * - 详情：GET  /api/{module}/{entity}/{id}
 * - 新增：POST /api/{module}/{entity}
 * - 修改：PUT  /api/{module}/{entity}/{id}
 * - 删除：DELETE /api/{module}/{entity}/{id}
 * - 启用停用：PUT  /api/{module}/{entity}/{id}/toggle
 *
 * 元数据：
 * - 字段 Schema：GET /api/system/meta/column/schema?tableCode={tableCode}
 * - 表元数据：GET /api/system/meta/table/{tableCode}
 * - 操作按钮：GET /api/system/meta/operation/list/{tableCode}
 */

import { requestClient } from '#/api/request';
import type { ColumnMeta, TableMeta, TableOperation } from '../types';

// ==================== Meta 接口 ====================

/**
 * 获取字段 Schema（供前端渲染搜索栏和表格列）
 * 接口：GET /api/system/meta/column/schema?tableCode=xxx
 */
export async function fetchColumnSchema(tableCode: string): Promise<ColumnMeta[]> {
  const res = await requestClient.get<any>('/api/system/meta/column/schema', {
    params: { tableCode },
  });
  // 兼容多层包装：data.rows / data / 直接数组
  const rows = res?.data?.rows ?? res?.data ?? res ?? [];
  return Array.isArray(rows) ? rows : [];
}

/**
 * 获取表元数据
 * 接口：GET /api/system/meta/table/{tableCode}
 */
export async function fetchTableMeta(tableCode: string): Promise<TableMeta | null> {
  try {
    const res = await requestClient.get<any>(`/api/system/meta/table/${tableCode}`);
    return res?.data ?? res ?? null;
  } catch {
    return null;
  }
}

/**
 * 获取操作按钮列表
 * 接口：GET /api/system/meta/operation/list/{tableCode}
 */
export async function fetchTableOperations(tableCode: string): Promise<TableOperation[]> {
  try {
    const res = await requestClient.get<any>(`/api/system/meta/operation/list/${tableCode}`);
    const rows = res?.data ?? res ?? [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

/**
 * 批量获取字段 Schema + 表元数据 + 操作按钮
 * 一次拉取，页面初始化时调用
 */
export async function fetchPageMeta(tableCode: string) {
  const [columns, tableMeta, operations] = await Promise.all([
    fetchColumnSchema(tableCode),
    fetchTableMeta(tableCode),
    fetchTableOperations(tableCode),
  ]);
  return { columns, tableMeta, operations };
}

// ==================== 通用 CRUD 接口 ====================

/** 根据表编码推断 CRUD 接口前缀（需与后端协商约定） */
export function inferCrudPrefix(tableCode: string): string {
  // 约定：WMS系统基础数据前缀为 /api/base/{entity}
  // 例如：WMS0010 → /api/base/warehouse
  // 通用处理：将 tableCode 转成 entity 名称
  // WMS{数字} → base/{去掉WMS前缀，转小写}
  // 更通用：按约定规则转换或直接由调用方传入
  // 此处用简单映射，后续可扩展
  const entityMap: Record<string, string> = {
    WMS0010: '/api/base/warehouse',
    WMS0030: '/api/base/material',
    WMS0040: '/api/base/basicData',
  };
  return entityMap[tableCode] ?? `/api/base/${tableCode.replace(/^WMS\d+$/, (m) => m.replace(/^WMS/, '').toLowerCase())}`;
}

/** 通用列表查询 */
export async function fetchList(params: {
  tableCode: string;
  prefix?: string;
  query?: Record<string, any>;
  pageNum?: number;
  pageSize?: number;
}) {
  const { tableCode, prefix, query = {}, pageNum = 1, pageSize = 20 } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode);
  const res = await requestClient.get<any>(`${basePrefix}/list`, {
    params: { pageNum, pageSize, ...query },
  });
  const rows = res?.rows ?? res?.data?.rows ?? res?.data ?? [];
  const total = res?.total ?? res?.data?.total ?? 0;
  return { rows: Array.isArray(rows) ? rows : [], total };
}

/** 通用新增 */
export async function createRecord(params: {
  tableCode: string;
  prefix?: string;
  data: Record<string, any>;
}) {
  const { tableCode, prefix, data } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode);
  return requestClient.post<any>(`${basePrefix}`, data);
}

/** 通用修改 */
export async function updateRecord(params: {
  tableCode: string;
  prefix?: string;
  id: number | string;
  data: Record<string, any>;
}) {
  const { tableCode, prefix, id, data } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode);
  return requestClient.put<any>(`${basePrefix}/${id}`, data);
}

/** 通用删除 */
export async function deleteRecord(params: {
  tableCode: string;
  prefix?: string;
  id: number | string;
}) {
  const { tableCode, prefix, id } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode);
  return requestClient.delete<any>(`${basePrefix}/${id}`);
}

/** 通用启用/停用 */
export async function toggleRecord(params: {
  tableCode: string;
  prefix?: string;
  id: number | string;
  enabled: boolean;
}) {
  const { tableCode, prefix, id, enabled } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode);
  return requestClient.put<any>(`${basePrefix}/${id}/toggle`, { isEnabled: enabled ? 1 : 0 });
}
