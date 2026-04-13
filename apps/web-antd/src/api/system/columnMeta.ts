import { requestClient } from '#/api/request';

export namespace ColumnMetaApi {
  export interface ColumnMeta {
    id?: number;
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
    searchable?: number;
    sortable?: number;
    width?: number;
    colSpan?: number;
    defaultValue?: string;
    placeholder?: string;
    rulesJson?: string;
    sortOrder: number;
    status: number;
    remark?: string;
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

function normalizeColumn(item: any): ColumnMetaApi.ColumnMeta {
  return {
    ...item,
    field: item.field ?? item.columnCode ?? '',
    title: item.title ?? item.columnName ?? '',
    formType: item.formType ?? item.fieldType ?? 'text',
    required: Number(item.required ?? item.isRequired ?? 0),
    showInList: Number(item.showInList ?? item.isShowInList ?? 1),
    showInForm: Number(item.showInForm ?? item.isShowInForm ?? 1),
    showInExport: Number(item.showInExport ?? item.isShowInExport ?? 0),
    searchable: Number(item.searchable ?? item.isSearchable ?? 0),
    sortable: Number(item.sortable ?? item.isSortable ?? 0),
    width: Number(item.width ?? item.listWidth ?? 120),
    colSpan: Number(item.colSpan ?? item.formColSpan ?? 24),
    rulesJson: item.rulesJson ?? item.validRules ?? '',
    status: Number(item.status ?? item.isEnabled ?? 1),
  };
}

function normalizeSchemaColumn(item: any): ColumnMetaApi.ColumnMeta {
  return {
    id: item.id,
    tableCode: item.tableCode ?? '',
    field: item.field ?? item.code ?? '',
    title: item.title ?? item.label ?? item.code ?? '',
    dataType: item.dataType ?? item.type ?? 'string',
    formType: item.formType ?? 'text',
    dictType: item.dictType ?? '',
    linkageJson: '',
    required: Number(item.required ?? item.isRequired ?? 0),
    isUnique: 0,
    showInList: Number(item.showInList ?? item.isShowInList ?? item.isVisible ?? 1),
    showInForm: Number(item.showInForm ?? item.isShowInForm ?? 1),
    showInExport: Number(item.showInExport ?? 0),
    searchable: Number(item.searchable ?? item.isSearchable ?? 0),
    sortable: Number(item.sortable ?? item.isSortable ?? 0),
    width: Number(item.width ?? 120),
    colSpan: Number(item.colSpan ?? 24),
    defaultValue: item.defaultValue ?? '',
    placeholder: item.placeholder ?? '',
    rulesJson: item.rulesJson ?? '',
    sortOrder: Number(item.sortOrder ?? 0),
    status: Number(item.status ?? 1),
    remark: '',
    componentProps: item.componentProps ?? '',
    dataSource: item.dataSource ?? '',
    apiUrl: item.apiUrl ?? '',
    labelField: item.labelField ?? '',
    valueField: item.valueField ?? '',
    sectionKey: item.sectionKey ?? '',
    i18nKey: item.i18nKey ?? '',
    visibleCondition: item.visibleCondition ?? '',
  };
}

export async function getColumnMetaList(params?: ColumnMetaQuery) {
  const tableCode = params?.tableCode;
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
  return requestClient.put(`/api/system/meta/column/${data.id}`, data, {
    responseReturn: 'body',
  });
}

export async function deleteColumnMeta(id: string | number) {
  return requestClient.delete(`/api/system/meta/column/${id}`, {
    responseReturn: 'body',
  });
}

export async function batchAddColumnMeta(data: Partial<ColumnMetaApi.ColumnMeta>[]) {
  return requestClient.post('/api/system/meta/column/batch', data, {
    responseReturn: 'body',
  });
}

export async function batchUpdateSortOrder(orders: SortOrderItem[]) {
  return requestClient.put('/api/system/meta/column/sort', orders, {
    responseReturn: 'body',
  });
}

export async function getTableMetaListForSelect() {
  const res = await requestClient.get<{
    total: number;
    rows: { id: number; tableCode: string; tableName: string }[];
  }>('/api/system/meta/table', {
    params: { pageNum: 1, pageSize: 1000 },
  });
  return res?.rows || [];
}

export async function getColumnMetaByTableId(tableCode: string) {
  const res = await requestClient.get<any>(
    `/api/system/meta/column/list/${tableCode}`,
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
