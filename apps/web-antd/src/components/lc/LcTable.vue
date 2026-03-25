<template>
  <div class="lc-table-container">
    <Grid>
      <!-- 操作列插槽 -->
      <template #action="{ row }">
        <div class="flex gap-2 justify-center">
          <template v-for="btn in visibleActions" :key="btn.key">
            <Button
              :type="btn.danger ? 'link' : 'link'"
              :danger="btn.danger"
              size="small"
              @click="handleAction(btn, row)"
            >
              {{ btn.label }}
            </Button>
          </template>
        </div>
      </template>

      <!-- 状态列插槽 -->
      <template v-for="slot in statusSlots" :key="slot" #[slot]="{ row }">
        <Switch
          :checked="row.is_enabled !== undefined ? row.is_enabled : row.status"
          :checked-value="1"
          :un-checked-value="0"
          :checked-children="$t('page.common.enabled')"
          :un-checked-children="$t('page.common.disabled')"
          @change="(val) => handleStatusChange(row, val)"
        />
      </template>
    </Grid>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Button, Switch, Popconfirm, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import dayjs from 'dayjs';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  LcTableProps,
  LcTableColumn,
  LcTableAction,
  LcCrudApi,
} from './types';

const props = withDefaults(defineProps<LcTableProps>(), {
  showCheckbox: true,
  showSeq: true,
  pagination: () => ({ pageSize: 20, pageSizes: [10, 20, 50, 100] }),
  size: 'middle',
  primaryKey: 'id',
  queryParams: () => ({}),
  actions: () => [],
});

const emit = defineEmits<{
  'row-click': [row: any];
  'selection-change': [rows: any[]];
  'status-change': [row: any];
  'action': [action: LcTableAction, row: any];
  'add': [];
  'edit': [row: any];
  'delete': [row: any];
  'batch-delete': [rows: any[]];
}>();

// 选中的行数据
const selectedRows = ref<any[]>([]);
const selectedCount = computed(() => selectedRows.value.length);

// 可见的操作按钮
const visibleActions = computed(() => {
  return props.actions.filter((btn) => {
    if (!btn.perm || !props.permPrefix) return true;
    // 权限检查由 v-access:code 指令处理，这里只做过滤
    return true;
  });
});

// 状态列插槽列表 - 去除 [grid] 前缀
const statusSlots = computed(() => {
  return props.columns
    .filter((col) => col.type === undefined && col.slots?.startsWith('status'))
    .map((col) => {
      const slotName = col.slots!;
      // 去除 [grid] 前缀（如果有）
      return slotName.replace(/^\[grid\]\s*/, '');
    });
});

// 构建列配置
const tableColumns = computed(() => {
  const cols: any[] = [];

  // 复选框列
  if (props.showCheckbox) {
    cols.push({
      type: 'checkbox',
      width: 50,
      align: 'center',
      fixed: 'left',
    });
  }

  // 序号列
  if (props.showSeq) {
    cols.push({
      type: 'seq',
      title: '序号',
      width: 60,
      align: 'center',
    });
  }

  // 数据列
  props.columns.forEach((col) => {
    const item: any = {
      field: col.field,
      title: col.title,
      width: col.width,
      minWidth: col.minWidth || 120,
      fixed: col.fixed,
      align: col.align || 'left',
      showOverflow: col.showOverflow !== undefined ? col.showOverflow : 'tooltip',
    };

    // 日期格式化
    if (col.field.includes('date') || col.field.includes('time') || col.field.includes('create') || col.field.includes('update')) {
      if (!col.formatter) {
        // 使用自定义格式化函数而不是字符串
        item.formatter = ({ cellValue }: any) => {
          if (!cellValue || cellValue === 'null' || cellValue === 'undefined') return '';
          try {
            const date = dayjs(cellValue);
            if (!date.isValid()) return cellValue;
            return date.format('YYYY-MM-DD HH:mm:ss');
          } catch (e) {
            return cellValue;
          }
        };
      }
    }

    // 状态列
    if (col.field === 'status' || col.field === 'is_enabled') {
      item.slots = { default: 'status' };
    }

    // 操作列
    if (col.field === 'action') {
      item.slots = { default: 'action' };
      item.width = col.width || getActionColWidth();
      item.fixed = col.fixed || 'right';
    }

    // 自定义插槽
    if (col.slots && !item.slots) {
      item.slots = { default: col.slots };
    }

    // 自定义格式化
    if (col.formatter && !item.formatter) {
      item.formatter = col.formatter;
    }

    cols.push(item);
  });

  return cols;
});

// 根据操作按钮数量计算列宽
function getActionColWidth(): number {
  const btnCount = visibleActions.value.length;
  if (btnCount <= 1) return 100;
  if (btnCount === 2) return 140;
  return 180;
}

// Grid 配置
const gridOptions = computed<VxeTableGridOptions>(() => ({
  columns: tableColumns.value,
  size: props.size,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        if (!props.api?.page) {
          return { records: [], total: 0, page: { currentPage: 1, pageSize: 20 } };
        }
        const result = await props.api.page({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...props.queryParams,
          ...formValues,
        });
        return {
          records: result.rows || [],
          total: result.total || 0,
          page: { currentPage: page.currentPage, pageSize: page.pageSize },
        };
      },
    },
  },
  pagerConfig: props.pagination === false
    ? undefined
    : {
        enabled: true,
        pageSize: props.pagination?.pageSize || 20,
        pageSizes: props.pagination?.pageSizes || [10, 20, 50, 100],
        showSizeChanger: props.pagination?.showSizeChanger !== false,
        showQuickJumper: props.pagination?.showQuickJumper !== false,
      },
  sortConfig: {
    multiple: false,
    trigger: 'cell',
  },
  rowConfig: {
    isHover: true,
  },
}));

// 使用 Vben Grid
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: gridOptions.value,
  gridEvents: {
    checkboxChange: handleSelectionChange,
    checkboxAll: handleSelectionChange,
    cellClick: ({ row }) => emit('row-click', row),
  },
});

// 选中变化
function handleSelectionChange(params: any) {
  selectedRows.value = params.records || [];
  emit('selection-change', selectedRows.value);
}

// 操作按钮点击
async function handleAction(btn: LcTableAction, row: any) {
  // 自定义处理优先
  if (btn.onClick) {
    btn.onClick(row, btn);
    return;
  }

  // 内置处理
  switch (btn.key) {
    case 'edit':
    case 'modify':
      emit('edit', row);
      break;
    case 'delete':
      await handleDelete(row);
      break;
    case 'view':
    case 'detail':
      emit('action', btn, row);
      break;
    default:
      emit('action', btn, row);
  }
}

// 删除
async function handleDelete(row: any) {
  if (!props.api?.delete) {
    message.warning('删除接口未配置');
    return;
  }
  try {
    const id = row[props.primaryKey];
    if (!id) {
      message.warning('找不到记录ID，无法删除');
      return;
    }
    await props.api.delete(id);
    message.success('删除成功');
    emit('delete', row);
    gridApi.reload();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
}

// 状态变更
async function handleStatusChange(row: any, value: boolean | number) {
  // 检查API是否支持编辑
  if (!props.api?.edit) {
    message.error('状态变更接口未配置');
    return;
  }

  try {
    const id = row[props.primaryKey || 'id'];
    const statusField = row.is_enabled !== undefined ? 'is_enabled' : 'status';
    const newValue = value !== undefined ? value : (row[statusField] === 1 ? 0 : 1);

    // 调用编辑接口更新状态
    await props.api.edit({
      ...row,
      [props.primaryKey || 'id']: id,
      [statusField]: newValue,
    });

    message.success(newValue === 1 ? '启用成功' : '停用成功');

    // 刷新表格
    gridApi.reload();

    // 触发事件
    emit('status-change', { ...row, [statusField]: newValue });
  } catch (error) {
    console.error('状态变更失败:', error);
    message.error('状态变更失败');
    // 刷新表格以恢复原始状态显示
    gridApi.reload();
  }
}

// 刷新
function reload() {
  gridApi.reload();
}

// 查询
function query(params?: Record<string, any>) {
  gridApi.query(params);
}

// 获取选中行
function getSelectedRows() {
  return [...selectedRows.value];
}

// 清除选中
function clearSelection() {
  selectedRows.value = [];
  gridApi.clearSelection?.();
}

// 监听 queryParams 变化自动刷新
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
  getSelectedRows,
  clearSelection,
  gridApi,
});
</script>

<style scoped>
.lc-table-container {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
</style>
