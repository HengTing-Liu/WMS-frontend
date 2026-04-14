/**
 * Lowcode 妯″潡 - 缁熶竴 API 鎺ュ彛
 *
 * 鎺ュ彛绾﹀畾锛? * - 鍒楄〃锛欸ET  /api/{module}/{entity}/list
 * - 璇︽儏锛欸ET  /api/{module}/{entity}/{id}
 * - 鏂板锛歅OST /api/{module}/{entity}
 * - 淇敼锛歅UT  /api/{module}/{entity}/{id}
 * - 鍒犻櫎锛欴ELETE /api/{module}/{entity}/{id}
 * - 鍚敤鍋滅敤锛歅UT  /api/{module}/{entity}/{id}/toggle
 *
 * 鍏冩暟鎹細
 * - 瀛楁 Schema锛欸ET /api/system/meta/column/schema?tableCode={tableCode}
 * - 琛ㄥ厓鏁版嵁锛欸ET /api/system/meta/table/{tableCode}
 * - 鎿嶄綔鎸夐挳锛欸ET /api/system/meta/operation/list/{tableCode}
 */

import { requestClient } from '#/api/request';
import type { ColumnMeta, FormGroupMeta, TableMeta, TableOperation } from './types';

// ==================== Meta 鎺ュ彛 ====================

/**
 * 鑾峰彇瀛楁 Schema锛堜緵鍓嶇娓叉煋鎼滅储鏍忓拰琛ㄦ牸鍒楋級
 * 鎺ュ彛锛欸ET /api/system/meta/column/schema?tableCode=xxx
 */
export async function fetchColumnSchema(tableCode: string): Promise<ColumnMeta[]> {
  const res = await requestClient.get<any>('/api/system/meta/column/schema', {
    params: { tableCode },
  });
  // 鍏煎澶氬眰鍖呰锛歞ata.rows / data / 鐩存帴鏁扮粍
  const rows = res?.data?.rows ?? res?.data ?? res ?? [];
  const list = Array.isArray(rows) ? rows : [];
  /**
   * 鍚庣 ColumnMetaVO 浣跨敤 code / label / isVisible / type锛?   * 鏁版嵁搴撳疄浣?ColumnMeta 浣跨敤 field / title / showInList銆?   * 姝ゅ涓ょ閮借鍏煎锛屽惁鍒?field銆乼itle 涓虹┖浼氬鑷磋〃澶翠笌 dataIndex 鍏ㄩ敊銆?   */
  return list.map((item: any) => {
    const code = item.field ?? item.code ?? item.columnCode ?? '';
    const title =
      item.title ?? item.label ?? item.columnName ?? item.column_name ?? code;
    let isShowInList =
      item.showInList ??
      item.show_in_list ??
      item.isShowInList ??
      item.is_show_in_list;
    if (isShowInList === undefined && typeof item.isVisible === 'boolean') {
      isShowInList = item.isVisible ? 1 : 0;
    }
    return {
      id: item.id,
      tableCode: item.tableCode,
      code,
      field: code,
      label: item.label ?? item.title,
      title,
      dataType: item.dataType ?? item.type,
      formType: item.formType || item.fieldType,
      dictType: item.dictType,
      isShowInList,
      isShowInForm: item.showInForm ?? item.isShowInForm ?? item.show_in_form,
      isSearchable: item.searchable ?? item.isSearchable,
      isSortable: item.sortable ?? item.isSortable,
      isRequired: item.required ?? item.isRequired,
      width: item.width ?? item.listWidth,
      sortOrder: item.sortOrder,
      rulesJson: item.rulesJson || item.validRules,
      placeholder: item.placeholder,
      defaultValue: item.defaultValue,
      colSpan: item.colSpan ?? item.formColSpan ?? item.form_col_span,
      sectionKey: item.sectionKey ?? item.formGroupCode ?? item.form_group_code,
      sectionTitle: item.sectionTitle ?? item.formGroupTitle ?? item.form_group_title,
      sectionOrder: item.sectionOrder ?? item.formGroupOrder ?? item.form_group_order,
      sectionType: item.sectionType ?? item.formGroupType ?? item.form_group_type,
      sectionOpen: item.sectionOpen ?? item.formGroupOpen ?? item.form_group_open,
      i18nKey: item.i18nKey,
      visibleCondition: item.visibleCondition,
      status: item.status ?? item.isEnabled,
      options: item.options,
      dataSource: item.dataSource,
    };
  });
}

/**
 * 鑾峰彇琛ㄥ厓鏁版嵁
 * 鎺ュ彛锛欸ET /api/system/meta/table/{tableCode}
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
 * 鑾峰彇鎿嶄綔鎸夐挳鍒楄〃
 * 鎺ュ彛锛欸ET /api/system/meta/operation/list/{tableCode}
 */
export async function fetchTableOperations(tableCode: string): Promise<TableOperation[]> {
  try {
    const res = await requestClient.get<any>(`/api/system/meta/operation/list/${tableCode}`);
    const rows =
      res?.rows ??
      res?.data?.rows ??
      res?.data ??
      res ??
      [];
    const list = Array.isArray(rows) ? rows : [];
    return list.filter((item: any) => Number(item?.status ?? 1) === 1);
  } catch {
    return [];
  }
}

export async function fetchFormGroups(tableCode: string): Promise<FormGroupMeta[]> {
  try {
    const res = await requestClient.get<any>(`/api/system/meta/group/list/${tableCode}`);
    const rows = res?.data?.rows ?? res?.data ?? res ?? [];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((item: any) => ({
        id: item.id,
        tableCode: item.tableCode ?? item.table_code ?? tableCode,
        groupCode: item.groupCode ?? item.group_code ?? '',
        groupTitle: item.groupTitle ?? item.group_title ?? '',
        groupType: item.groupType ?? item.group_type ?? 'card',
        sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
        defaultOpen: item.defaultOpen ?? item.default_open ?? 1,
        status: Number(item.status ?? 1),
        remarks: item.remarks ?? '',
      }))
      .filter((item: FormGroupMeta) => item.groupCode && Number(item.status ?? 1) === 1);
  } catch {
    return [];
  }
}

/**
 * 鎵归噺鑾峰彇瀛楁 Schema + 琛ㄥ厓鏁版嵁 + 鎿嶄綔鎸夐挳
 * 涓€娆℃媺鍙栵紝椤甸潰鍒濆鍖栨椂璋冪敤
 */
export async function fetchPageMeta(tableCode: string) {
  const [columns, tableMeta, operations, groups] = await Promise.all([
    fetchColumnSchema(tableCode),
    fetchTableMeta(tableCode),
    fetchTableOperations(tableCode),
    fetchFormGroups(tableCode),
  ]);
  return { columns, tableMeta, operations, groups };
}

// ==================== 閫氱敤 CRUD 鎺ュ彛 ====================

/** 鏍规嵁琛ㄧ紪鐮佹帹鏂?CRUD 鎺ュ彛鍓嶇紑 */
export function inferCrudPrefix(tableCode: string): string {
  const entityMap: Record<string, string> = {
    // WMS缂栫爜
    WMS0010: '/api/base/warehouse',
    WMS0030: '/api/base/material',
    WMS0040: '/api/base/basicData',
    // 鐗╃悊琛ㄥ悕锛堜綆浠ｇ爜涓撶敤锛?    sys_warehouse: '/api/wms/crud/sys_warehouse',
    sys_warehouse_receiver: '/api/wms/crud/sys_warehouse_receiver',
    sys_user: '/api/wms/crud/sys_user',
    // 涓氬姟琛ㄨ蛋浣庝唬鐮侀€氱敤鎺у埗鍣?    sys_material: '/api/wms/crud/sys_material',
  };
  if (entityMap[tableCode]) return entityMap[tableCode];
  // 鍏滃簳瑙勫垯
  if (tableCode.startsWith('sys_')) {
    return `/api/wms/crud/${tableCode}`;
  }
  return `/api/base/${tableCode.replace(/^WMS\d+$/, (m) => m.replace(/^WMS/, '').toLowerCase())}`;
}

/** 閫氱敤鍒楄〃鏌ヨ */
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

/** 閫氱敤璇︽儏鏌ヨ */
export async function fetchDetail(params: {
  tableCode: string;
  prefix?: string;
  id: number | string;
}) {
  const { tableCode, prefix, id } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode);
  const res = await requestClient.get<any>(`${basePrefix}/${id}`);
  return res?.data ?? res ?? {};
}

/** 閫氱敤鏂板 */
export async function createRecord(params: {
  tableCode: string;
  prefix?: string;
  data: Record<string, any>;
}) {
  const { tableCode, prefix, data } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode);
  return requestClient.post<any>(`${basePrefix}`, data);
}

/** 閫氱敤淇敼 */
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

/** 閫氱敤鍒犻櫎 */
export async function deleteRecord(params: {
  tableCode: string;
  prefix?: string;
  id: number | string;
}) {
  const { tableCode, prefix, id } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode);
  return requestClient.delete<any>(`${basePrefix}/${id}`);
}

/** 閫氱敤鍚敤/鍋滅敤 */
export async function toggleRecord(params: {
  tableCode: string;
  prefix?: string;
  id: number | string;
  enabled: boolean;
}) {
  const { tableCode, prefix, id, enabled } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode);
  return requestClient.put<any>(
    `${basePrefix}/${id}/status`,
    {},
    { params: { enabled: enabled ? 1 : 0 } },
  );
}


