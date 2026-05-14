import { requestClient } from '#/api/request';

let tableMetaSelectCache: { id: number; tableCode: string; pageType?: string; tableName: string }[] | null = null;
let tableMetaSelectLoading: Promise<
  { id: number; tableCode: string; pageType?: string; tableName: string }[]
> | null = null;

export namespace ColumnMetaApi {
  export interface ColumnMeta {
    id?: number;
    tableMetaId?: number;
    tableCode: string;
    field: string;
    title: string;
    dataType: string;
    formType: string;
    dictType?: string;
    linkageJson?: string;
    required: number;
    isUnique?: number;
    showInList: number;
    showInForm: number;
    showInExport?: number;
    showInImport?: number;
    searchable?: number;
    sortable?: number;
    width?: number;
    colSpan?: number;
    readonly?: number;
    editReadonly?: number;
    defaultValue?: string;
    placeholder?: string;
    rulesJson?: string;
    sortOrder: number;
    status: number;
    remarks?: string;
    componentProps?: string;
    dataSource?: string;
    apiUrl?: string;
    labelField?: string;
    valueField?: string;
    sectionKey?: string;
    i18nKey?: string;
    visibleCondition?: string;
    columnName?: string;
    columnType?: string;
    primaryKey?: boolean;
    nullable?: boolean;
    columnSize?: number;
    decimalDigits?: number;

    // ========== Lookup 虚拟列配置（WMS-LOWCODE-LOOKUP） ==========
    refTableCode?: string;
    refMatchField?: string;
    refTargetField?: string;
    refLocalField?: string;
    /** 多字段拼接分隔符，空值时后端兜底为 ❤（SEP） */
    refSeparator?: string;
    /** 关联流水号规则编码（对应 sys_serial_number.usage_scope） */
    serialNumberRule?: string;

    // legacy aliases from older payloads
    columnCode?: string;
    columnNameLegacy?: string;
    fieldType?: string;
    isRequired?: number;
    isEnabled?: number;
    isShowInList?: number;
    isShowInForm?: number;
    validRules?: string;
    listWidth?: number;
    formColSpan?: number;
  }

  export interface ColumnMetaListResult {
    total: number;
    rows: ColumnMeta[];
  }

  export interface ColumnMetaResult extends ColumnMeta {}
}

export interface ColumnMetaQuery {
  tableCode?: string;
  tableId?: number;
  columnCode?: string;
  columnName?: string;
  fieldType?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface SortOrderItem {
  id: number;
  sortOrder: number;
}

/**
 * 栅格列宽：统一 camel/snake；未配置时为 undefined（与接口 colSpan:null 一致），禁止误当成 24
 */
function normalizeColSpan(item: Record<string, unknown>): number | undefined {
  const raw =
    item.colSpan ??
    item.col_span ??
    item.formColSpan ??
    item.form_col_span;
  if (raw === null || raw === undefined || raw === '') {
    return undefined;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  const r = Math.round(n);
  return Math.min(24, Math.max(1, r));
}

/** 0/1：兼容接口 Boolean / 数字 / 字符串 */
function toIntFlag(val: unknown, defaultVal: number): number {
  if (val === true) return 1;
  if (val === false) return 0;
  if (val === null || val === undefined || val === '') return defaultVal;
  const n = Number(val);
  if (!Number.isFinite(n)) return defaultVal;
  return n !== 0 ? 1 : 0;
}

function normalizeColumn(item: any): ColumnMetaApi.ColumnMeta {
  const field = item.field ?? item.columnCode ?? '';
  return {
    ...item,
    field,
    title: item.title ?? item.label ?? '',
    columnName: item.columnName ?? item.column_name ?? '',
    formType: item.formType ?? item.fieldType ?? 'text',
    required: toIntFlag(item.required ?? item.isRequired, 0),
    showInList: toIntFlag(
      item.showInList ??
        item.isShowInList ??
        (item.isVisible === true ? 1 : item.isVisible === false ? 0 : undefined),
      1,
    ),
    showInForm: toIntFlag(item.showInForm ?? item.isShowInForm, 1),
    showInExport: toIntFlag(item.showInExport ?? item.isShowInExport, 0),
    showInImport: toIntFlag(item.showInImport ?? item.isShowInImport, 1),
    searchable: toIntFlag(item.searchable ?? item.isSearchable, 0),
    sortable: toIntFlag(item.sortable ?? item.isSortable, 0),
    isUnique: toIntFlag(item.isUnique ?? item.unique, 0),
    width: Number(item.width ?? item.listWidth ?? 120),
    colSpan: normalizeColSpan(item),
    readonly: toIntFlag(item.readonly ?? item.isReadonly, 0),
    editReadonly: toIntFlag(item.editReadonly ?? item.isEditReadonly, 0),
    rulesJson: item.rulesJson ?? item.validRules ?? '',
    status: toIntFlag(item.status ?? item.isEnabled, 1),
  };
}

function normalizeSchemaColumn(item: any): ColumnMetaApi.ColumnMeta {
  return {
    id: item.id ?? item.columnId,
    tableMetaId: item.tableMetaId,
    tableCode: item.tableCode ?? '',
    columnName: item.columnName ?? item.column_name ?? '',
    field: item.field ?? item.code ?? '',
    title: item.title ?? item.label ?? item.code ?? '',
    dataType: item.dataType ?? item.type ?? 'string',
    formType: item.formType ?? 'text',
    dictType: item.dictType ?? '',
    linkageJson: item.linkageJson ?? '',
    required: toIntFlag(item.required ?? item.isRequired, 0),
    showInList: toIntFlag(
      item.showInList ??
        item.isShowInList ??
        (item.isVisible === true ? 1 : item.isVisible === false ? 0 : undefined),
      1,
    ),
    showInForm: toIntFlag(item.showInForm ?? item.isShowInForm, 1),
    showInExport: toIntFlag(item.showInExport ?? item.isShowInExport, 0),
    showInImport: toIntFlag(item.showInImport ?? item.isShowInImport, 1),
    searchable: toIntFlag(item.searchable ?? item.isSearchable, 0),
    sortable: toIntFlag(item.sortable ?? item.isSortable, 0),
    isUnique: toIntFlag(item.isUnique ?? item.unique, 0),
    width: Number(item.width ?? 120),
    colSpan: normalizeColSpan(item),
    readonly: toIntFlag(item.readonly ?? item.isReadonly, 0),
    editReadonly: toIntFlag(item.editReadonly ?? item.isEditReadonly, 0),
    defaultValue: item.defaultValue ?? '',
    placeholder: item.placeholder ?? '',
    rulesJson: item.rulesJson ?? '',
    sortOrder: Number(item.sortOrder ?? 0),
    status: toIntFlag(item.status ?? item.isEnabled, 1),
    remarks: item.remarks ?? '',
    componentProps: item.componentProps ?? '',
    dataSource: item.dataSource ?? '',
    apiUrl: item.apiUrl ?? '',
    labelField: item.labelField ?? '',
    valueField: item.valueField ?? '',
    sectionKey: item.sectionKey ?? '',
    sectionTitle: item.sectionTitle ?? '',
    sectionOrder: Number(item.sectionOrder ?? 0),
    sectionType: item.sectionType ?? 'card',
    sectionOpen: Number(item.sectionOpen ?? 1),
    i18nKey: item.i18nKey ?? '',
    visibleCondition: item.visibleCondition ?? '',
    refTableCode: item.refTableCode ?? '',
    refMatchField: item.refMatchField ?? '',
    refTargetField: item.refTargetField ?? '',
    refLocalField: item.refLocalField ?? '',
    refSeparator: item.refSeparator ?? '',
    serialNumberRule: item.serialNumberRule ?? '',
  };
}

export async function getColumnMetaList(params?: ColumnMetaQuery) {
  const tableCode = params?.tableCode;
  const tableId = params?.tableId;

  if (tableId) {
    const res = await requestClient.get<any>(
      `/api/system/meta/column/listByMetaId/${tableId}`,
    );
    const rows = Array.isArray(res)
      ? res
      : Array.isArray(res?.rows)
        ? res.rows
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.rows)
            ? res.data.rows
            : [];
    return {
      total: rows.length,
      rows: rows.map((item) => normalizeColumn(item)),
    };
  }

  if (!tableCode) {
    return { total: 0, rows: [] };
  }

  try {
    const res = await requestClient.get<any>(
      `/api/system/meta/column/list/${tableCode}`,
      { params: { pageNum: params?.pageNum, pageSize: params?.pageSize } },
    );

    const rows = Array.isArray(res)
      ? res
      : Array.isArray(res?.rows)
        ? res.rows
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.rows)
            ? res.data.rows
            : [];
    const normalizedRows = rows.map((item) => normalizeColumn(item));
    if (normalizedRows.length > 0) {
      return {
        total: normalizedRows.length,
        rows: normalizedRows,
      };
    }
  } catch {
    // fallback below
  }

  // fallback: schema endpoint usually has looser permission and stable response
  const schemaRes = await requestClient.get<any>('/api/system/meta/column/schema', {
    params: { tableCode },
  });
  const schemaRows = Array.isArray(schemaRes)
    ? schemaRes
    : Array.isArray(schemaRes?.rows)
      ? schemaRes.rows
      : Array.isArray(schemaRes?.data)
        ? schemaRes.data
        : Array.isArray(schemaRes?.data?.rows)
          ? schemaRes.data.rows
          : [];
  const normalizedSchemaRows = schemaRows.map((item) => normalizeSchemaColumn(item));
  return {
    total: normalizedSchemaRows.length,
    rows: normalizedSchemaRows,
  };
}

export async function getColumnMetaById(id: string | number) {
  const res = await requestClient.get<ColumnMetaApi.ColumnMetaResult>(
    `/api/system/meta/column/${id}`,
  );
  return res ? normalizeColumn(res) : null;
}

export async function addColumnMeta(data: Partial<ColumnMetaApi.ColumnMeta>) {
  return requestClient.post('/api/system/meta/column', data, {
    responseReturn: 'body',
  });
}

export async function updateColumnMeta(data: Partial<ColumnMetaApi.ColumnMeta>) {
  const id = data.id;
  if (id === undefined || id === null || id === '' || Number.isNaN(Number(id))) {
    return Promise.reject(new Error('列元数据缺少 id，请刷新页面后重试'));
  }
  return requestClient.put(`/api/system/meta/column/${id}`, data, {
    responseReturn: 'body',
  });
}

/**
 * 选择性更新字段元数据（前端 switch 切换等局部更新，只更新非 null 字段）
 */
export async function updateColumnMetaSelective(data: Partial<ColumnMetaApi.ColumnMeta>) {
  return requestClient.patch(`/api/system/meta/column/${data.id}`, data, {
    responseReturn: 'body',
  });
}

export async function deleteColumnMeta(id: string | number) {
  return requestClient.delete(`/api/system/meta/column/${id}`, {
    responseReturn: 'body',
  });
}

export async function batchAddColumnMeta(data: Partial<ColumnMetaApi.ColumnMeta>[]) {
  return requestClient.post('/api/system/meta/column/batch-insert', data, {
    responseReturn: 'body',
  });
}

export async function batchUpdateSortOrder(orders: SortOrderItem[]) {
  return requestClient.put('/api/system/meta/column/sort', orders, {
    responseReturn: 'body',
  });
}

export interface BatchSectionPayload {
  ids: number[];
  sectionKey: string;
  sectionTitle: string;
  sectionOrder: number;
  sectionType: string;
}

export async function batchUpdateColumnSection(payload: BatchSectionPayload) {
  return requestClient.put('/api/system/meta/column/batch-group', payload, {
    responseReturn: 'body',
  });
}

export async function batchUpdateColSpan(ids: number[], colSpan: number) {
  return requestClient.put('/api/system/meta/column/colspan', { ids, colSpan }, {
    responseReturn: 'body',
  });
}

export async function getTableMetaListForSelect(forceRefresh = false) {
  if (!forceRefresh && tableMetaSelectCache) {
    return tableMetaSelectCache;
  }

  if (!forceRefresh && tableMetaSelectLoading) {
    return tableMetaSelectLoading;
  }

  tableMetaSelectLoading = requestClient
    .get<{
      total: number;
      rows: { id: number; tableCode: string; pageType?: string; tableName: string }[];
    }>('/api/system/meta/table', {
      params: { pageNum: 1, pageSize: 1000 },
    })
    .then((res) => {
      const rows = res?.rows || [];
      tableMetaSelectCache = rows;
      return rows;
    })
    .finally(() => {
      tableMetaSelectLoading = null;
    });

  return tableMetaSelectLoading;
}

export async function getColumnMetaByTableId(tableMetaId: number | string) {
  const res = await requestClient.get<any>(
    `/api/system/meta/column/schemaByMetaId/${tableMetaId}`,
  );
  const rows = Array.isArray(res)
    ? res
    : Array.isArray(res?.rows)
      ? res.rows
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.rows)
          ? res.data.rows
          : [];
  return rows.map((item) => normalizeColumn(item));
}
