<template>
  <Page auto-content-height>
    <Grid>
      <!-- 工具栏插槽 -->
      <template #toolbar-tools>
        <div class="flex gap-2">
          <Button
            v-if="showAdd"
            v-access:code="`${permPrefix}:add`"
            type="primary"
            @click="handleAdd"
          >
            <IconifyIcon icon="material-symbols:add" class="size-4" />
            {{ $t('page.common.add') }}
          </Button>
          
          <Button
            v-if="showBatchDelete"
            v-access:code="`${permPrefix}:delete`"
            danger
            :disabled="selectedCount === 0"
            @click="handleBatchDelete"
          >
            <IconifyIcon icon="material-symbols:delete" class="size-4" />
            {{ $t('page.common.batchDelete') }}
          </Button>
          
          <Button
            v-if="showExport"
            v-access:code="`${permPrefix}:export`"
            @click="handleExport"
          >
            <IconifyIcon icon="bx:export" class="size-4" />
            {{ $t('page.common.export') }}
          </Button>
          
          <!-- 字段选择器 -->
          <Dropdown
            v-if="showQuery"
            v-model:open="showFieldSelector"
            :trigger="['click']"
          >
            <Button>
              <IconifyIcon icon="material-symbols:settings" class="size-4" />
              {{ $t('page.common.displayFields') }}
            </Button>
            <template #overlay>
              <div class="p-2 bg-white rounded shadow border min-w-[150px]" @click.stop>
                <div
                  v-for="field in queryFieldMetas"
                  :key="field.fieldCode"
                  class="py-1"
                >
                  <Checkbox
                    :checked="selectedQueryFields.includes(field.fieldCode)"
                    @change="(e) => toggleQueryField(field.fieldCode, e.target.checked)"
                  >
                    {{ field.fieldName }}
                  </Checkbox>
                </div>
              </div>
            </template>
          </Dropdown>
        </div>
      </template>
      
      <!-- 状态列插槽 -->
      <template #status="{ row }">
        <Switch
          v-model:checked="row.is_enabled"
          :checked-value="1"
          :un-checked-value="0"
          :checked-children="$t('page.common.enable')"
          :un-checked-children="$t('page.common.disable')"
          @change="(val) => handleStatusChange(row, val)"
        />
      </template>
      
      <!-- 操作列插槽 -->
      <template #action="{ row }">
        <div class="flex gap-2 justify-center">
          <Button
            v-if="showEdit"
            v-access:code="`${permPrefix}:edit`"
            type="link"
            size="small"
            @click="handleEdit(row)"
          >
            {{ $t('page.common.edit') }}
          </Button>
          
          <Popconfirm
            v-if="showDelete"
            v-access:code="`${permPrefix}:delete`"
            :title="$t('page.common.confirmDelete')"
            :ok-text="$t('page.common.confirm')"
            :cancel-text="$t('page.common.cancel')"
            @confirm="handleDelete(row)"
          >
            <Button danger type="link" size="small">{{ $t('page.common.delete') }}</Button>
          </Popconfirm>
        </div>
      </template>
    </Grid>
    
    <!-- 表单弹窗 -->
    <Modal
      v-model:open="formVisible"
      :title="formTitle"
      :width="600"
      :confirm-loading="submitting"
      :mask-closable="false"
      @ok="handleFormSubmit"
      @cancel="handleFormCancel"
    >
      <Form />
    </Modal>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h } from 'vue';
import { Page, useVbenForm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { Button, Switch, Popconfirm, Dropdown, Checkbox, Modal, message } from 'ant-design-vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '@vben/locales';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { VbenFormProps } from '#/adapter/form';
import type { CrudPageConfig, CrudApi, FieldMeta } from './types';
import { generateQuerySchema, generateTableColumns } from './types';

const props = withDefaults(
  defineProps<{
    /** 页面配置 */
    config: CrudPageConfig;
    /** API接口 */
    api: CrudApi;
    /** 是否显示查询表单 */
    showQuery?: boolean;
    /** 是否显示新增按钮 */
    showAdd?: boolean;
    /** 是否显示编辑按钮 */
    showEdit?: boolean;
    /** 是否显示删除按钮 */
    showDelete?: boolean;
    /** 是否显示批量删除 */
    showBatchDelete?: boolean;
    /** 是否显示导出 */
    showExport?: boolean;
  }>(),
  {
    showQuery: true,
    showAdd: true,
    showEdit: true,
    showDelete: true,
    showBatchDelete: true,
    showExport: true,
  }
);

const emit = defineEmits<{
  'form-success': [data: any, mode: 'add' | 'edit'];
  'form-cancel': [];
  'status-change': [row: any];
}>();

// 权限码前缀
const permPrefix = computed(() => props.config.permPrefix || props.config.tableCode);

// 选中的查询字段 - 初始化为所有查询字段，确保搜索栏正常显示
const selectedQueryFields = ref<string[]>(props.config.queryFields || []);

// 查询字段元数据
const queryFieldMetas = computed(() =>
  props.config.fieldMetas.filter((f) => props.config.queryFields.includes(f.fieldCode))
);

// 表格字段元数据
const tableFieldMetas = computed(() =>
  props.config.fieldMetas.filter((f) => props.config.tableFields.includes(f.fieldCode))
);

// 表单字段元数据
const formFieldMetas = computed(() =>
  props.config.fieldMetas.filter((f) => props.config.formFields.includes(f.fieldCode))
);

// 表单Schema
const formSchema = computed(() => {
  return formFieldMetas.value.map((field) => ({
    fieldName: field.fieldCode,
    label: field.fieldName,
    component: getComponentType(field.fieldType),
    componentProps: getComponentProps(field),
    rules: field.required
      ? [
          {
            required: true,
            message: $t('page.common.fieldRequired', { name: field.fieldName }),
            trigger: field.fieldType === 'select' || field.fieldType === 'boolean' ? 'change' : 'blur',
          },
        ]
      : undefined,
  }));
});

// 查询表单配置
const formOptions = computed<VbenFormProps>(() => ({
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  wrapperClass: 'grid-cols-4',
  schema: generateQuerySchema(queryFieldMetas.value, selectedQueryFields.value),
}));

// 表格列配置
const gridColumns = computed(() => {
  const columns: any[] = [
    { type: 'checkbox', width: 50, align: 'center', fixed: 'left' },
    { type: 'seq', title: $t('page.common.sequence'), width: 60, align: 'center' },
    ...generateTableColumns(tableFieldMetas.value),
    {
      field: 'action',
      title: $t('page.common.operation'),
      width: 200,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ];
  return columns;
});

// Grid配置
const gridOptions = computed<VxeTableGridOptions>(() => ({
  columns: gridColumns.value,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        if (!props.api?.page) {
          return { rows: [], total: 0 };
        }
        return await props.api.page({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
}));

// 使用Vben的Grid
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: formOptions.value,
  gridOptions: gridOptions.value,
  gridEvents: {
    checkboxChange: handleCheckboxChange,
    checkboxAll: handleCheckboxChange,
  },
});

// 使用Vben的Form
const [Form, formApi] = useVbenForm({
  schema: formSchema.value,
  showDefaultActions: false,
});

// 选中的行数
const selectedCount = ref(0);

// 字段选择器下拉框状态
const showFieldSelector = ref(false);

// 选中的行数据
const selectedRows = ref<any[]>([]);

// 表单相关
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const currentId = ref<any>(null);
const submitting = ref(false);
const formData = ref<Record<string, any>>({});
const formRef = ref();

// 表单标题
const formTitle = computed(() => {
  return formMode.value === 'add' 
    ? `${$t('page.common.add')}${props.config.tableName}` 
    : `${$t('page.common.edit')}${props.config.tableName}`;
});

// 获取组件类型
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

// 获取组件属性
function getComponentProps(field: FieldMeta) {
  const props: Record<string, any> = {
    placeholder: field.fieldType === 'select' || field.fieldType === 'boolean'
      ? $t('page.common.selectPlaceholder', { name: field.fieldName })
      : $t('page.common.inputPlaceholder', { name: field.fieldName }),
    allowClear: true,
  };

  switch (field.fieldType) {
    case 'select':
      props.options = field.options || [];
      break;
    case 'boolean':
      props.options = [
        { label: $t('page.common.yes'), value: 1 },
        { label: $t('page.common.no'), value: 0 },
      ];
      break;
    case 'textarea':
      props.rows = 4;
      props.showCount = true;
      props.maxLength = field.maxLength || 500;
      break;
    default:
      if (field.maxLength) {
        props.maxLength = field.maxLength;
      }
  }

  return props;
}

// 复选框变化
function handleCheckboxChange(params: any) {
  selectedRows.value = params.records || [];
  selectedCount.value = selectedRows.value.length;
}

// 切换查询字段
function toggleQueryField(fieldCode: string, checked: boolean) {
  if (checked) {
    if (!selectedQueryFields.value.includes(fieldCode)) {
      selectedQueryFields.value = [...selectedQueryFields.value, fieldCode];
    }
  } else {
    selectedQueryFields.value = selectedQueryFields.value.filter((f) => f !== fieldCode);
  }
  // 重新设置表单schema
  gridApi.formApi?.setState((prev) => ({
    ...prev,
    schema: generateQuerySchema(queryFieldMetas.value, selectedQueryFields.value),
  }));
}

// 新增
function handleAdd() {
  formMode.value = 'add';
  currentId.value = null;
  formData.value = {};
  formApi.setValues({});
  formVisible.value = true;
}

// 编辑
async function handleEdit(row: any) {
  formMode.value = 'edit';
  currentId.value = row[props.config.primaryKey || 'id'];
  
  // 获取详情
  if (props.api?.get) {
    try {
      const detail = await props.api.get(currentId.value);
      formData.value = { ...detail };
      formApi.setValues(detail);
    } catch (error) {
      console.error($t('page.common.getDetailFailed'), error);
      formData.value = { ...row };
      formApi.setValues(row);
    }
  } else {
    formData.value = { ...row };
    formApi.setValues(row);
  }
  
  formVisible.value = true;
}

// 删除
async function handleDelete(row: any) {
  if (!props.api?.delete) return;
  
  try {
    const id = row[props.config.primaryKey || 'id'];
    await props.api.delete(id);
    message.success($t('page.common.deleteSuccess'));
    gridApi.reload();
  } catch (error) {
    console.error($t('page.common.deleteFailed'), error);
      message.error($t('page.common.deleteFailed'));
  }
}

// 批量删除
async function handleBatchDelete() {
  if (!props.api?.batchDelete || selectedRows.value.length === 0) return;
  
  try {
    const ids = selectedRows.value.map((row) => row[props.config.primaryKey || 'id']);
    await props.api.batchDelete(ids);
    message.success($t('page.common.batchDeleteSuccess'));
    selectedRows.value = [];
    selectedCount.value = 0;
    gridApi.reload();
  } catch (error) {
    console.error($t('page.common.batchDeleteFailed'), error);
    message.error($t('page.common.batchDeleteFailed'));
  }
}

// 导出
async function handleExport() {
  if (!props.api?.export) {
    message.warning($t('page.common.exportNotConfigured'));
    return;
  }
  
  try {
    const formValues = await gridApi.formApi?.getValues?.();
    const blob = await props.api.export(formValues);
    
    // 下载文件
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${props.config.tableName}_${$t('page.common.export')}_${new Date().getTime()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    message.success($t('page.common.exportSuccess'));
  } catch (error) {
    console.error($t('page.common.exportFailed'), error);
    message.error($t('page.common.exportFailed'));
  }
}

// 状态变更
async function handleStatusChange(row: any, value: boolean | number) {
  // 计算新的状态值
  const currentValue = row.is_enabled !== undefined ? row.is_enabled : row.status;
  const newValue = value !== undefined ? value : (currentValue === 1 ? 0 : 1);
  
  // 检查API是否支持状态变更
  if (!props.api?.edit) {
    message.error($t('page.common.statusChangeNotConfigured'));
    return;
  }
  
  try {
    const id = row[props.config.primaryKey || 'id'];
    const statusField = row.is_enabled !== undefined ? 'is_enabled' : 'status';
    
    // 调用编辑接口更新状态
    await props.api.edit({
      ...row,
      [props.config.primaryKey || 'id']: id,
      [statusField]: newValue,
    });
    
    message.success(newValue === 1 ? $t('page.common.enableSuccess') : $t('page.common.disableSuccess'));
    
    // 刷新表格
    gridApi.reload();
    
    // 触发事件
    emit('status-change', { ...row, [statusField]: newValue });
  } catch (error) {
    console.error($t('page.common.statusChangeFailed'), error);
    message.error($t('page.common.statusChangeFailed'));
    // 刷新表格以恢复原始状态显示
    gridApi.reload();
  }
}

// 表单提交
async function handleFormSubmit() {
  try {
    const validationResult = await formApi.validate();
    
    // 从验证结果中提取实际的表单数据
    // formApi.validate() 返回的是验证结果对象，包含 valid, results, errors, values, source 等字段
    // 我们需要只提取实际的表单字段数据
    const values = validationResult.values || validationResult;
    
    // 进一步过滤，确保只包含表单字段，不包含验证结果字段
    const formFieldCodes = formFieldMetas.value.map(f => f.fieldCode);
    const submitData: Record<string, any> = {};
    formFieldCodes.forEach(code => {
      if (values[code] !== undefined) {
        submitData[code] = values[code];
      }
    });
    
    submitting.value = true;
    
    let res;
    if (formMode.value === 'add') {
      if (!props.api?.add) {
      message.error($t('page.common.addNotConfigured'));
        return;
      }
      res = await props.api.add(submitData);
    } else {
      if (!props.api?.edit) {
        message.error($t('page.common.editNotConfigured'));
        return;
      }
      res = await props.api.edit({
        ...submitData,
        [props.config.primaryKey || 'id']: currentId.value,
      });
    }
    
    message.success(formMode.value === 'add' ? $t('page.common.addSuccess') : $t('page.common.editSuccess'));
    formVisible.value = false;
    emit('form-success', submitData, formMode.value);
    gridApi.reload();
  } catch (error: any) {
    console.error($t('page.common.submitFailed'), error);
    if (error?.errorFields) {
      return;
    }
    message.error($t('page.common.submitFailed'));
  } finally {
    submitting.value = false;
  }
}

// 表单取消
function handleFormCancel() {
  formVisible.value = false;
  emit('form-cancel');
}

// 初始化
onMounted(() => {
  // 搜索字段已在初始化时设置，无需重复设置
});

// 暴露方法
defineExpose({
  reload: () => gridApi.reload(),
  getSelectedRows: () => selectedRows.value,
  clearSelection: () => {
    selectedRows.value = [];
    selectedCount.value = 0;
  },
});
</script>
