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
}

// 列元数据类型
export interface ColumnMeta {
  id?: number;
  tableCode: string;
  field: string;
  title: string;
  dataType: string;
  formType: string;
  dictType?: string;
  linkageJson?: string;
  isShowInList: boolean;
  isShowInForm: boolean;
  isSearchable: boolean;
  isSortable: boolean;
  isRequired: boolean;
  width?: number;
  sortOrder: number;
  rulesJson?: string;
  placeholder?: string;
  defaultValue?: string;
}

// 操作按钮类型
export interface TableOperation {
  id?: number;
  tableCode: string;
  operationCode: string;
  operationName: string;
  operationType: string;
  buttonType: string;
  icon?: string;
  permission?: string;
  position: string;
  sortOrder: number;
}
