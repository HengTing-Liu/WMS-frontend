/**
 * Lowcode 妯″潡 - 鍏变韩绫诲瀷瀹氫箟
 * 涓庡悗绔?sys_table_meta / sys_column_meta / sys_table_operation 瀵归綈
 */

// ==================== 鍚庣杩斿洖绫诲瀷 ====================

/** 琛ㄥ厓鏁版嵁 */
export interface TableMeta {
  id?: number;
  tableCode: string;
  tableName: string;
  module: string;
  entityClass?: string;
  serviceClass?: string;
  apiPrefix?: string;
  permissionCode?: string;
  pageSize?: number;
  isTree?: number | boolean; // 0/1 鎴?true/false
  status?: number;
  remark?: string;
}

/** 字段元数据（ColumnMetaVO） */
export interface ColumnMeta {
  id?: number;
  tableCode: string;
  field: string;
  code?: string; // alias of field
  title?: string;
  label?: string; // alias of title
  dataType?: string;
  formType?: string;
  dictType?: string;
  linkageJson?: string;
  isShowInList?: number | boolean;
  isShowInForm?: number | boolean;
  isShowInExport?: number | boolean;
  isShowInImport?: number | boolean;
  isSearchable?: number | boolean;
  isSortable?: number | boolean;
  isRequired?: number | boolean;
  width?: number;
  sortOrder?: number;
  rulesJson?: string;
  placeholder?: string;
  defaultValue?: string;
  colSpan?: number;
  readonly?: number | boolean;
  editReadonly?: number | boolean;
  sectionKey?: string;
  sectionTitle?: string;
  sectionOrder?: number;
  sectionType?: 'card' | 'collapse' | string;
  sectionOpen?: number | boolean;
  i18nKey?: string;
  visibleCondition?: string;
  status?: number;
  // ========== Lookup 虚拟列配置（WMS-LOWCODE-LOOKUP） ==========
  /** 关联表 tableCode（存在 + refMatchField + refTargetField 非空 → 此字段为虚拟联表列） */
  refTableCode?: string;
  /** 关联表匹配字段(snake_case) */
  refMatchField?: string;
  /** 关联表展示字段(snake_case) */
  refTargetField?: string;
  /** 当前表外键字段(snake_case)，为空时默认取 field 的 snake_case */
  refLocalField?: string;
  /** 多字段拼接分隔符，仅多字段场景生效，空值时后端兜底为 ❤（WMS-LOWCODE-LOOKUP-SEP） */
  refSeparator?: string;
  /** 关联流水号规则编码（对应 sys_serial_number.usage_scope） */
  serialNumberRule?: string;
  // 运行时字段（后端自动填充）
  options?: Array<{ label: string; value: string | number }>;
  dataSource?: Array<{ label: string; value: string | number }>;
}

export interface LowcodeFormGroup {
  key: string;
  title: string;
  order: number;
  type: 'card' | 'collapse';
  defaultOpen: boolean;
  fields: ColumnMeta[];
}

export interface FormGroupMeta {
  id?: number;
  tableCode: string;
  groupCode: string;
  groupTitle: string;
  groupType?: 'card' | 'collapse' | string;
  sortOrder?: number;
  defaultOpen?: number | boolean;
  status?: number;
  remarks?: string;
}

/** 鎿嶄綔鎸夐挳閰嶇疆 */
export interface TableOperation {
  id?: number;
  tableCode: string;
  operationCode: string;
  operationName: string;
  operationType?: string;
  icon?: string;
  permission?: string;
  position?: 'toolbar' | 'row';
  sortOrder?: number;
  status?: number;
  // 鏂板瀛楁锛堟敮鎸佸伐鍏锋爮浜嬩欢閰嶇疆锛?  eventType?: string;
  eventConfig?: string;
  confirmMessage?: string;
  isEnabled?: number;
  showButton?: number | boolean;
}

// ==================== 鍓嶇瑙ｆ瀽鍚庣被鍨?====================

/** 鎼滅储鏍忓瓧娈碉紙涓?WmsSearchBar.SearchField 鍏煎锛?/
export interface LowcodeSearchField {
  key: string;
  label: string;
  type: 'input' | 'select' | 'switch';
  options?: { label: string; value: string | number }[];
}

/** 琛ㄦ牸鍒楅厤缃紙涓?ant-design-vue Table columns 鍏煎锛?/
export interface LowcodeColumn {
  title: string;
  dataIndex: string;
  key?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sorter?: boolean;
  customRender?: (opts: { text: any; record: any; index: number }) => any;
}

// ==================== 浜嬩欢閰嶇疆绫诲瀷 ====================

/** 浜嬩欢绫诲瀷 */
export type EventType = 'builtin' | 'api' | 'download' | 'upload' | 'redirect' | 'modal' | 'drawer' | 'custom';

/** 鍐呯疆鍔ㄤ綔閰嶇疆 */
export interface BuiltinEventConfig {
  handler: 'create' | 'edit' | 'read' | 'delete' | 'toggle' | 'export';
}

/** API 璋冪敤閰嶇疆 */
export interface ApiEventConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  payloadType: PayloadType;
  successMessage?: string;
  failMessage?: string;
}

/** 鏂囦欢涓嬭浇閰嶇疆 */
export interface DownloadEventConfig {
  url: string;
  method: 'GET' | 'POST';
  payloadType: PayloadType;
  fileName?: string;
  responseType?: 'blob';
}

/** 文件上传配置 */
export interface UploadEventConfig {
  url: string;
  method?: 'POST' | 'PUT';
  fileField?: string;
  extraParams?: Record<string, any>;
  accept?: string;
  successMessage?: string;
  failMessage?: string;
  updateSupport?: boolean;
}

/** 椤甸潰璺宠浆閰嶇疆 */
export interface RedirectEventConfig {
  path: string;
  query?: Record<string, string>;
}

/** 杞借嵎绫诲瀷 */
export type PayloadType = 'none' | 'filtered' | 'selected' | 'currentPage' | 'all';

/** 鎿嶄綔鎸夐挳瀹屾暣閰嶇疆 */
export interface LowcodeAction {
  key: string;
  label: string;
  type: 'primary' | 'default' | 'danger' | 'link';
  icon?: string;
  permission?: string;
  position: 'toolbar' | 'row';
  eventType?: EventType;
  eventConfig?: string | object;
  confirmMessage?: string;
  confirm?: string;
  status?: number;
  showButton?: number | boolean;
}
// ==================== 椤甸潰妯℃澘绫诲瀷 ====================

export type PageTemplate = 'standard-list' | 'tree-list';

/** LowcodePage 閰嶇疆椤?*/
export interface LowcodePageConfig {
  /** 琛ㄧ紪鐮侊紝瀵瑰簲 sys_table_meta.table_code */
  tableCode: string;
  /** 椤甸潰鏍囬 */
  pageTitle: string;
  /** 椤甸潰鎻忚堪 */
  pageDesc?: string;
  /** 椤甸潰妯℃澘 */
  template: PageTemplate;
  /** 椤甸潰鍏冩暟鎹紙浠庡悗绔姞杞斤紝鎴栧墠绔紶鍏ワ級*/
  tableMeta?: TableMeta;
  /** 瀛楁鍒楄〃 */
  columns?: ColumnMeta[];
  /** 鎿嶄綔鎸夐挳鍒楄〃 */
  operations?: TableOperation[];
  /** 鏄惁鏄剧ず缁熻鍗＄墖 */
  showStats?: boolean;
  /** 缁熻鍗＄墖閰嶇疆 */
  statsConfig?: StatsCardConfig[];
}

export interface StatsCardConfig {
  key: string;
  label: string;
  icon: string;
  color: string;
  /** 缁熻鍊煎瓧娈佃矾寰勶紝濡?'totalCount' */
  field: string;
  /** 鏍煎紡鍖栧嚱鏁?*/
  format?: (value: any) => string;
}

// ==================== 閫氱敤鍝嶅簲缁撴瀯 ====================

export interface ListResponse<T = any> {
  code?: number;
  data?: {
    rows: T[];
    total: number;
  };
  rows?: T[];
  total?: number;
  msg?: string;
}

export interface ApiResponse<T = any> {
  code?: number;
  data?: T;
  msg?: string;
}


