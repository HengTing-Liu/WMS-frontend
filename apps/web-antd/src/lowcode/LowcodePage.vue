<!--
  LowcodePage - 低代码标准列表页面
  基于后端 meta 配置，自动渲染：
    - 搜索栏（WmsSearchBar）
    - 数据表格（WmsDataTable）
    - 操作按钮
    - 新建/编辑抽屉（LowcodeDrawer）

  用法：
  <LowcodePage
    table-code="WMS0010"
    page-title="仓库档案"
    :stats-config="statsConfig"
    :crud-prefix="'/api/base/warehouse'"
  />
-->
<template>
  <Page auto-content-height>
    <div class="lowcode-page p-4">
      <!-- 页面标题区 -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">{{ pageTitle }}</h1>
          <p v-if="pageDesc" class="mt-1 text-sm text-gray-500">{{ pageDesc }}</p>
        </div>
        <!-- 工具栏按钮（由操作配置决定） -->
        <div v-if="toolbarActions.length" class="flex gap-2">
          <template v-for="action in toolbarActions" :key="action.key">
            <Button
              v-if="action.key === 'create'"
              type="primary"
              size="large"
              @click="handleCreate"
            >
              <IconifyIcon icon="material-symbols:add" class="mr-1" />
              {{ action.label }}
            </Button>
            <Button v-else-if="action.key === 'export'" @click="handleExport">
              <IconifyIcon icon="material-symbols:file-download" class="mr-1" />
              {{ action.label }}
            </Button>
          </template>
        </div>
      </div>

      <!-- 统计卡片区域 -->
      <div v-if="showStats && statsConfig.length" class="mb-6 grid grid-cols-4 gap-4">
        <Card v-for="stat in statsConfig" :key="stat.key" class="stat-card">
          <div class="flex items-center">
            <div
              class="mr-4 flex h-12 w-12 items-center justify-center rounded-full"
              :style="{ backgroundColor: `${stat.color}20` }"
            >
              <IconifyIcon :icon="stat.icon" class="text-xl" :style="{ color: stat.color }" />
            </div>
            <div>
              <div class="text-sm text-gray-500">{{ stat.label }}</div>
              <div class="text-2xl font-bold text-gray-800">
                {{ formatStatValue(stats[stat.key], stat) }}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- 搜索栏 - 使用 WmsSearchBar（字段由后端 meta 驱动） -->
      <Card class="mb-4">
        <WmsSearchBar
          v-model="searchForm"
          :remote-fields-url="searchFieldsUrl"
          :cache-key="`${tableCode}-fields-cache`"
          @search="handleSearch"
          @reset="handleReset"
        />
      </Card>

      <!-- 工具栏（行操作） -->
      <div v-if="selectedRowKeys.length" class="mb-4 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          已选择 <span class="font-medium text-blue-600">{{ selectedRowKeys.length }}</span> 项
        </div>
      </div>

      <!-- 表格 -->
      <WmsDataTable
        :columns="columns"
        :data-source="dataList"
        :loading="loading"
        :pagination="paginationConfig"
        row-key="id"
        :enable-selection="!!selectedRowKeys.length || enableSelection"
        @page-change="onPageChange"
        @selection-change="onSelectionChange"
      >
        <template #bodyCell="{ column, record, index }">
          <!-- 序号 -->
          <template v-if="column.key === 'seq'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'action'">
            <div class="flex items-center gap-2">
              <template v-for="action in rowActions" :key="action.key">
                <!-- 编辑 -->
                <Tooltip v-if="action.key === 'edit'" title="编辑">
                  <Button type="link" size="small" class="p-0" @click="handleEdit(record)">
                    <IconifyIcon icon="material-symbols:edit" class="text-lg" />
                  </Button>
                </Tooltip>

                <!-- 启用/停用 -->
                <Tooltip v-else-if="action.key === 'toggle'" :title="record.isEnabled === 1 ? '停用' : '启用'">
                  <Button
                    type="link"
                    size="small"
                    class="p-0"
                    @click="handleToggle(record, record.isEnabled !== 1)"
                  >
                    <IconifyIcon
                      :icon="record.isEnabled === 1 ? 'material-symbols:toggle-on' : 'material-symbols:toggle-off'"
                      :class="record.isEnabled === 1 ? 'text-green-500 text-2xl' : 'text-gray-400 text-2xl'"
                    />
                  </Button>
                </Tooltip>

                <!-- 删除 -->
                <Tooltip v-else-if="action.key === 'delete'" title="删除">
                  <Popconfirm
                    title="是否确认删除?"
                    ok-text="确认"
                    cancel-text="取消"
                    @confirm="handleDelete(record.id)"
                  >
                    <Button type="link" size="small" danger class="p-0">
                      <IconifyIcon icon="material-symbols:delete" class="text-lg" />
                    </Button>
                  </Popconfirm>
                </Tooltip>
              </template>
              <slot name="appendAction" :record="record" />
            </div>
          </template>

          <!-- 状态标签 -->
          <template v-else-if="column.key === 'isEnabled'">
            <Tag :color="record.isEnabled === 1 ? 'success' : 'default'">
              {{ record.isEnabled === 1 ? '启用' : '停用' }}
            </Tag>
          </template>

          <!-- 默认单元格：父级可覆盖；未覆盖时显示字段值（避免仅写了 #bodyCell 中 action 分支导致数据列全空） -->
          <slot v-else name="bodyCell" v-bind="{ column, record, index }">
            {{ formatDefaultCell(record, column) }}
          </slot>
        </template>
      </WmsDataTable>
    </div>

    <!-- 新增/编辑抽屉 -->
    <LowcodeDrawer
      v-model:open="drawerVisible"
      :table-code="tableCode"
      :record="currentRecord"
      @success="handleFormSuccess"
      @close="handleDrawerClose"
    />
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import {
  Button,
  Card,
  Popconfirm,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { Page } from '@vben/common-ui';
import WmsSearchBar from '#/components/common/WmsSearchBar.vue';
import WmsDataTable from '#/components/common/WmsDataTable.vue';
import LowcodeDrawer from './LowcodeDrawer.vue';
import { fetchColumnSchema, fetchPageMeta, fetchList, createRecord, updateRecord, deleteRecord, toggleRecord } from './api';
import type { ColumnMeta, LowcodeAction, LowcodeSearchField, StatsCardConfig } from './types';

interface Props {
  /** 表编码，对应 sys_table_meta.table_code */
  tableCode: string;
  /** 页面标题 */
  pageTitle: string;
  /** 页面描述 */
  pageDesc?: string;
  /** CRUD 接口前缀（如 /api/base/warehouse），不传则按约定推断 */
  crudPrefix?: string;
  /** 是否显示统计卡片 */
  showStats?: boolean;
  /** 统计卡片配置 */
  statsConfig?: StatsCardConfig[];
  /** 是否开启行选择 */
  enableSelection?: boolean;
  /** 静态搜索字段（优先于后端 meta） */
  staticSearchFields?: LowcodeSearchField[];
  /** 静态表格列配置（优先于后端 meta） */
  staticColumns?: any[];
  /** 静态操作按钮配置（优先于后端 meta） */
  staticOperations?: LowcodeAction[];
}

const props = withDefaults(defineProps<Props>(), {
  showStats: false,
  statsConfig: () => [],
  enableSelection: false,
  staticSearchFields: () => [],
  staticColumns: () => [],
  staticOperations: () => [],
});

const emit = defineEmits<{
  (e: 'search', query: Record<string, any>): void;
  (e: 'create'): void;
  (e: 'edit', record: Record<string, any>): void;
  (e: 'delete', id: number | string): void;
  (e: 'toggle', record: Record<string, any>, enabled: boolean): void;
  (e: 'formSuccess', record: Record<string, any>): void;
}>();

// ==================== 状态 ====================
const loading = ref(false);
const dataList = ref<any[]>([]);
const selectedRowKeys = ref<any[]>([]);
const searchForm = reactive<Record<string, any>>({});

// 抽屉
const drawerVisible = ref(false);
const currentRecord = ref<Record<string, any> | null>(null);

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const paginationConfig = computed(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
}));

// 统计数据
const stats = reactive<Record<string, any>>({});

// ==================== Meta 配置 ====================
const metaColumns = ref<ColumnMeta[]>([]);
const metaOperations = ref<LowcodeAction[]>([]);

// ==================== 搜索栏 URL ====================
const searchFieldsUrl = computed(() =>
  `/api/system/meta/column/schema?tableCode=${props.tableCode}`
);

// ==================== 解析操作按钮 ====================
const toolbarActions = computed(() =>
  metaOperations.value.filter((op) => op.position === 'toolbar' || op.position === undefined)
);

const rowActions = computed(() =>
  metaOperations.value.filter((op) => op.position === 'row')
);

// ==================== 解析表格列 ====================
const columns = computed<any[]>(() => {
  // 优先使用静态列配置
  if (props.staticColumns.length) return props.staticColumns;

  if (!metaColumns.value.length) return [];

  const cols: any[] = [
    { title: '序号', key: 'seq', width: 60, align: 'center' },
  ];

  for (const col of metaColumns.value) {
    const code = col.code ?? col.field;
    const title = col.label ?? col.title ?? code;

    // 未配置时默认展示列表列（仅明确为 0 / false 时隐藏）
    if (col.isShowInList === 0 || col.isShowInList === false) continue;

    const tableCol: any = {
      title,
      dataIndex: code,
      key: code,
      width: col.width ?? 120,
      align: 'center',
    };

    if (col.isSortable) tableCol.sorter = true;

    // isEnabled 列特殊处理：渲染成 Tag
    if (code === 'isEnabled') {
      tableCol.key = 'isEnabled';
    }

    // 日期格式化（可选扩展）
    if (col.dataType === 'datetime' || col.dataType === 'date') {
      // 简单格式化，后续可扩展
    }

    cols.push(tableCol);
  }

  // 操作列
  if (metaOperations.value.some((op) => op.position === 'row')) {
    cols.push({ title: '操作', key: 'action', width: 120, align: 'center', fixed: 'right' });
  }

  return cols;
});

// ==================== 统计数据 ====================
function formatStatValue(value: any, config: StatsCardConfig): string {
  if (config.format) return config.format(value);
  if (value === null || value === undefined) return '0';
  return String(value);
}

/** 表格单元格取值：兼容列 dataIndex 与接口字段驼峰/蛇形不一致 */
function pickRecordField(record: Record<string, any>, key: string): unknown {
  if (!record || key == null || key === '') return undefined;
  if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
  if (Object.prototype.hasOwnProperty.call(record, snake)) return record[snake];
  const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  if (Object.prototype.hasOwnProperty.call(record, camel)) return record[camel];
  return record[key];
}

function formatDefaultCell(record: Record<string, any>, column: any): string {
  const key = column?.dataIndex ?? column?.key;
  if (key == null || key === 'seq' || key === 'action') return '';
  const raw = pickRecordField(record, String(key));
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'object') return JSON.stringify(raw);
  return String(raw);
}

// ==================== 数据加载 ====================
async function loadData() {
  loading.value = true;
  try {
    // 转换搜索参数（驼峰 → 蛇形，兼容后端）
    const query: Record<string, any> = {};
    for (const [key, val] of Object.entries(searchForm)) {
      if (val !== undefined && val !== null && val !== '') {
        // 转换驼峰到蛇形
        const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
        query[snakeKey] = val;
      }
    }

    const res = await fetchList({
      tableCode: props.tableCode,
      prefix: props.crudPrefix,
      query,
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    });

    dataList.value = res.rows;
    pagination.total = res.total;

    // 更新统计数据
    if (props.showStats) {
      updateStats(res.rows);
    }
  } catch (e: any) {
    message.error(e?.message ?? '加载失败');
  } finally {
    loading.value = false;
  }
}

function updateStats(rows: any[]) {
  if (!props.statsConfig.length) return;
  const total = rows.length;
  const enabled = rows.filter((r) => r.isEnabled === 1).length;
  const disabled = total - enabled;

  // 默认统计：总数、已启用、已停用
  const configMap = new Map(props.statsConfig.map((c) => [c.field, c]));
  if (configMap.has('totalCount')) stats.totalCount = total;
  if (configMap.has('enabledCount')) stats.enabledCount = enabled;
  if (configMap.has('disabledCount')) stats.disabledCount = disabled;
}

// ==================== 事件处理 ====================
function handleSearch() {
  pagination.current = 1;
  loadData();
  emit('search', { ...searchForm });
}

function handleReset() {
  // 清空搜索表单
  for (const key of Object.keys(searchForm)) {
    delete searchForm[key];
  }
  pagination.current = 1;
  loadData();
}

function onPageChange({ page, pageSize }: { page: number; pageSize: number }) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

function onSelectionChange(keys: any[]) {
  selectedRowKeys.value = keys;
}

function handleCreate() {
  currentRecord.value = null;
  drawerVisible.value = true;
  emit('create');
}

function handleEdit(record: any) {
  currentRecord.value = record;
  drawerVisible.value = true;
  emit('edit', record);
}

async function handleToggle(record: any, enabled: boolean) {
  try {
    await toggleRecord({
      tableCode: props.tableCode,
      prefix: props.crudPrefix,
      id: record.id,
      enabled,
    });
    message.success(enabled ? '启用成功' : '停用成功');
    loadData();
    emit('toggle', record, enabled);
  } catch (e: any) {
    message.error(e?.message ?? '状态更新失败');
  }
}

async function handleDelete(id: number | string) {
  try {
    await deleteRecord({
      tableCode: props.tableCode,
      prefix: props.crudPrefix,
      id,
    });
    message.success('删除成功');
    loadData();
    emit('delete', id);
  } catch (e: any) {
    message.error(e?.message ?? '删除失败');
  }
}

function handleExport() {
  message.info('导出功能开发中...');
}

function handleFormSuccess(record: Record<string, any>) {
  loadData();
  emit('formSuccess', record);
}

function handleDrawerClose() {
  currentRecord.value = null;
}

// ==================== 初始化 ====================
async function init() {
  try {
    // 加载 meta 配置（字段 + 操作按钮）
    const { columns: metaCols, operations } = await fetchPageMeta(props.tableCode);
    metaColumns.value = metaCols;
    metaOperations.value = operations.map((op) => ({
      key: op.operationCode,
      label: op.operationName,
      // operationType: button→primary, link→text
      type: op.operationType === 'link' ? 'text' : 'primary',
      icon: op.icon,
      permission: op.permission,
      position: (op.position as any) ?? 'row',
      confirm: op.operationType === 'confirm' ? '是否确认该操作?' : undefined,
    }));

    // 加载数据
    await loadData();
  } catch (e: any) {
    message.error(e?.message ?? '初始化失败');
  }
}

onMounted(() => {
  init();
});

// 若外部传入静态操作按钮，覆盖 meta 配置
watch(
  () => props.staticOperations,
  (ops) => {
    if (ops.length) {
      metaOperations.value = ops;
    }
  },
);

defineExpose({
  reload: loadData,
  handleEdit,
});
</script>

<style scoped>
.lowcode-page {
  min-height: 100%;
}
.stat-card {
  transition: box-shadow 0.2s;
}
.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}
</style>
