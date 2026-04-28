/**
 * Lowcode 濡€虫健 - 缂佺喍绔?API 閹恒儱褰? *
 * 閹恒儱褰涚痪锕€鐣鹃敍? * - 閸掓銆冮敍娆窫T  /api/{module}/{entity}/list
 * - 鐠囷附鍎忛敍娆窫T  /api/{module}/{entity}/{id}
 * - 閺傛澘顤冮敍姝匫ST /api/{module}/{entity}
 * - 娣囶喗鏁奸敍姝匲T  /api/{module}/{entity}/{id}
 * - 閸掔娀娅庨敍娆碋LETE /api/{module}/{entity}/{id}
 * - 閸氼垳鏁ら崑婊呮暏閿涙瓍UT  /api/{module}/{entity}/{id}/toggle
 *
 * 閸忓啯鏆熼幑顕嗙窗
 * - 鐎涙顔?Schema閿涙ET /api/system/meta/column/schema?tableCode={tableCode}
 * - 鐞涖劌鍘撻弫鐗堝祦閿涙ET /api/system/meta/table/{tableCode}
 * - 閹垮秳缍旈幐澶愭尦閿涙ET /api/system/meta/operation/list/{tableCode}
 */

import { requestClient } from '#/api/request';
import type { ColumnMeta, FormGroupMeta, TableMeta, TableOperation } from './types';

// ==================== Meta 閹恒儱褰?====================

/**
 * 閼惧嘲褰囩€涙顔?Schema閿涘牅绶甸崜宥囶伂濞撳弶鐓嬮幖婊呭偍閺嶅繐鎷扮悰銊︾壐閸掓绱? * 閹恒儱褰涢敍娆窫T /api/system/meta/column/schema?tableCode=xxx
 */
export async function fetchColumnSchema(tableCode: string): Promise<ColumnMeta[]> {
  const res = await requestClient.get<any>('/api/system/meta/column/schema', {
    params: { tableCode },
  });
  // 閸忕厧顔愭径姘湴閸栧懓顥婇敍姝瀉ta.rows / data / 閻╁瓨甯撮弫鎵矋
  const rows = res?.data?.rows ?? res?.data ?? res ?? [];
  const list = Array.isArray(rows) ? rows : [];
  /**
   * 閸氬海顏?ColumnMetaVO 娴ｈ法鏁?code / label / isVisible / type閿?   * 閺佺増宓佹惔鎾崇杽娴?ColumnMeta 娴ｈ法鏁?field / title / showInList閵?   * 濮濄倕顦╂稉銈囶潚闁€燁洣閸忕厧顔愰敍灞芥儊閸?field閵嗕辜itle 娑撹櫣鈹栨导姘嚤閼风銆冩径缈犵瑢 dataIndex 閸忋劑鏁婇妴?   */
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
      isUnique: item.unique ?? item.isUnique,
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
      readonly: Number(item.readonly ?? item.isReadonly ?? item.is_readonly ?? 0),
      editReadonly: Number(item.editReadonly ?? item.isEditReadonly ?? item.is_edit_readonly ?? 0),
      serialNumberRule: item.serialNumberRule ?? '',
    };
  });
}

/**
 * 閼惧嘲褰囩悰銊ュ帗閺佺増宓? * 閹恒儱褰涢敍娆窫T /api/system/meta/table/{tableCode}
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
 * 閼惧嘲褰囬幙宥勭稊閹稿鎸抽崚妤勩€? * 閹恒儱褰涢敍娆窫T /api/system/meta/operation/list/{tableCode}
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
    return list;
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
 * 閹靛綊鍣洪懢宄板絿鐎涙顔?Schema + 鐞涖劌鍘撻弫鐗堝祦 + 閹垮秳缍旈幐澶愭尦
 * 娑撯偓濞嗏剝濯洪崣鏍电礉妞ょ敻娼伴崚婵嗩潗閸栨牗妞傜拫鍐暏
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

// ==================== 闁氨鏁?CRUD 閹恒儱褰?====================

/** 列表数据 CRUD 接口前缀推断 */
export function inferCrudPrefix(tableCode: string): string {
  const entityMap: Record<string, string> = {
    // WMS基础表
    WMS0010: '/api/base/warehouse',
    WMS0030: '/api/base/material',
    WMS0040: '/api/base/basicData',
    // 库存相关表路由映射
    inv_warehouse: '/api/wms/crud/inv_warehouse',
    inv_warehouse_receiver: '/api/wms/crud/inv_warehouse_receiver',
    inv_location: '/api/wms/crud/inv_location',
    sys_user: '/api/wms/crud/sys_user',
    // 物料相关表和其他业务表
    inv_material: '/api/wms/crud/inv_material',
    // 系统表（树形）
    sys_dept: '/api/wms/crud/sys_dept',
  };
  if (entityMap[tableCode]) return entityMap[tableCode];
  // 系统表兜底
  if (tableCode.startsWith('sys_')) {
    return `/api/wms/crud/${tableCode}`;
  }
  return `/api/base/${tableCode.replace(/^WMS\d+$/, (m) => m.replace(/^WMS/, '').toLowerCase())}`;
}

/** 闁氨鏁ら崚妤勩€冮弻銉嚄 */
/** Tree all: fetch all records without pagination (for tree table) */
export async function fetchTreeAll(params: {
  tableCode: string;
  prefix?: string;
  tableMeta?: TableMeta | null;
  query?: Record<string, any>;
  queryModes?: Record<string, 'eq' | 'like'>;
}) {
  const { tableCode, prefix, tableMeta, query = {}, queryModes = {} } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode, tableMeta);
  const res = await requestClient.get<any>(`${basePrefix}/listAll`, {
    params: { ...query, queryModes: JSON.stringify(queryModes) },
    paramsSerializer: 'brackets',
  });
  const rows = res?.rows ?? res?.data?.rows ?? res?.data ?? res ?? [];
  return Array.isArray(rows) ? rows : [];
}

export async function fetchList(params: {
  tableCode: string;
  prefix?: string;
  tableMeta?: TableMeta | null;
  query?: Record<string, any>;
  queryModes?: Record<string, 'eq' | 'like'>;
  pageNum?: number;
  pageSize?: number;
  orderByColumn?: string;
  isAsc?: 'asc' | 'desc';
}) {
  const {
    tableCode,
    prefix,
    tableMeta,
    query = {},
    queryModes = {},
    pageNum = 1,
    pageSize = 20,
    orderByColumn,
    isAsc,
  } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode, tableMeta);
  const sortParams: Record<string, string> = {};
  if (orderByColumn) {
    sortParams.orderByColumn = orderByColumn;
  }
  if (isAsc) {
    sortParams.isAsc = isAsc;
  }
  const res = await requestClient.get<any>(`${basePrefix}/list`, {
    params: {
      pageNum,
      pageSize,
      ...query,
      queryModes: JSON.stringify(queryModes),
      ...sortParams,
    },
    paramsSerializer: 'brackets',
  });
  const rows = res?.rows ?? res?.data?.rows ?? res?.data ?? [];
  const total = res?.total ?? res?.data?.total ?? 0;
  return { rows: Array.isArray(rows) ? rows : [], total };
}

/** 闁氨鏁ょ拠锔藉剰閺屻儴顕?*/
export async function fetchDetail(params: {
  tableCode: string;
  prefix?: string;
  tableMeta?: TableMeta | null;
  id: number | string;
}) {
  const { tableCode, prefix, tableMeta, id } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode, tableMeta);
  const res = await requestClient.get<any>(`${basePrefix}/${id}`);
  return res?.data ?? res ?? {};
}

/** 闁氨鏁ら弬鏉款杻 */
export async function createRecord(params: {
  tableCode: string;
  prefix?: string;
  tableMeta?: TableMeta | null;
  data: Record<string, any>;
}) {
  const { tableCode, prefix, tableMeta, data } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode, tableMeta);
  return requestClient.post<any>(`${basePrefix}`, data);
}

/** 闁氨鏁ゆ穱顔芥暭 */
export async function updateRecord(params: {
  tableCode: string;
  prefix?: string;
  tableMeta?: TableMeta | null;
  id: number | string;
  data: Record<string, any>;
}) {
  const { tableCode, prefix, tableMeta, id, data } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode, tableMeta);
  return requestClient.put<any>(`${basePrefix}/${id}`, data);
}

/** 闁氨鏁ら崚鐘绘珟 */
export async function deleteRecord(params: {
  tableCode: string;
  prefix?: string;
  tableMeta?: TableMeta | null;
  id: number | string;
}) {
  const { tableCode, prefix, tableMeta, id } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode, tableMeta);
  return requestClient.delete<any>(`${basePrefix}/${id}`);
}

/**
 * 根据规则名称预览流水号（低代码表单预填充用，只计算不消耗）
 */
export async function fetchSerialNumber(ruleName: string): Promise<string> {
  try {
    const res = await requestClient.post<any>('/api/serial/previewByRuleName', { ruleName });
    return res?.data?.serialNo ?? res?.serialNo ?? '';
  } catch {
    return '';
  }
}

/** 闁氨鏁ら崥顖滄暏/閸嬫粎鏁?*/
export async function toggleRecord(params: {
  tableCode: string;
  prefix?: string;
  tableMeta?: TableMeta | null;
  id: number | string;
  enabled: boolean;
}) {
  const { tableCode, prefix, tableMeta, id, enabled } = params;
  const basePrefix = prefix ?? inferCrudPrefix(tableCode, tableMeta);
  const enabledValue = enabled ? 1 : 0;
  return requestClient.post<any>(
    `${basePrefix}/toggle/${id}`,
    {},
    { params: { enabled: enabledValue } },
  );
}
