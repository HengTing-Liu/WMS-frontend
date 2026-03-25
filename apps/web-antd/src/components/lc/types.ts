import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/**
 * 字段类型
 */
export type FieldType = 'string' | 'number' | 'date' | 'datetime' | 'boolean' | 'select' | 'textarea';

/**
 * 字段元数据
 */
export interface LcFieldMeta {
  /** 字段编码 */
  fieldCode: string;
  /** 字段名称 */
  fieldName: string;
  /** 字段类型 */
  fieldType: FieldType;
  /** 是否必填 */
  required?: boolean;
  /** 最大长度 */
  maxLength?: number;
  /** 排序 */
  sort?: number;
  /** 下拉选项 */
  options?: { label: string; value: any }[];
  /** 默认值 */
  defaultValue?: any;
  /** 日期格式 */
  format?: string;
}

/**
 * 表格列配置
 */
export interface LcTableColumn {
  /** 字段编码 */
  field: string;
  /** 列标题 */
  title: string;
  /** 宽度 */
  width?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 列类型: seq/checkbox/select */
  type?: 'seq' | 'checkbox' | 'select';
  /** 固定列 */
  fixed?: 'left' | 'right';
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否溢出省略 */
  showOverflow?: boolean | 'tooltip' | 'ellipsis';
  /** 插槽名 */
  slots?: string;
  /** 自定义渲染 */
  formatter?: (row: any) => string;
}

/**
 * 操作按钮配置
 */
export interface LcTableAction {
  /** 唯一标识 */
  key: string;
  /** 按钮文字 */
  label: string;
  /** 图标 */
  icon?: string;
  /** 危险操作 */
  danger?: boolean;
  /** 权限码(会自动拼接 permPrefix) */
  perm?: string;
  /** 自定义点击处理 */
  onClick?: (row: any, btn: LcTableAction) => void;
}

/**
 * CRUD API 接口
 */
export interface LcCrudApi<T = any> {
  /** 分页查询 */
  page: (params: any) => Promise<{ rows: T[]; total: number }>;
  /** 获取详情 */
  get?: (id: any) => Promise<T>;
  /** 新增 */
  add?: (data: T) => Promise<any>;
  /** 修改 */
  edit?: (data: T) => Promise<any>;
  /** 删除 */
  delete?: (id: any) => Promise<any>;
  /** 批量删除 */
  batchDelete?: (ids: any[]) => Promise<any>;
  /** 导出 */
  export?: (params: any) => Promise<Blob>;
}

/**
 * 分页配置
 */
export interface LcPagination {
  /** 每页条数 */
  pageSize?: number;
  /** 可选分页条数 */
  pageSizes?: number[];
  /** 是否显示条数切换 */
  showSizeChanger?: boolean;
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean;
}

/**
 * LcTable 属性
 */
export interface LcTableProps {
  /** 列配置 */
  columns: LcTableColumn[];
  /** 数据API */
  api: LcCrudApi;
  /** 权限前缀 */
  permPrefix?: string;
  /** 是否显示复选框 */
  showCheckbox?: boolean;
  /** 是否显示序号 */
  showSeq?: boolean;
  /** 操作列配置 */
  actions?: LcTableAction[];
  /** 分页配置 */
  pagination?: LcPagination | false;
  /** 表格尺寸 */
  size?: 'small' | 'middle' | 'large';
  /** 主键字段 */
  primaryKey?: string;
  /** 额外查询参数 */
  queryParams?: Record<string, any>;
}

/**
 * LcForm 字段配置
 */
export interface LcFormField {
  /** 字段编码 */
  fieldCode: string;
  /** 字段名称 */
  fieldName: string;
  /** 字段类型 */
  fieldType: FieldType;
  /** 是否必填 */
  required?: boolean;
  /** 最大长度 */
  maxLength?: number;
  /** 下拉选项 */
  options?: { label: string; value: any }[];
  /** 默认值 */
  defaultValue?: any;
  /** 组件额外属性 */
  componentProps?: Record<string, any>;
  /** 占位符 */
  placeholder?: string;
}

/**
 * LcForm 属性
 */
export interface LcFormProps {
  /** 字段配置 */
  fields: LcFormField[];
  /** 弹窗模式: modal | drawer */
  mode?: 'modal' | 'drawer';
  /** 宽度 */
  width?: number;
  /** 抽屉方向 */
  placement?: 'left' | 'right' | 'top' | 'bottom';
  /** 标签列数 */
  labelCol?: { span: number };
  /** 内容列数 */
  wrapperCol?: { span: number };
  /** API */
  api?: LcCrudApi;
  /** 主键字段 */
  primaryKey?: string;
}

/**
 * LcSearchBar 字段配置
 */
export interface LcSearchField {
  /** 字段编码 */
  fieldCode: string;
  /** 字段名称 */
  fieldName: string;
  /** 字段类型 */
  fieldType: FieldType;
  /** 下拉选项 */
  options?: { label: string; value: any }[];
  /** 占位符 */
  placeholder?: string;
  /** 查询方式 */
  queryType?: 'eq' | 'like' | 'between' | 'gt' | 'lt';
}

/**
 * LcSearchBar 属性
 */
export interface LcSearchBarProps {
  /** 字段配置 */
  fields: LcSearchField[];
  /** 布局列数 */
  columns?: number;
  /** 是否显示字段选择器 */
  showFieldSelector?: boolean;
  /** 默认显示字段 */
  defaultVisibleFields?: string[];
  /** API (用于联动查询) */
  api?: LcCrudApi;
}
