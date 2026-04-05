import type { TableOperation, ColumnMeta, TableMeta } from './meta';

/**
 * OperationForm 组件 Props 类型
 */
export interface TableOperationFormProps {
  modelValue?: Partial<TableOperation>;
  readonly?: boolean;
  disabledFields?: string[];
  visibleFields?: string[];
  availableOperationTypes?: string[];
  availableButtonTypes?: string[];
  availablePositions?: string[];
}

/**
 * OperationForm 组件 Emits 类型
 */
export interface TableOperationFormEmits {
  (e: 'update:modelValue', value: Partial<TableOperation>): void;
}

/**
 * ColumnMetaForm 组件 Props 类型
 */
export interface ColumnMetaFormProps {
  modelValue?: Partial<ColumnMeta>;
  readonly?: boolean;
  disabledFields?: string[];
  visibleFields?: string[];
  showAdvanced?: boolean;
  hideHelpText?: boolean;
}

/**
 * ColumnMetaForm 组件 Emits 类型
 */
export interface ColumnMetaFormEmits {
  (e: 'update:modelValue', value: Partial<ColumnMeta>): void;
}

/**
 * TableMetaForm 组件 Props 类型
 */
export interface TableMetaFormProps {
  modelValue?: Partial<TableMeta>;
  readonly?: boolean;
  disabledFields?: string[];
  visibleFields?: string[];
}

/**
 * TableMetaForm 组件 Emits 类型
 */
export interface TableMetaFormEmits {
  (e: 'update:modelValue', value: Partial<TableMeta>): void;
}
