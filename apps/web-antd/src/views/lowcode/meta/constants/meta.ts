// 数据类型
export const DATA_TYPES = [
  { label: '字符串', value: 'string' },
  { label: '整数', value: 'int' },
  { label: '长整数', value: 'bigint' },
  { label: '小数', value: 'decimal' },
  { label: '日期', value: 'date' },
  { label: $t('page.lowcode.meta.typeDatetime'), value: 'datetime' },
  { label: '布尔', value: 'boolean' },
  { label: '文本', value: 'text' }
];

// 表单类型
export const FORM_TYPES = [
  { label: '输入框', value: 'input' },
  { label: $t('page.lowcode.meta.typeNumber'), value: 'number' },
  { label: '下拉选择', value: 'select' },
  { label: '日期', value: 'date' },
  { label: $t('page.lowcode.meta.typeDatetime'), value: 'datetime' },
  { label: '多行文本', value: 'textarea' },
  { label: $t('page.lowcode.meta.typeSwitch'), value: 'switch' },
  { label: '单选', value: 'radio' },
  { label: '多选', value: 'checkbox' },
  { label: '级联', value: 'cascader' }
];

// 模块选项
export const MODULE_OPTIONS = [
  { label: '基础数据', value: 'base' },
  { label: '仓库管理', value: 'wms' },
  { label: '系统管理', value: 'sys' }
];

// 操作类型
export const OPERATION_TYPES = [
  { label: '按钮', value: 'button' },
  { label: '链接', value: 'link' },
  { label: '图标', value: 'icon' }
];

// 按钮样式
export const BUTTON_TYPES = [
  { label: '主要', value: 'primary' },
  { label: '默认', value: 'default' },
  { label: '危险', value: 'danger' },
  { label: '虚线', value: 'dashed' },
  { label: '文字', value: 'text' }
];

// 位置选项
export const POSITION_OPTIONS = [
  { label: '工具栏', value: 'toolbar' },
  { label: '行内', value: 'row' }
];
