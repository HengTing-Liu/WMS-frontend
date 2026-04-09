/**
 * Lowcode 模块 - 共享类型定义
 * 与后端 sys_table_meta / sys_column_meta / sys_table_operation 对齐
 */

// ==================== 后端返回类型 ====================

/** 表元数据 */
export interface TableMeta {
  id?: number;
  tableCode: string;
  tableName: string;
  module: string;
  entityClass?: string;
  serviceClass?: string;
  permissionCode?: string;
  pageSize?: number;
  isTree?: number | boolean; // 0/1 或 true/false
  status?: number;
  remark?: string;
}

/** 字段元数据（ColumnMetaVO）*/
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
  isSearchable?: number | boolean;
  isSortable?: number | boolean;
  isRequired?: number | boolean;
  width?: number;
  sortOrder?: number;
  rulesJson?: string;
  placeholder?: string;
  defaultValue?: string;
  colSpan?: number;
  sectionKey?: string;
  i18nKey?: string;
  visibleCondition?: string;
  status?: number;
  // 运行时字段（后端自动填充）
  options?: Array<{ label: string; value: string | number }>;
  dataSource?: Array<{ label: string; value: string | number }>;
}

/** 操作按钮配置 */
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
}

// ==================== 前端解析后类型 ====================

/** 搜索栏字段（与 WmsSearchBar.SearchField 兼容）*/
export interface LowcodeSearchField {
  key: string;
  label: string;
  type: 'input' | 'select' | 'switch';
  options?: { label: string; value: string | number }[];
}

/** 表格列配置（与 ant-design-vue Table columns 兼容）*/
export interface LowcodeColumn {
  title: string;
  dataIndex: string;
  key?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sorter?: boolean;
  customRender?: (opts: { text: any; record: any; index: number }) => any;
}

/** 操作按钮 */
export interface LowcodeAction {
  key: string;
  label: string;
  type: 'primary' | 'default' | 'danger' | 'link';
  icon?: string;
  permission?: string;
  position: 'toolbar' | 'row';
  confirm?: string;
}

// ==================== 页面模板类型 ====================

export type PageTemplate = 'standard-list' | 'tree-list';

/** LowcodePage 配置项 */
export interface LowcodePageConfig {
  /** 表编码，对应 sys_table_meta.table_code */
  tableCode: string;
  /** 页面标题 */
  pageTitle: string;
  /** 页面描述 */
  pageDesc?: string;
  /** 页面模板 */
  template: PageTemplate;
  /** 页面元数据（从后端加载，或前端传入）*/
  tableMeta?: TableMeta;
  /** 字段列表 */
  columns?: ColumnMeta[];
  /** 操作按钮列表 */
  operations?: TableOperation[];
  /** 是否显示统计卡片 */
  showStats?: boolean;
  /** 统计卡片配置 */
  statsConfig?: StatsCardConfig[];
}

export interface StatsCardConfig {
  key: string;
  label: string;
  icon: string;
  color: string;
  /** 统计值字段路径，如 'totalCount' */
  field: string;
  /** 格式化函数 */
  format?: (value: any) => string;
}

// ==================== 通用响应结构 ====================

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
