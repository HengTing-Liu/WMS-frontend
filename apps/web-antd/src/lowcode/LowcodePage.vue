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
      <!-- 搜索栏 -->
      <div class="mb-4">
        <WmsSearchBar
          v-model="searchForm"
          :remote-fields-url="searchFieldsUrl"
          :cache-key="`${tableCode}-fields-cache`"
          @search="handleSearch"
          @reset="handleReset"
        />
      </div>

      <!-- 工具栏：操作按钮 + 行选择提示 -->
      <div class="mb-4 flex items-center justify-between">
        <div class="flex gap-2">
          <slot name="toolbarLeft" />
        </div>
        <div class="text-sm text-gray-500">
          <template v-if="selectedRowKeys.length">
            已选择 <span class="font-medium text-blue-600">{{ selectedRowKeys.length }}</span> 项
          </template>
          <template v-else>
            共 <span class="font-medium">{{ pagination.total }}</span> 条
          </template>
        </div>
        <div v-if="visibleToolbarActions.length || !!slots.toolbarExtra" class="flex gap-2">
          <slot name="toolbarExtra" />
          <template v-for="action in visibleToolbarActions" :key="action.key">
            <Button
              :danger="isDangerButton(action)"
              :type="getButtonType(action)"
              :loading="actionLoading[action.key]"
              @click="handleToolbarAction(action)"
            >
              <IconifyIcon v-if="action.icon" :icon="action.icon" class="mr-1" />
              {{ action.label }}
            </Button>
          </template>
        </div>
      </div>

      <!-- 表格 -->
      <WmsDataTable
        v-if="props.showTable"
        :scroll="{ y: tableScrollY }"
        sticky
        :columns="columns"
        :data-source="dataList"
        :loading="loading"
        :pagination="paginationConfig"
        :selected-row-keys="selectedRowKeys"
        row-key="id"
        :enable-selection="tableSelectionEnabled"
        @page-change="onPageChange"
        @selection-change="onSelectionChange"
      >
        <template #bodyCell="{ column, record, index }">
            <!-- 序号 -->
          <template v-if="column?.key === 'seq'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>

            <!-- 操作列 -->
          <template v-else-if="column?.key === 'action'">
            <div class="flex items-center gap-2">
              <template v-for="action in rowActions" :key="action.key">
                <!-- 查看按钮（含 row_read） -->
                <Tooltip
                  v-if="(action.key === 'read' || action.key === 'row_read') && canRenderAction(action)"
                  title="查看"
                >
                  <Button type="link" size="small" class="p-0" @click="handleToolbarAction(action, record)">
                    <IconifyIcon icon="material-symbols:visibility" class="text-lg" />
                  </Button>
                </Tooltip>

                <!-- 编辑按钮（含 row_edit，与 init_meta_data 脚本一致） -->
                <Tooltip
                  v-else-if="(action.key === 'edit' || action.key === 'row_edit') && canRenderAction(action)"
                  title="编辑"
                >
                  <Button type="link" size="small" class="p-0" @click="handleToolbarAction(action, record)">
                    <IconifyIcon icon="material-symbols:edit" class="text-lg" />
                  </Button>
                </Tooltip>

                <!-- 启用/停用按钮（兼容 1/0 和 true/false） -->
                <Tooltip
                  v-else-if="action.key === 'toggle' && canRenderAction(action)"
                  :title="isEnabled(record.isEnabled) ? '停用' : '启用'"
                >
                  <Button
                    type="link"
                    size="small"
                    class="p-0"
                    @click="handleToolbarAction(action, record)"
                  >
                    <IconifyIcon
                      :icon="isEnabled(record.isEnabled) ? 'material-symbols:toggle-on' : 'material-symbols:toggle-off'"
                      :class="isEnabled(record.isEnabled) ? 'text-green-500 text-2xl' : 'text-gray-400 text-2xl'"
                    />
                  </Button>
                </Tooltip>

                <!-- 删除按钮（含 row_delete） -->
                <Tooltip
                  v-else-if="(action.key === 'delete' || action.key === 'row_delete') && canRenderAction(action)"
                  title="删除"
                >
                  <Popconfirm
                    title="是否确认删除?"
                    ok-text="确认"
                    cancel-text="取消"
                    @confirm="handleToolbarAction(action, record)"
                  >
                    <Button type="link" size="small" danger class="p-0">
                      <IconifyIcon icon="material-symbols:delete" class="text-lg" />
                    </Button>
                  </Popconfirm>
                </Tooltip>

                <!-- 其他自定义行内按钮 -->
                <Button
                  v-else-if="canRenderAction(action)"
                  type="link"
                  size="small"
                  @click="handleToolbarAction(action, record)"
                >
                  <IconifyIcon v-if="action.icon" :icon="action.icon" class="mr-1" />
                  {{ action.label }}
                </Button>
              </template>
              <slot name="appendAction" :record="record" />
            </div>
          </template>

            <!-- 状态标签（兼容 1/0 和 true/false，以及 isEnabled/is_enabled 字段名） -->
          <template v-else-if="column?.key === 'isEnabled'">
            <Tag :color="isEnabled(record.isEnabled ?? record.is_enabled) ? 'success' : 'default'">
              {{ isEnabled(record.isEnabled ?? record.is_enabled) ? '启用' : '停用' }}
            </Tag>
          </template>

            <!-- 默认单元格：父级可覆盖；未覆盖时显示字段值（避免仅写了 #bodyCell 中 action 分支导致数据列全空） -->
            <slot v-else name="bodyCell" v-bind="{ column, record, index }">
              {{ formatDefaultCell(record, column) }}
            </slot>
          </template>
      </WmsDataTable>

      <!-- 自定义内容区域（当 showTable=false 时显示，用于层级视图等） -->
      <div v-if="!props.showTable" class="lowcode-custom-content">
        <slot name="content" />
      </div>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  Button,
  Popconfirm,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { Page } from '@vben/common-ui';
import { useAccess } from '@vben/access';
import WmsSearchBar from '#/components/common/WmsSearchBar.vue';
import WmsDataTable from '#/components/common/WmsDataTable.vue';
import { fetchPageMeta, fetchList, deleteRecord, toggleRecord } from './api';
import type { ColumnMeta, LowcodeAction, LowcodeSearchField, StatsCardConfig, TableMeta } from './types';
import { useSlots } from 'vue';
import {
  handleAction,
  isExportAction,
  parseEventConfig,
  type ActionContext,
} from './events';
import { expandAllPermissionCodes } from './permission-utils';

/**
 * 判断记录是否启用（兼容多种值类型）
 */
function isEnabled(raw: any): boolean {
  return raw === 1 || raw === true || raw === '1' || raw === 'true';
}

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
  /** 是否显示数据表格（用于视图切换） */
  showTable?: boolean;
  /** 默认排序配置 */
  defaultSort?: { orderByColumn?: string; isAsc?: string };
}

const props = withDefaults(defineProps<Props>(), {
  showStats: false,
  statsConfig: () => [],
  enableSelection: false,
  staticSearchFields: () => [],
  staticColumns: () => [],
  staticOperations: () => [],
  showTable: true,
  defaultSort: undefined,
});

const emit = defineEmits<{
  (e: 'search', query: Record<string, any>): void;
  (e: 'create'): void;
  (e: 'edit', record: Record<string, any>): void;
  (e: 'delete', id: number | string): void;
  (e: 'toggle', record: Record<string, any>, enabled: boolean): void;
  (e: 'formSuccess', record: Record<string, any>): void;
  (e: 'selectionChange', keys: any[], records: any[]): void;
}>();

// ==================== 状态 ====================
const loading = ref(false);
const dataList = ref<any[]>([]);
const selectedRowKeys = ref<any[]>([]);
const selectedRows = computed(() =>
  dataList.value.filter((row) => selectedRowKeys.value.includes(row.id))
);
const searchForm = reactive<Record<string, any>>({});
const searchQueryModes = ref<Record<string, 'eq' | 'like'>>({});
const actionLoading = ref<Record<string, boolean>>({});
const router = useRouter();
const route = useRoute();

// 表格滚动高度（固定表头）
const tableScrollY = 'calc(100vh - 280px)';

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
const currentTableMeta = ref<TableMeta | null>(null);
const dictLabelMapByField = computed(() => {
  const map = new Map<string, Map<string, string>>();
  for (const col of metaColumns.value) {
    const code = col.code ?? col.field;
    if (!code) continue;
    const options = Array.isArray(col.options)
      ? col.options
      : Array.isArray(col.dataSource)
        ? col.dataSource
        : [];
    if (!options.length) continue;
    const valueLabelMap = new Map<string, string>();
    for (const option of options) {
      const value = (option as any)?.value;
      const label = (option as any)?.label;
      if (value === undefined || value === null || label === undefined || label === null) continue;
      valueLabelMap.set(String(value), String(label));
    }
    if (valueLabelMap.size > 0) {
      map.set(code, valueLabelMap);
    }
  }
  return map;
});

// ==================== 搜索栏 URL ====================
const searchFieldsUrl = computed(() =>
  `/api/system/meta/column/schema?tableCode=${props.tableCode}`
);

// ==================== 解析操作按钮 ====================
// toolbarActions: position === 'toolbar' 或未定义（包括 null/undefined/空字符串）
const toolbarActions = computed(() =>
  metaOperations.value.filter((op) => {
    const pos = op.position;
    return pos === 'toolbar' || !pos;
  })
);

const rowActions = computed(() =>
  metaOperations.value.filter((op) => op.position === 'row')
);

/** 有权限展示的工具栏按钮（避免占位空白） */
const visibleToolbarActions = computed(() =>
  toolbarActions.value.filter((op) => canRenderAction(op)),
);

function actionNeedsSelectedRows(action: LowcodeAction): boolean {
  const config = parseEventConfig(action.eventConfig ?? {});
  if (config?.payloadType === 'selected') return true;

  // fallback: builtin/export 默认无 payloadType 时不强制勾选，仅明确 selected 时开启
  if (isExportAction(action.key) && config?.scope === 'selected') return true;
  return false;
}

const tableSelectionEnabled = computed(() => {
  if (props.enableSelection || selectedRowKeys.value.length > 0) return true;
  return visibleToolbarActions.value.some((action) => actionNeedsSelectedRows(action));
});

// ==================== 解析表格列 ====================
const columns = computed<any[]>(() => {
  // 优先使用静态列配置
  if (props.staticColumns.length) return props.staticColumns;

  console.log('[LowcodePage-v2] computing columns, metaColumns.length:', metaColumns.value.length);
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

    // isEnabled / is_enabled 列特殊处理：渲染成 Tag
    if (code === 'isEnabled' || code === 'is_enabled') {
      tableCol.key = 'isEnabled';
    }

    // 日期格式化（可选扩展）
    if (col.dataType === 'datetime' || col.dataType === 'date') {
      // 简单格式化，后续可扩展
    }

    cols.push(tableCol);
  }

  // 操作列（宽度根据行内操作数量 + appendAction slot 动态计算）
  const hasAppendActionSlot = !!slots.appendAction;
  if (metaOperations.value.some((op) => op.position === 'row') || hasAppendActionSlot) {
    const rowCount = rowActions.value.length + (hasAppendActionSlot ? 1 : 0);
    const actionWidth = Math.max(120, rowCount * 44 + 16);
    cols.push({ title: '操作', key: 'action', width: actionWidth, align: 'center', fixed: 'right' });
  }

  console.log('[LowcodePage] computed columns count:', cols.length, cols.map(c => c.key || c.dataIndex));
  return cols;
});

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
  const dictLabelMap = dictLabelMapByField.value.get(String(key));
  if (dictLabelMap) {
    const mapped = dictLabelMap.get(String(raw));
    if (mapped !== undefined) return mapped;
  }
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
      if (key === '__queryModes') continue;
      if (val !== undefined && val !== null && val !== '') {
        // 转换驼峰到蛇形
        const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
        query[snakeKey] = val;
      }
    }
    const queryModes: Record<string, 'eq' | 'like'> = {};
    for (const [key, mode] of Object.entries(searchQueryModes.value)) {
      const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
      if (query[snakeKey] === undefined) continue;
      queryModes[snakeKey] = mode === 'eq' ? 'eq' : 'like';
    }

    const res = await fetchList({
      tableCode: props.tableCode,
      prefix: props.crudPrefix,
      tableMeta: currentTableMeta.value,
      query,
      queryModes,
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      orderByColumn: props.defaultSort?.orderByColumn,
      isAsc: props.defaultSort?.isAsc,
    });

    let rows = res.rows;
    // 字典类型/数据表沿用 RuoYi status 语义：0=启用(正常), 1=停用
    if (props.tableCode === 'sys_dict_type' || props.tableCode === 'sys_dict_data') {
      rows = (res.rows || []).map((row: Record<string, any>) => {
        if (row?.isEnabled === undefined && row?.is_enabled === undefined && row?.status !== undefined) {
          return {
            ...row,
            isEnabled: String(row.status) === '0' ? 1 : 0,
          };
        }
        return row;
      });
    }
    dataList.value = rows;
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
  const enabled = rows.filter((r) => isEnabled(r.isEnabled)).length;
  const disabled = total - enabled;

  // 默认统计：总数、已启用、已停用
  const configMap = new Map(props.statsConfig.map((c) => [c.field, c]));
  if (configMap.has('totalCount')) stats.totalCount = total;
  if (configMap.has('enabledCount')) stats.enabledCount = enabled;
  if (configMap.has('disabledCount')) stats.disabledCount = disabled;
}

// ==================== 事件处理上下文 ====================
const { hasAccessByCodes } = useAccess();
const slots = useSlots();

/** 检查按钮是否有权限渲染（支持逗号分隔多码；兼容前缀与同义后缀，见 permission-utils） */
function canRenderAction(action: LowcodeAction): boolean {
  // 元数据显隐：默认显示，仅显式关闭时隐藏
  if (action.status !== undefined && Number(action.status) !== 1) return false;
  if (action.showButton === 0 || action.showButton === false || action.showButton === '0') return false;

  const codes = expandAllPermissionCodes(action.permission);
  if (codes.length === 0) return true;
  const matched = codes.find((code) => hasAccessByCodes([code]));
  if (!matched && import.meta.env.DEV && props.tableCode === 'inv_warehouse') {
    console.warn('[LowcodePage] action hidden by permission check', {
      actionKey: action.key,
      actionLabel: action.label,
      rawPermission: action.permission,
      expandedCodes: codes,
    });
  }
  return !!matched;
}

/** 获取按钮类型 */
function getButtonType(action: LowcodeAction): 'default' | 'primary' | 'text' {
  // 新建按钮默认 primary
  if (action.key === 'create' || action.key === 'add') {
    return 'primary';
  }
  // 删除按钮默认 danger
  if (action.key === 'delete') {
    return 'text';
  }
  // link 类型渲染为 text
  if (action.type === 'link') {
    return 'text';
  }
  if (action.type === 'primary') return 'primary';
  return 'default';
}

function isDangerButton(action: LowcodeAction): boolean {
  return action.key === 'delete' || action.type === 'danger';
}

/** 统一事件处理入口 */
async function handleToolbarAction(action: LowcodeAction, record?: any) {
  // 设置加载状态
  actionLoading.value[action.key] = true;
  try {
    // 构建上下文
    const ctx: ActionContext = {
      crudPrefix: props.crudPrefix,
      tableCode: props.tableCode,
      searchForm: { ...searchForm },
      selectedRowKeys: selectedRowKeys.value,
      pagination: {
        current: pagination.current,
        pageSize: pagination.pageSize,
      },
      handleCreate,
      handleEdit,
      handleRead,
      handleDelete,
      handleToggle,
      handleExport: () => handleExportAction(action),
      reload: loadData,
    };

    await handleAction(action, ctx, record);
  } finally {
    actionLoading.value[action.key] = false;
  }
}

async function handleRead(record: any) {
  const id = record?.id ?? record?.dictId ?? record?.dictCode;
  if (id === undefined || id === null || id === '') {
    message.error('当前记录缺少 ID，无法查看');
    return;
  }
  navigateToLowcodeForm('view', String(id));
}

/** 驼峰转蛇形 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** 过滤空值并转换字段名为蛇形 */
function buildExportParams(): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(searchForm)) {
    if (key === '__queryModes') continue;
    if (value !== undefined && value !== null && value !== '') {
      // 转换字段名为蛇形
      const snakeKey = camelToSnake(key);
      result[snakeKey] = value;
    }
  }
  const queryModes: Record<string, 'eq' | 'like'> = {};
  for (const [key, mode] of Object.entries(searchQueryModes.value)) {
    const snakeKey = camelToSnake(key);
    if (result[snakeKey] === undefined) continue;
    queryModes[snakeKey] = mode === 'eq' ? 'eq' : 'like';
  }
  result.queryModes = JSON.stringify(queryModes);
  return result;
}

/** 导出动作处理（通过配置决定导出范围） */
async function handleExportAction(action: LowcodeAction) {
  const config = parseEventConfig(action.eventConfig ?? {});

  // 调试信息（开发环境可见）
  if (import.meta.env.DEV) {
    console.log('[Export] action:', action);
    console.log('[Export] eventConfig raw:', action.eventConfig);
    console.log('[Export] parsed config:', config);
  }

  // 构建 URL：优先使用配置的 URL，否则使用通用导出接口
  let url = config.url;
  if (!url) {
    // 优先使用 crudPrefix + /export
    if (props.crudPrefix) {
      url = `${props.crudPrefix}/export`;
    } else if (props.tableCode) {
      // 使用通用 CRUD 导出接口
      url = `/api/wms/crud/${props.tableCode}/export`;
    } else {
      message.error('导出接口未配置');
      return;
    }
  }

  // 根据 payloadType 决定导出范围
  const payloadType = config.payloadType || 'filtered';

  // 构建请求参数
  let params: Record<string, any> = {};

  switch (payloadType) {
    case 'selected':
      if (!selectedRowKeys.value.length) {
        message.warning('请先勾选要导出的数据');
        return;
      }
      params.ids = selectedRowKeys.value;
      break;
    case 'currentPage':
      params = buildExportParams();
      params.pageNum = pagination.current;
      params.pageSize = pagination.pageSize;
      break;
    case 'all':
      // 导出全部（忽略分页）
      params = buildExportParams();
      params.pageSize = 999999;
      break;
    case 'filtered':
    default:
      // 导出筛选数据
      params = buildExportParams();
      break;
  }

  // 调试信息
  if (import.meta.env.DEV) {
    console.log('[Export] final params:', params);
    console.log('[Export] final url:', url);
  }

  // 调用下载
  const { downloadBlob } = await import('#/utils/download');
  // 优先使用配置的 filename，否则使用表名+时间
  const fileName = config.fileName || `${props.pageTitle || props.tableCode}_${new Date().getTime()}.xlsx`;

  try {
    await downloadBlob(url, params, {
      method: 'GET', // 使用 GET，参数作为 URL 查询参数
      fileName,
    });
    message.success('导出成功');
  } catch (error: any) {
    message.error('导出失败: ' + error.message);
  }
}

function handleSearch(payload?: Record<string, any>) {
  if (payload && typeof payload === 'object') {
    // 同步一次最新搜索值，确保带上 __queryModes
    Object.keys(searchForm).forEach((key) => {
      if (!(key in payload)) {
        delete searchForm[key];
      }
    });
    Object.entries(payload).forEach(([key, value]) => {
      searchForm[key] = value;
    });
  }
  pagination.current = 1;
  const modesSource = payload && payload.__queryModes ? payload.__queryModes : searchForm.__queryModes;
  searchQueryModes.value = { ...(modesSource ?? {}) };
  loadData();
  emit('search', { ...searchForm });
}

function handleReset() {
  // 清空搜索表单
  for (const key of Object.keys(searchForm)) {
    delete searchForm[key];
  }
  searchQueryModes.value = {};
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
  const records = dataList.value.filter((row) => keys.includes(row.id));
  emit('selectionChange', keys, records);
}

function resolveLowcodeFormRouteName(): string | undefined {
  if (router.hasRoute('LowcodeFormGlobal')) return 'LowcodeFormGlobal';
  if (router.hasRoute('LowcodeFormPage')) return 'LowcodeFormPage';
  if (router.hasRoute('SystemLowcodeFormPage')) return 'SystemLowcodeFormPage';
  return undefined;
}

function navigateToLowcodeForm(mode: 'create' | 'edit' | 'view', id?: string) {
  const routeName = resolveLowcodeFormRouteName();
  const query = {
    crudPrefix: props.crudPrefix,
    desc: props.pageDesc,
    from: route.fullPath,
    title: props.pageTitle,
  };

  if (routeName) {
    const params: Record<string, string> = {
      mode,
      tableCode: props.tableCode,
    };
    if (id != null && id !== '') {
      params.id = id;
    }
    void router.push({
      name: routeName,
      params,
      query,
    });
    return;
  }

  const suffix = id != null && id !== '' ? `/${encodeURIComponent(id)}` : '';
  void router.push({
    path: `/sys/lowcode-form/${encodeURIComponent(props.tableCode)}/${mode}${suffix}`,
    query,
  });
}

function handleCreate() {
  navigateToLowcodeForm('create');
  emit('create');
}

function handleEdit(record: any) {
  // 优先取 id，兼容字典表等特殊表（dictId / dictCode）
  const id = record?.id ?? record?.dictId ?? record?.dictCode;
  if (id === undefined || id === null || id === '') {
    message.error('当前记录缺少 ID，无法编辑');
    return;
  }
  navigateToLowcodeForm('edit', String(id));
  emit('edit', record);
}

async function handleToggle(record: any, enabled: boolean) {
  try {
    const id = record?.id ?? record?.dictId ?? record?.dictCode;
    await toggleRecord({
      tableCode: props.tableCode,
      prefix: props.crudPrefix,
      tableMeta: currentTableMeta.value,
      id,
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
      tableMeta: currentTableMeta.value,
      id,
    });
    message.success('删除成功');
    loadData();
    emit('delete', id);
  } catch (e: any) {
    message.error(e?.message ?? '删除失败');
  }
}

// ==================== 初始化 ====================
async function init() {
  try {
    // 加载 meta 配置（字段 + 操作按钮）
    const { columns: metaCols, operations, tableMeta } = await fetchPageMeta(props.tableCode);
    console.log('[LowcodePage] fetchPageMeta result:', { tableCode: props.tableCode, metaColCount: metaCols?.length, opCount: operations?.length });
    metaColumns.value = metaCols;
    currentTableMeta.value = tableMeta ?? null;
    const configuredPageSize = Number(tableMeta?.pageSize);
    if (Number.isFinite(configuredPageSize) && configuredPageSize > 0) {
      pagination.pageSize = configuredPageSize;
      pagination.current = 1;
    }
    metaOperations.value = operations.map((op: any) => ({
      key: op.operationCode,
      label: op.operationName,
      // operationType: button→primary, link→text
      type: (op.operationType === 'link'
        ? 'text'
        : op.operationType === 'danger'
          ? 'danger'
          : 'primary') as LowcodeAction['type'],
      icon: op.icon,
      permission: op.permission,
      position: (op.position === 'toolbar' || op.position === 'row'
        ? op.position
        : 'row') as LowcodeAction['position'],
      // 事件类型和配置
      eventType: op.eventType || 'builtin',
      eventConfig: op.eventConfig,
      confirmMessage: op.confirmMessage,
      confirm: op.operationType === 'confirm' ? '是否确认该操作?' : undefined,
      status: op.status,
      showButton: op.showButton,
    }));

    if (import.meta.env.DEV && props.tableCode === 'inv_warehouse') {
      console.warn('[LowcodePage] meta operations loaded', {
        tableCode: props.tableCode,
        operationCount: operations.length,
        operations,
      });
    }

    // 加载数据
    await loadData();
  } catch (e: any) {
    message.error(e?.message ?? '初始化失败');
  }
}

onMounted(() => {
  init();
});

onActivated(() => {
  loadData();
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
  dataList,
  pagination,
  selectedRowKeys,
  selectedRows,
});
</script>

<style scoped>
.lowcode-page {
  min-height: 100%;
}
</style>
