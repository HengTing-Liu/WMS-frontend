<template>
  <div class="data-table-container">
    <Grid>
      <!-- 工具栏插槽 -->
      <template #toolbar-tools>
        <slot name="toolbar-tools">
          <div class="flex gap-2">
            <!-- 刷新按钮 -->
            <Button @click="handleRefresh">
              <IconifyIcon icon="material-symbols:refresh" class="size-4" />
              {{ $t('page.common.refresh') || '刷新' }}
            </Button>
            
            <!-- 清除筛选按钮 -->
            <Button @click="handleClearFilters">
              <IconifyIcon icon="material-symbols:filter-alt-off" class="size-4" />
              {{ $t('page.common.clearFilters') || '清除筛选' }}
            </Button>
            
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
          </div>
        </slot>
      </template>
      <!-- 状态列插槽 -->
      <template #status="{ row }">
        <Switch
          v-model:checked="row.is_enabled"
          :checked-value="1"
          :un-checked-value="0"
          :checked-children="$t('page.common.enabled')"
          :un-checked-children="$t('page.common.disabled')"
          @change="(val) => handleStatusChange(row, val)"
        />
      </template>
      
      <!-- 操作列插槽 -->
      <template #action="{ row }">
        <div class="flex gap-2 justify-center">
          <Button
            v-if="showView"
            v-access:code="`${permPrefix}:query`"
            type="link"
            size="small"
            @click="handleView(row)"
          >
            {{ $t('page.common.view') }}
          </Button>
          
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
            :title="$t('page.common.confirmDeleteRecord')"
            :ok-text="$t('page.common.confirm')"
            :cancel-text="$t('page.common.cancel')"
            @confirm="handleDelete(row)"
          >
            <Button danger type="link" size="small">{{ $t('page.common.delete') }}</Button>
          </Popconfirm>
        </div>
      </template>
    </Grid>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Button, Switch, Popconfirm, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import type { FieldMeta, DataTableConfig, CrudApi } from './types';
import { $t } from '#/locales';

const props = withDefaults(
  defineProps<{
    /** 表格配置 */
    config: DataTableConfig;
    /** API接口 */
    api: CrudApi;
    /** 权限码前缀 */
    permPrefix: string;
    /** 是否显示新增按钮 */
    showAdd?: boolean;
    /** 是否显示编辑按钮 */
    showEdit?: boolean;
    /** 是否显示删除按钮 */
    showDelete?: boolean;
    /** 是否显示查看按钮 */
    showView?: boolean;
    /** 是否显示批量删除 */
    showBatchDelete?: boolean;
    /** 是否显示导出 */
    showExport?: boolean;
    /** 查询参数 */
    queryParams?: Record<string, any>;
    /** 主键字段 */
    primaryKey?: string;
  }>(),
  {
    showAdd: true,
    showEdit: true,
    showDelete: true,
    showView: false,
    showBatchDelete: true,
    showExport: true,
    queryParams: () => ({}),
    primaryKey: 'id',
  }
);

const emit = defineEmits<{
  add: [];
  edit: [row: any];
  view: [row: any];
  delete: [row: any];
  'batch-delete': [rows: any[]];
  export: [];
  'status-change': [row: any];
  'selection-change': [rows: any[]];
  'page-change': [page: { currentPage: number; pageSize: number }];
}>();

// 选中的行数
const selectedCount = ref(0);

// 选中的行数据
const selectedRows = ref<any[]>([]);

// 分页信息
const lastPageInfo = ref({
  currentPage: 1,
  pageSize: 20,
});

// 根据字段元数据生成列配置
const tableColumns = computed(() => {
  const columns: any[] = [];
  
  // Checkbox列
  if (props.config.showCheckbox !== false) {
    columns.push({
      type: 'checkbox',
      width: 50,
      align: 'center',
      fixed: 'left',
    });
  }
  
  // 序号列
  if (props.config.showSeq !== false) {
    columns.push({
      type: 'seq',
      title: $t('page.common.seq'),
      width: 60,
      align: 'center',
    });
  }
  
  // 数据列
  props.config.fields.forEach((field: FieldMeta) => {
    const column: any = {
      field: field.fieldCode,
      title: field.fieldName,
      minWidth: 120,
      showOverflow: 'tooltip',
      sortable: true, // 启用列排序功能
    };
    
    // 特殊字段处理
    if (field.fieldType === 'boolean') {
      column.slots = { default: 'status' };
    }
    
    // 日期格式化
    if (field.fieldType === 'date' || field.fieldType === 'datetime') {
      column.formatter = field.fieldType === 'date' ? 'formatDate' : 'formatDateTime';
    }
    
    columns.push(column);
  });
  
  // 操作列
  if (props.config.actionColumn !== false) {
    columns.push({
      field: 'action',
      title: $t('page.common.operation'),
      width: props.config.actionColumn?.width || 200,
      fixed: props.config.actionColumn?.fixed || 'right',
      slots: { default: 'action' },
    });
  }
  
  return columns;
});

// 自定义插槽列表
const customSlots = computed(() => {
  const slots: string[] = [];
  props.config.fields.forEach((field: FieldMeta) => {
    if (field.fieldType === 'boolean') {
      slots.push('status');
    }
  });
  slots.push('action');
  return [...new Set(slots)];
});

// Grid配置
const gridOptions = computed<VxeTableGridOptions>(() => ({
  columns: tableColumns.value,
  pagerConfig: {
    enabled: true,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  sortConfig: {
    multiple: true,
    trigger: 'cell',
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        lastPageInfo.value = {
          currentPage: page.currentPage,
          pageSize: page.pageSize,
        };
        
        if (!props.api?.page) {
          return { rows: [], total: 0 };
        }
        
        return await props.api.page({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...props.queryParams,
          ...formValues,
        });
      },
    },
  },
}));

// 使用Vben的Grid
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: gridOptions.value,
  gridEvents: {
    checkboxChange: handleCheckboxChange,
    checkboxAll: handleCheckboxChange,
  },
});

// 复选框变化
const handleCheckboxChange = (params: any) => {
  selectedRows.value = params.records || [];
  selectedCount.value = selectedRows.value.length;
  emit('selection-change', selectedRows.value);
};

// 新增
const handleAdd = () => {
  emit('add');
};

// 编辑
const handleEdit = (row: any) => {
  emit('edit', row);
};

// 查看
const handleView = (row: any) => {
  emit('view', row);
};

// 删除
const handleDelete = async (row: any) => {
  if (!props.api?.delete) return;
  
  try {
    const id = row[props.primaryKey];
    await props.api.delete(id);
    message.success($t('page.common.deleteSuccess'));
    emit('delete', row);
    reload();
  } catch (error) {
    console.error($t('page.common.deleteFailed'), error);
    message.error($t('page.common.deleteFailed'));
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (!props.api?.batchDelete || selectedRows.value.length === 0) return;
  
  try {
    const ids = selectedRows.value.map((row) => row[props.primaryKey]);
    await props.api.batchDelete(ids);
    message.success($t('page.common.batchDeleteSuccess'));
    emit('batch-delete', selectedRows.value);
    selectedRows.value = [];
    selectedCount.value = 0;
    reload();
  } catch (error) {
    console.error($t('page.common.batchDeleteFailed'), error);
    message.error($t('page.common.batchDeleteFailed'));
  }
};

// 导出
const handleExport = () => {
  emit('export');
};

// 刷新表格
const handleRefresh = () => {
  gridApi.reload();
};

// 清除筛选（重置表单）
const handleClearFilters = () => {
  gridApi.reload();
};

// 状态变更
async function handleStatusChange(row: any, value: boolean | number) {
  // 检查API是否支持编辑
  if (!props.api?.edit) {
    message.error($t('page.common.statusChangeNotConfigured'));
    return;
  }
  
  try {
    const id = row[props.primaryKey || 'id'];
    const newValue = value !== undefined ? value : (row.is_enabled === 1 ? 0 : 1);
    
    // 调用编辑接口更新状态
    await props.api.edit({
      ...row,
      [props.primaryKey || 'id']: id,
      is_enabled: newValue,
    });
    
    message.success(newValue === 1 ? $t('page.common.enableSuccess') : $t('page.common.disableSuccess'));
    
    // 刷新表格
    gridApi.reload();
    
    // 触发事件
    emit('status-change', { ...row, is_enabled: newValue });
  } catch (error) {
    console.error($t('page.common.statusChangeFailed'), error);
    message.error($t('page.common.statusChangeFailed'));
    // 刷新表格以恢复原始状态显示
    gridApi.reload();
  }
}

// 刷新
const reload = () => {
  gridApi.reload();
};

// 查询
const query = (params?: Record<string, any>) => {
  gridApi.query(params);
};

// 监听查询参数变化
watch(
  () => props.queryParams,
  () => {
    reload();
  },
  { deep: true }
);

// 暴露方法
defineExpose({
  reload,
  query,
  getSelectedRows: () => selectedRows.value,
  clearSelection: () => {
    selectedRows.value = [];
    selectedCount.value = 0;
  },
});
</script>

<style scoped>
.data-table-container {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
</style>
