<!--
  LowcodeTreePage - 低代码树形列表页面
  基于后端 meta 配置，自动渲染树形表格：
    - 搜索栏（WmsSearchBar）
    - 树形数据表格（支持展开/折叠）
    - 操作按钮（支持行内新增子部门等树形特有操作）
    - 新建/编辑抽屉（LowcodeDrawer）

  用法：
  <LowcodeTreePage
    table-code="sys_dept"
    page-title="部门管理"
    :crud-prefix="'/api/wms/crud/sys_dept'"
    :tree-config="{
      idField: 'deptId',
      parentIdField: 'parentId',
      rootValue: 0,
      titleField: 'deptName',
    }"
    :row-actions="treeRowActions"
    @add-child="handleAddChild"
  />
-->
<template>
  <Page auto-content-height>
    <div
      class="lowcode-tree-page p-4"
      :class="{ 'lowcode-tree-page--hide-row-expand': hideTreeExpandIcon }"
    >
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
        <div class="flex items-center gap-4">
          <div class="text-sm text-gray-500">
            <template v-if="selectedRowKeys.length">
              已选择 <span class="font-medium text-blue-600">{{ selectedRowKeys.length }}</span> 项
            </template>
            <template v-else>
              共 <span class="font-medium">{{ treeNodeCount }}</span> 条
            </template>
          </div>
          <slot name="toolbarLeft" />
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
              <Plus v-if="action.icon" :size="16" class="mr-1" />
              {{ action.label }}
            </Button>
          </template>
        </div>
      </div>

      <!-- 树形表格 -->
      <WmsDataTable
        v-if="showTable"
        v-model:expanded-row-keys="expandedRowKeys"
        :scroll="{ y: tableScrollY }"
        sticky
        :columns="columns"
        :data-source="treeData"
        :loading="loading"
        :row-key="treeIdField"
        :pagination="false"
        :selected-row-keys="selectedRowKeys"
        :enable-selection="tableSelectionEnabled"
        :hide-tree-expand-icon="hideTreeExpandIcon"
        :column-settings-key="tableCode"
        @page-change="onPageChange"
        @selection-change="onSelectionChange"
        @table-change="onTableChange"
        class="lowcode-tree-table"
      >
        <template #bodyCell="{ column, record, index }">
          <!-- 序号 -->
          <template v-if="column?.key === 'seq'">
            {{ index + 1 }}
          </template>

          <!-- 操作列 -->
          <template v-else-if="column?.key === 'action'">
            <div class="flex items-center gap-2">
              <template v-for="action in rowActions" :key="action.key">
                <!-- 查看按钮 -->
                <Tooltip
                  v-if="(action.key === 'read' || action.key === 'row_read') && canRenderAction(action)"
                  title="查看"
                >
                  <Button type="link" size="small" class="p-0" @click="handleToolbarAction(action, record)">
                    <Eye />
                  </Button>
                </Tooltip>

                <!-- 编辑按钮 -->
                <Tooltip
                  v-else-if="(action.key === 'edit' || action.key === 'row_edit') && canRenderAction(action)"
                  title="编辑"
                >
                  <Button type="link" size="small" class="p-0" @click="handleToolbarAction(action, record)">
                    <Pencil />
                  </Button>
                </Tooltip>

                <!-- 启用/停用按钮 -->
                <Tooltip
                  v-else-if="action.key === 'toggle' && canRenderAction(action)"
                  :title="isRecordEnabled(record) ? '停用' : '启用'"
                >
                  <Button
                    type="link"
                    size="small"
                    class="p-0"
                    @click="handleToolbarAction(action, record)"
                  >
                    <CheckCircle
                      v-if="isRecordEnabled(record)"
                      :class="isRecordEnabled(record) ? 'text-green-500 text-lg' : 'text-gray-400 text-lg'"
                    />
                    <XCircle
                      v-else
                      :class="isRecordEnabled(record) ? 'text-green-500 text-lg' : 'text-gray-400 text-lg'"
                    />
                  </Button>
                </Tooltip>

                <!-- 删除按钮 -->
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
                      <Trash2 />
                    </Button>
                  </Popconfirm>
                </Tooltip>

                <!-- 新增子部门按钮（树形特有） -->
                <Tooltip
                  v-else-if="action.key === 'addChild' && canRenderAction(action)"
                  title="新增子部门"
                >
                  <Button type="link" size="small" class="p-0" @click="handleAddChildAction(action, record)">
                    <Plus />
                  </Button>
                </Tooltip>

                <!-- 其他自定义行内按钮 -->
                <Button
                  v-else-if="canRenderAction(action)"
                  type="link"
                  size="small"
                  @click="handleToolbarAction(action, record)"
                >
                  <Plus v-if="action.icon" class="mr-1" />
                  {{ action.label }}
                </Button>
              </template>
              <slot name="appendAction" :record="record" />
            </div>
          </template>

          <!-- 状态标签 -->
          <template v-else-if="column?.key === 'isEnabled'">
            <Tag :color="isRecordEnabled(record) ? 'success' : 'default'">
              {{ isRecordEnabled(record) ? '启用' : '停用' }}
            </Tag>
          </template>

          <!-- 默认单元格 -->
          <slot v-else name="bodyCell" v-bind="{ column, record, index }">
            {{ formatDefaultCell(record, column) }}
          </slot>
        </template>
      </WmsDataTable>

      <!-- 自定义内容区域 -->
      <slot name="content" />
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  Button,
  Popconfirm,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
} from 'lucide-vue-next';
import { Page } from '@vben/common-ui';
import { useAccess } from '@vben/access';
import WmsSearchBar from '#/components/common/WmsSearchBar.vue';
import WmsDataTable from '#/components/common/WmsDataTable.vue';
import { fetchPageMeta, fetchTreeAll, deleteRecord, toggleRecord } from './api';
import type { ColumnMeta, LowcodeAction, LowcodeSearchField, StatsCardConfig, TableMeta } from './types';
import { useSlots } from 'vue';
import {
  handleAction,
  isExportAction,
  parseEventConfig,
  type ActionContext,
} from './events';
import { expandAllPermissionCodes } from './permission-utils';

interface TreeConfig {
  /** 节点 ID 字段名 */
  idField?: string;
  /** 父节点 ID 字段名 */
  parentIdField?: string;
  /** 根节点 parentId 值（默认为 0） */
  rootValue?: number | string;
  /** 节点显示字段名（用于树节点标题） */
  titleField?: string;
  /** 是否默认展开全部节点 */
  defaultExpandAll?: boolean;
}

interface Props {
  /** 表编码，对应 sys_table_meta.table_code */
  tableCode: string;
  /** 页面标题 */
  pageTitle: string;
  /** 页面描述 */
  pageDesc?: string;
  /** CRUD 接口前缀 */
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
  /** 是否显示表格 */
  showTable?: boolean;
  /** 树形配置 */
  treeConfig?: TreeConfig;
  /** 为 true 时隐藏树表格行首 +/- 展开图标（仍默认展开子级） */
  hideTreeExpandIcon?: boolean;
  /** 自定义行内操作（树形特有，如新增子部门） */
  rowActions?: LowcodeAction[];
}

const props = withDefaults(defineProps<Props>(), {
  showStats: false,
  statsConfig: () => [],
  enableSelection: false,
  staticSearchFields: () => [],
  staticColumns: () => [],
  staticOperations: () => [],
  showTable: true,
  treeConfig: () => ({
    idField: 'id',
    parentIdField: 'parentId',
    rootValue: 0,
    titleField: 'title',
    defaultExpandAll: true,
  }),
  hideTreeExpandIcon: false,
  rowActions: () => [],
});

const emit = defineEmits<{
  (e: 'search', query: Record<string, any>): void;
  (e: 'create'): void;
  (e: 'edit', record: Record<string, any>): void;
  (e: 'delete', id: number | string): void;
  (e: 'toggle', record: Record<string, any>, enabled: boolean): void;
  (e: 'formSuccess', record: Record<string, any>): void;
  (e: 'selectionChange', keys: any[], rows: any[]): void;
  (e: 'addChild', parentRecord: Record<string, any>): void;
}>();

// ==================== 树形配置 ====================
const treeIdField = computed(() => props.treeConfig?.idField ?? 'id');
const treeParentIdField = computed(() => props.treeConfig?.parentIdField ?? 'parentId');
const treeRootValue = computed(() => props.treeConfig?.rootValue ?? 0);
const treeTitleField = computed(() => props.treeConfig?.titleField ?? 'title');

// ==================== 状态 ====================
const loading = ref(false);
const rawDataList = ref<any[]>([]);
const selectedRowKeys = ref<any[]>([]);
const selectedRows = computed(() =>
  rawDataList.value.filter((row) => selectedRowKeys.value.includes(getNodeId(row)))
);
const searchForm = reactive<Record<string, any>>({});
const searchQueryModes = ref<Record<string, 'eq' | 'like'>>({});
const actionLoading = ref<Record<string, boolean>>({});
const router = useRouter();
const route = useRoute();

const tableScrollY = 'calc(100vh - 280px)';

const pagination = reactive({
  current: 1,
  pageSize: 999,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const sortState = reactive<{
  orderByColumn: string;
  isAsc: '' | 'asc' | 'desc';
}>({
  orderByColumn: '',
  isAsc: '',
});

const stats = reactive<Record<string, any>>({});

// ==================== 展开状态 ====================
const expandedRowKeys = ref<any[]>([]);
const expandAll = ref(true);

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

const searchFieldsUrl = computed(() =>
  `/api/system/meta/column/schema?tableCode=${props.tableCode}`
);

// ==================== 操作按钮 ====================
const toolbarActions = computed(() =>
  metaOperations.value.filter((op) => {
    const pos = op.position;
    return pos === 'toolbar' || !pos;
  })
);

const rowActions = computed(() => {
  const metaRowOps = metaOperations.value.filter((op) => op.position === 'row');
  if (props.rowActions.length) {
    return [...metaRowOps, ...props.rowActions];
  }
  return metaRowOps;
});

const visibleToolbarActions = computed(() =>
  toolbarActions.value.filter((op) => canRenderAction(op)),
);

function actionNeedsSelectedRows(action: LowcodeAction): boolean {
  const config = parseEventConfig(action.eventConfig ?? {});
  if (config?.payloadType === 'selected') return true;
  if (isExportAction(action.key) && config?.scope === 'selected') return true;
  return false;
}

const tableSelectionEnabled = computed(() => {
  if (props.enableSelection || selectedRowKeys.value.length > 0) return true;
  return visibleToolbarActions.value.some((action) => actionNeedsSelectedRows(action));
});

/** 与列渲染一致：按 camel / snake 取值，供树节点 id、父 id、表格 row-key 使用 */
function pickRecordField(record: Record<string, any>, key: string): unknown {
  if (!record || key == null || key === '') return undefined;
  if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
  if (Object.prototype.hasOwnProperty.call(record, snake)) return record[snake];
  const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  if (Object.prototype.hasOwnProperty.call(record, camel)) return record[camel];
  return record[key];
}

// ==================== 树形数据处理 ====================
/** 获取节点 ID（不可仅用 record.deptId：接口可能只有 dept_id，否则全部为 undefined 会整棵树塌成一条） */
function getNodeId(record: any): any {
  if (!record) return undefined;
  const field = treeIdField.value;
  const v = pickRecordField(record, field);
  if (v !== undefined && v !== null && v !== '') return v;
  const id = pickRecordField(record, 'id');
  if (id !== undefined && id !== null && id !== '') return id;
  const code = pickRecordField(record, 'dept_code') ?? pickRecordField(record, 'deptCode');
  if (code !== undefined && code !== null && code !== '') return code;
  return undefined;
}

/** 获取父节点 ID */
function getParentId(record: any): any {
  if (!record) return undefined;
  return pickRecordField(record, treeParentIdField.value);
}

/** 将扁平列表转为树形结构 */
function buildTree(list: any[]): any[] {
  if (!list.length) return [];
  // 同一节点 id 在列表中出现多次时，第二遍会多次 push 同一引用，表格会显示重复行；先按树 id 去重
  const seenIds = new Set<any>();
  const deduped: any[] = [];
  for (const item of list) {
    const nid = getNodeId(item);
    if (nid !== undefined && nid !== null && nid !== '') {
      if (seenIds.has(nid)) continue;
      seenIds.add(nid);
    }
    deduped.push(item);
  }

  const idMap = new Map<any, any>();
  const rootNodes: any[] = [];

  // 第一遍：建立 ID -> 节点的映射
  for (const item of deduped) {
    idMap.set(getNodeId(item), { ...item, children: [] });
  }

  // 第二遍：建立父子关系
  for (const item of deduped) {
    const node = idMap.get(getNodeId(item))!;
    const parentId = getParentId(item);
    if (parentId === treeRootValue.value || parentId === null || parentId === undefined) {
      rootNodes.push(node);
    } else {
      const parent = idMap.get(parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }
  }

  return rootNodes;
}

/** 树形表格数据 */
const treeData = computed(() => buildTree(rawDataList.value));

/** 统计树节点总数（含所有层级） */
const treeNodeCount = computed(() => {
  let count = 0;
  function walk(nodes: any[]) {
    for (const node of nodes) {
      count++;
      if (node.children?.length) {
        walk(node.children);
      }
    }
  }
  walk(treeData.value);
  return count;
});

/** 收集所有可展开节点的 key */
function getAllExpandableKeys(nodes: any[]): any[] {
  const keys: any[] = [];
  function walk(items: any[]) {
    for (const node of items) {
      if (node.children?.length > 0) {
        keys.push(getNodeId(node));
        walk(node.children);
      }
    }
  }
  walk(nodes);
  return keys;
}

function toggleExpandAll() {
  expandAll.value = !expandAll.value;
  if (expandAll.value) {
    expandedRowKeys.value = getAllExpandableKeys(treeData.value);
  } else {
    expandedRowKeys.value = [];
  }
}

// ==================== 解析表格列 ====================
const columns = computed<any[]>(() => {
  if (props.staticColumns.length) return props.staticColumns;

  if (!metaColumns.value.length) return [];

  const cols: any[] = [];

  // 判断是否为树形标题列（显示 deptCode + deptName）
  const isTreeTitleColumn = (code: string) => {
    return props.treeConfig?.titleField === code;
  };

  for (const col of metaColumns.value) {
    const code = col.code ?? col.field;
    const title = col.label ?? col.title ?? code;

    if (col.isShowInList === 0 || col.isShowInList === false) continue;

    const tableCol: any = {
      title,
      dataIndex: code,
      key: code,
      width: col.width ?? 120,
      align: 'center',
    };

    if (col.isSortable) tableCol.sorter = true;
    if (code === 'isEnabled' || code === 'is_enabled') {
      tableCol.key = 'isEnabled';
    }

    // 树形标题列：显示 部门编码 + 部门名称
    if (isTreeTitleColumn(code)) {
      tableCol.customRender = ({ text, record }: { text: any; record: any }) => {
        // 尝试多种可能的编码字段名
        const deptCode =
          record?.deptCode ??
          record?.dept_code ??
          record?.departmentCode ??
          record?.department_code ??
          record?.orgCode ??
          record?.org_code ??
          record?.code ??
          '';
        const deptName = text ?? '';
        if (deptCode && deptName) {
          return `${deptCode} ${deptName}`;
        }
        return deptName || text;
      };
    }

    cols.push(tableCol);
  }

  const hasAppendActionSlot = !!slots.appendAction;
  if (rowActions.value.length || hasAppendActionSlot) {
    const rowCount = rowActions.value.length + (hasAppendActionSlot ? 1 : 0);
    const actionWidth = Math.max(120, rowCount * 44 + 16);
    cols.push({ title: '操作', key: 'action', width: actionWidth, align: 'center', fixed: 'right' });
  }

  return cols;
});

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
    const query: Record<string, any> = {};
    for (const [key, val] of Object.entries(searchForm)) {
      if (key === '__queryModes') continue;
      if (val !== undefined && val !== null && val !== '') {
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

    // 树形列表不分页，使用 listAll 获取全部数据
    const rows = await fetchTreeAll({
      tableCode: props.tableCode,
      prefix: props.crudPrefix,
      tableMeta: currentTableMeta.value,
      query,
      queryModes,
    });

    rawDataList.value = Array.isArray(rows) ? rows : [];
    pagination.total = rawDataList.value.length;

    // 默认展开
    if (props.treeConfig?.defaultExpandAll !== false && expandAll.value) {
      expandedRowKeys.value = getAllExpandableKeys(treeData.value);
    }

    if (props.showStats) {
      updateStats(rawDataList.value);
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
  const enabled = rows.filter((r) => isRecordEnabled(r)).length;

  const configMap = new Map(props.statsConfig.map((c) => [c.field, c]));
  if (configMap.has('totalCount')) stats.totalCount = total;
  if (configMap.has('enabledCount')) stats.enabledCount = enabled;
  if (configMap.has('disabledCount')) stats.disabledCount = total - enabled;
}

// ==================== 事件处理 ====================
const { hasAccessByCodes } = useAccess();
const slots = useSlots();

function isRecordEnabled(record: any): boolean {
  const val = record?.isEnabled ?? record?.is_enabled;
  return val === 1 || val === true || val === '1' || val === 'true';
}

function canRenderAction(action: LowcodeAction): boolean {
  if (action.status !== undefined && Number(action.status) !== 1) return false;
  if (action.showButton === 0 || action.showButton === false || action.showButton === '0') return false;
  const codes = expandAllPermissionCodes(action.permission);
  if (codes.length === 0) return true;
  const matched = codes.find((code) => hasAccessByCodes([code]));
  return !!matched;
}

function getButtonType(action: LowcodeAction): 'default' | 'primary' | 'text' {
  if (action.key === 'create' || action.key === 'add') return 'primary';
  if (action.key === 'delete') return 'text';
  if (action.type === 'link') return 'text';
  if (action.type === 'primary') return 'primary';
  return 'default';
}

function isDangerButton(action: LowcodeAction): boolean {
  return action.key === 'delete' || action.type === 'danger';
}

async function handleToolbarAction(action: LowcodeAction, record?: any) {
  actionLoading.value[action.key] = true;
  try {
    const ctx: ActionContext = {
      crudPrefix: props.crudPrefix,
      tableCode: props.tableCode,
      searchForm: { ...searchForm },
      searchQueryModes: { ...searchQueryModes.value },
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
  const id = getNodeId(record);
  if (id === undefined || id === null || id === '') {
    message.error('当前记录缺少 ID，无法查看');
    return;
  }
  navigateToLowcodeForm('view', String(id));
}

async function handleExportAction(action: LowcodeAction) {
  const config = parseEventConfig(action.eventConfig ?? {});
  let url = config.url;
  if (!url) {
    if (props.crudPrefix) {
      url = `${props.crudPrefix}/export`;
    } else if (props.tableCode) {
      url = `/api/wms/crud/${props.tableCode}/export`;
    } else {
      message.error('导出接口未配置');
      return;
    }
  }

  const payloadType = config.payloadType || 'filtered';
  const params: Record<string, any> = {};

  switch (payloadType) {
    case 'selected':
      if (!selectedRowKeys.value.length) {
        message.warning('请先勾选要导出的数据');
        return;
      }
      params.ids = selectedRowKeys.value;
      break;
  }

  const { downloadBlob } = await import('#/utils/download');
  const fileName = config.fileName || `${props.pageTitle || props.tableCode}_${new Date().getTime()}.xlsx`;
  try {
    await downloadBlob(url, params, { method: 'GET', fileName });
    message.success('导出成功');
  } catch (error: any) {
    message.error('导出失败: ' + error.message);
  }
}

function handleSearch(payload?: Record<string, any>) {
  if (payload && typeof payload === 'object') {
    Object.keys(searchForm).forEach((key) => {
      if (!(key in payload)) delete searchForm[key];
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
  const rows = rawDataList.value.filter((row) => keys.includes(getNodeId(row)));
  emit('selectionChange', keys, rows);
}

function onTableChange(_pagination: any, _filters: any, sorter: any) {
  const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
  const field = currentSorter?.field ?? currentSorter?.columnKey;
  const order = currentSorter?.order as string | undefined;
  if (!field || !order) {
    sortState.orderByColumn = '';
    sortState.isAsc = '';
  } else {
    sortState.orderByColumn = String(field);
    sortState.isAsc = order === 'descend' ? 'desc' : 'asc';
  }
  pagination.current = 1;
  loadData();
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
    const params: Record<string, string> = { mode, tableCode: props.tableCode };
    if (id != null && id !== '') params.id = id;
    void router.push({ name: routeName, params, query });
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
  const id = getNodeId(record);
  if (id === undefined || id === null || id === '') {
    message.error('当前记录缺少 ID，无法编辑');
    return;
  }
  navigateToLowcodeForm('edit', String(id));
  emit('edit', record);
}

async function handleToggle(record: any, enabled: boolean) {
  try {
    const id = getNodeId(record);
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

/** 新增子部门（树形特有） */
function handleAddChildAction(action: LowcodeAction, record: any) {
  emit('addChild', record);
  // 同时触发通用 action 处理（如有自定义配置）
  handleToolbarAction(action, record);
}

// ==================== 初始化 ====================
async function init() {
  try {
    const { columns: metaCols, operations, tableMeta } = await fetchPageMeta(props.tableCode);
    metaColumns.value = metaCols;
    currentTableMeta.value = tableMeta ?? null;
    const configuredPageSize = Number(tableMeta?.pageSize);
    if (Number.isFinite(configuredPageSize) && configuredPageSize > 0) {
      pagination.pageSize = configuredPageSize;
    }
    metaOperations.value = operations.map((op: any) => ({
      key: op.operationCode,
      label: op.operationName,
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
      eventType: op.eventType || 'builtin',
      eventConfig: op.eventConfig,
      confirmMessage: op.confirmMessage,
      confirm: op.operationType === 'confirm' ? '是否确认该操作?' : undefined,
      status: op.status,
      showButton: op.showButton,
    }));

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
  handleSearch,
  handleAddChild: handleAddChildAction,
  rawDataList,
  treeData,
  pagination,
  selectedRowKeys,
  selectedRows,
  searchForm,
  expandedRowKeys,
  expandAll,
  toggleExpandAll,
});
</script>

<style scoped>
.lowcode-tree-page {
  min-height: 100%;
}

.lowcode-tree-table :deep(.ant-table-wrapper) {
  /* 确保树形表格正常显示 */
}

.lowcode-tree-page :deep(.lowcode-tree-table .ant-table-tbody > tr > td) {
  padding: 12px 16px;
}

/* 隐藏树行首展开控件（与 hideTreeExpandIcon 双保险，适配不同 Table 版本 DOM） */
.lowcode-tree-page--hide-row-expand :deep(.ant-table-row-expand-icon),
.lowcode-tree-page--hide-row-expand :deep(.ant-table-row-expand-icon-collapsed),
.lowcode-tree-page--hide-row-expand :deep(.ant-table-row-expand-icon-expanded),
.lowcode-tree-page--hide-row-expand :deep(button.ant-table-row-expand-icon) {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  pointer-events: none;
}

/* 隐藏展开图标时，清除树形缩进占位（多版本 class 兼容） */
.lowcode-tree-page--hide-row-expand :deep(.ant-table-row-indent),
.lowcode-tree-page--hide-row-expand :deep(span.ant-table-row-indent),
.lowcode-tree-page--hide-row-expand :deep(.ant-table-cell-indent),
.lowcode-tree-page--hide-row-expand :deep([class*='ant-table-cell-indent']) {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  padding: 0 !important;
  padding-left: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

.lowcode-tree-page--hide-row-expand :deep(.ant-table-cell-with-append) {
  padding-left: 16px !important;
}

/* 隐藏展开图标时，确保第一列内容左对齐 */
.lowcode-tree-page--hide-row-expand :deep(.ant-table-tbody .ant-table-row .ant-table-cell:first-child) {
  padding-left: 16px !important;
}
</style>
