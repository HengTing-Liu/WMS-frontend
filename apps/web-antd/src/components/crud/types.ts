import type { VbenFormSchema, VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/**
 * 字段元数据
 */
export interface FieldMeta {
  /** 字段编码 */
  fieldCode: string;
  /** 字段名称 */
  fieldName: string;
  /** 字段类型 */
  fieldType: 'string' | 'number' | 'date' | 'datetime' | 'boolean' | 'select' | 'textarea';
  /** 是否必填 */
  required?: boolean;
  /** 最大长度 */
  maxLength?: number;
  /** 排序 */
  sort?: number;
  /** 下拉选项（仅select类型） */
  options?: { label: string; value: any }[];
  /** 是否查询字段 */
  isQuery?: boolean;
  /** 是否列表显示 */
  isList?: boolean;
  /** 是否表单字段 */
  isForm?: boolean;
  /** 查询方式：等于、模糊、范围等 */
  queryType?: 'eq' | 'like' | 'between' | 'gt' | 'lt';
  /** 默认值 */
  defaultValue?: any;
}

/**
 * 数据表格配置
 */
export interface DataTableConfig {
  /** 字段元数据列表 */
  fields: FieldMeta[];
  /** 是否显示复选框列 */
  showCheckbox?: boolean;
  /** 是否显示序号列 */
  showSeq?: boolean;
  /** 操作列配置 */
  actionColumn?: {
    width?: number;
    fixed?: 'left' | 'right';
  } | false;
}
export interface CrudPageConfig {
  /** 表编码 */
  tableCode: string;
  /** 表名称 */
  tableName: string;
  /** 查询字段列表 */
  queryFields: string[];
  /** 表格字段列表 */
  tableFields: string[];
  /** 表单字段列表 */
  formFields: string[];
  /** 所有字段元数据 */
  fieldMetas: FieldMeta[];
  /** 主键字段 */
  primaryKey?: string;
  /** 是否启用批量操作 */
  enableBatch?: boolean;
  /** 是否启用导出 */
  enableExport?: boolean;
  /** 是否启用导入 */
  enableImport?: boolean;
  /** 权限码前缀 */
  permPrefix?: string;
}

/**
 * CRUD API接口
 */
export interface CrudApi<T = any> {
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
  /** 导入 */
  import?: (file: File) => Promise<any>;
}

/**
 * 根据字段元数据生成表单Schema
 */
export function generateFormSchema(fieldMetas: FieldMeta[]): VbenFormSchema[] {
  return fieldMetas.map((field) => {
    const schema: VbenFormSchema = {
      fieldName: field.fieldCode,
      label: field.fieldName,
      component: getComponentType(field.fieldType),
    };

    // 组件属性
    const componentProps: Record<string, any> = {
      placeholder: getPlaceholder(field),
      allowClear: true,
    };

    // 根据类型添加特定属性
    switch (field.fieldType) {
      case 'select':
        componentProps.options = field.options || [];
        break;
      case 'boolean':
        componentProps.options = [
          { label: '是', value: 1 },
          { label: '否', value: 0 },
        ];
        break;
      case 'textarea':
        componentProps.rows = 4;
        componentProps.showCount = true;
        componentProps.maxLength = field.maxLength || 500;
        break;
      default:
        if (field.maxLength) {
          componentProps.maxLength = field.maxLength;
        }
    }

    schema.componentProps = componentProps;

    // 规则
    if (field.required) {
      schema.rules = [
        {
          required: true,
          message: `${field.fieldName}不能为空`,
          trigger: field.fieldType === 'select' || field.fieldType === 'boolean' ? 'change' : 'blur',
        },
      ];
    }

    return schema;
  });
}

/**
 * 根据字段元数据生成查询表单Schema
 */
export function generateQuerySchema(fieldMetas: FieldMeta[], visibleFields: string[]): VbenFormSchema[] {
  const queryFields = fieldMetas.filter(
    (f) => visibleFields.includes(f.fieldCode) && f.isQuery !== false
  );

  return queryFields.map((field) => {
    const schema: VbenFormSchema = {
      fieldName: field.fieldCode,
      label: field.fieldName,
      component: getComponentType(field.fieldType),
      formItemClass: 'col-span-1',
      labelWidth: 80,
    };

    // 组件属性
    const componentProps: Record<string, any> = {
      placeholder: getPlaceholder(field),
      allowClear: true,
    };

    // 根据类型添加特定属性
    switch (field.fieldType) {
      case 'select':
        componentProps.options = field.options || [];
        break;
      case 'boolean':
        componentProps.options = [
          { label: '是', value: 1 },
          { label: '否', value: 0 },
        ];
        break;
    }

    schema.componentProps = componentProps;

    return schema;
  });
}

/**
 * 根据字段类型获取组件类型
 */
function getComponentType(fieldType: string): string {
  const typeMap: Record<string, string> = {
    string: 'Input',
    number: 'InputNumber',
    date: 'DatePicker',
    datetime: 'RangePicker',
    boolean: 'Select',
    select: 'Select',
    textarea: 'Textarea',
  };
  return typeMap[fieldType] || 'Input';
}

/**
 * 获取placeholder
 */
function getPlaceholder(field: FieldMeta): string {
  if (field.fieldType === 'select' || field.fieldType === 'boolean') {
    return `请选择${field.fieldName}`;
  }
  return `请输入${field.fieldName}`;
}

/**
 * 根据字段元数据生成表格列配置
 */
export function generateTableColumns(fieldMetas: FieldMeta[]) {
  return fieldMetas.map((field) => {
    const column: any = {
      field: field.fieldCode,
      title: field.fieldName,
      minWidth: 120,
      showOverflow: 'tooltip',
    };

    // 日期格式化
    if (field.fieldType === 'date' || field.fieldType === 'datetime') {
      column.formatter = field.fieldType === 'date' ? 'formatDate' : 'formatDateTime';
    }

    // 状态列使用插槽
    if (field.fieldType === 'boolean') {
      column.slots = { default: 'status' };
    }

    return column;
  });
}
