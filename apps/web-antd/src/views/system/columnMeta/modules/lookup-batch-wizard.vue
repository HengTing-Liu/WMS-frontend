<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    width="880px"
    :confirm-loading="loading"
    :ok-text="okText"
    cancel-text="取消"
    :ok-button-props="{ disabled: okDisabled }"
    @ok="handleNext"
    @cancel="handleCancel"
  >
    <Alert type="info" show-icon class="mb-16">
      <template #message>
        批量为当前表添加<strong>关联表虚拟列</strong>。
        第一步选择外键 + 关联表 + 匹配字段；
        第二步勾选需要展示的字段，每一行可以选 1 个字段（普通列），也可以多选多个字段（自动用
        <code>❤</code> 拼接成一列），提交后后端一次性插入多条字段元数据。
      </template>
    </Alert>

    <!-- ========== 第 1 步：配置关联关系 ========== -->
    <div v-if="step === 1">
      <Form layout="vertical">
        <Row :gutter="16">
          <Col :span="8">
            <FormItem label="本表外键 (snake_case)" required>
              <Select
                v-model:value="state.refLocalField"
                show-search
                allow-clear
                :loading="localFieldLoading"
                placeholder="如 warehouse_code"
                option-filter-prop="label"
              >
                <SelectOption
                  v-for="item in localFieldOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                >
                  {{ item.label }}
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem label="关联表 (tableCode)" required>
              <Select
                v-model:value="state.refTableCode"
                show-search
                allow-clear
                :loading="refTableLoading"
                placeholder="选择关联表"
                option-filter-prop="label"
                @change="(v: any) => handleRefTableChange(v as string | undefined)"
              >
                <SelectOption
                  v-for="item in refTableOptions"
                  :key="item.tableCode"
                  :value="item.tableCode"
                  :label="`${item.tableCode} - ${item.tableName}`"
                >
                  {{ item.tableCode }} - {{ item.tableName }}
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem label="关联表匹配字段 (snake_case)" required>
              <Select
                v-model:value="state.refMatchField"
                show-search
                allow-clear
                :loading="refFieldLoading"
                :disabled="!state.refTableCode"
                placeholder="如 warehouse_code"
                option-filter-prop="label"
              >
                <SelectOption
                  v-for="item in refSnakeFieldOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                >
                  {{ item.label }}
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>
        <Alert
          v-if="state.refTableCode && refTableMissing"
          type="warning"
          class="mb-16"
          show-icon
          message="该关联表在 sys_column_meta 中尚未配置字段元数据，提交时后端只做格式校验。"
        />
      </Form>
    </div>

    <!-- ========== 第 2 步：批量勾选展示字段 ========== -->
    <div v-if="step === 2">
      <div class="step2-header">
        <div>
          <Tag color="blue">外键：{{ state.refLocalField }}</Tag>
          <Tag color="green">关联表：{{ state.refTableCode }}</Tag>
          <Tag color="purple">匹配字段：{{ state.refMatchField }}</Tag>
        </div>
        <div class="defaults">
          <span class="label">默认勾选设置：</span>
          <Switch v-model:checked="defaultFlags.showInList" /> <span class="switch-label">列表显示</span>
          <Switch v-model:checked="defaultFlags.searchable" /> <span class="switch-label">可搜索</span>
          <Switch v-model:checked="defaultFlags.sortable" /> <span class="switch-label">可排序</span>
        </div>
      </div>

      <div class="target-list">
        <div class="target-header">
          <Checkbox
            :checked="allChecked"
            :indeterminate="indeterminate"
            @change="handleCheckAll"
          >
            <strong>全选</strong>（已选 {{ selectedCount }} / 共 {{ candidateFields.length }}）
          </Checkbox>
          <Space>
            <Button size="small" @click="addConcatRow">+ 新增拼接列</Button>
            <Input.Search v-model:value="keyword" placeholder="搜索字段" allow-clear class="search" />
          </Space>
        </div>

        <Table
          :columns="targetColumns"
          :data-source="filteredFields"
          :pagination="false"
          row-key="rowKey"
          size="small"
          :scroll="{ y: 360 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'selected'">
              <Checkbox v-model:checked="record.selected" @change="() => applyDefaults(record as CandidateField)" />
            </template>
            <template v-else-if="column.key === 'refTargetField'">
              <Select
                :value="(record as CandidateField).refTargetFields"
                mode="multiple"
                size="small"
                style="min-width: 240px; width: 100%;"
                placeholder="选 1 个普通列，选 多 个自动拼接"
                option-filter-prop="label"
                :max-tag-count="3"
                @change="(v: any) => handleTargetFieldsChange(record as CandidateField, v as string[])"
              >
                <SelectOption
                  v-for="opt in refSnakeFieldOptions"
                  :key="opt.value"
                  :value="opt.value"
                  :label="opt.label"
                >
                  {{ opt.label }}
                </SelectOption>
              </Select>
              <Tag v-if="(record as CandidateField).refTargetFields.length > 1" color="gold" class="ml-8">
                拼接（❤）
              </Tag>
              <Tag v-if="record.conflict" color="red" class="ml-8">编码冲突</Tag>
            </template>
            <template v-else-if="column.key === 'field'">
              <Input
                v-model:value="record.field"
                size="small"
                :status="record.conflict ? 'error' : undefined"
                @change="() => { (record as CandidateField).manualField = true; }"
              />
            </template>
            <template v-else-if="column.key === 'title'">
              <Input
                v-model:value="record.title"
                size="small"
                @change="() => { (record as CandidateField).manualTitle = true; }"
              />
            </template>
            <template v-else-if="column.key === 'flags'">
              <Space size="small">
                <Tooltip title="列表显示"><Switch v-model:checked="record.showInList" size="small" /></Tooltip>
                <Tooltip title="可搜索"><Switch v-model:checked="record.searchable" size="small" /></Tooltip>
                <Tooltip title="可排序"><Switch v-model:checked="record.sortable" size="small" /></Tooltip>
              </Space>
            </template>
            <template v-else-if="column.key === 'ops'">
              <Button
                v-if="(record as CandidateField).custom"
                size="small"
                type="link"
                danger
                @click="removeRow(record as CandidateField)"
              >
                删除
              </Button>
            </template>
          </template>
        </Table>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Form,
  FormItem,
  Input,
  Modal,
  Row,
  Select,
  SelectOption,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';
import {
  batchAddColumnMeta,
  getColumnMetaByTableId,
  getTableMetaListForSelect,
} from '#/api/system/columnMeta';

const props = defineProps<{ tableCode?: string }>();
const emit = defineEmits<{ success: [] }>();
const visible = defineModel<boolean>('visible', { required: true });

const loading = ref(false);
const step = ref<1 | 2>(1);

type LocalFieldOption = { value: string; label: string };
type RefTableOption = { tableCode: string; tableName: string };
type CandidateField = {
  rowKey: string;
  refTargetFields: string[];
  refTargetLabel: string;
  selected: boolean;
  field: string;
  title: string;
  showInList: boolean;
  searchable: boolean;
  sortable: boolean;
  conflict: boolean;
  custom: boolean;
  manualField: boolean;
  manualTitle: boolean;
};

let rowSeq = 0;
function nextRowKey(prefix = 'row') {
  rowSeq += 1;
  return `${prefix}_${rowSeq}`;
}

const state = reactive({
  refLocalField: '',
  refTableCode: '',
  refMatchField: '',
});

const defaultFlags = reactive({
  showInList: true,
  searchable: false,
  sortable: false,
});

const modalTitle = computed(() => `批量添加关联字段（第 ${step.value} / 2 步）`);
const okText = computed(() => (step.value === 1 ? '下一步' : '提交'));
const okDisabled = computed(() => {
  if (step.value === 1) {
    return !state.refLocalField || !state.refTableCode || !state.refMatchField;
  }
  return selectedCount.value === 0 || hasAnyConflict.value;
});

// ---------- 本表字段（用于选择外键） ----------
const localFieldLoading = ref(false);
const localFieldSnakeSet = ref<Set<string>>(new Set());
const localFieldCamelSet = ref<Set<string>>(new Set());
const localFieldOptions = ref<LocalFieldOption[]>([]);

async function loadLocalFields() {
  if (!props.tableCode) {
    localFieldOptions.value = [];
    return;
  }
  localFieldLoading.value = true;
  try {
    const list = await getColumnMetaByTableId(props.tableCode);
    const options: LocalFieldOption[] = [];
    const snakeSet = new Set<string>();
    const camelSet = new Set<string>();
    for (const item of list) {
      const snake = camelToSnake(String(item.field || ''));
      const label = item.title ? `${snake}（${item.title}）` : snake;
      if (!snake) continue;
      options.push({ value: snake, label });
      snakeSet.add(snake);
      camelSet.add(String(item.field || ''));
    }
    localFieldOptions.value = options;
    localFieldSnakeSet.value = snakeSet;
    localFieldCamelSet.value = camelSet;
  } catch (e: any) {
    localFieldOptions.value = [];
    message.error(e?.message || '加载本表字段失败');
  } finally {
    localFieldLoading.value = false;
  }
}

// ---------- 关联表列表 ----------
const refTableLoading = ref(false);
const refTableOptions = ref<RefTableOption[]>([]);

async function loadRefTables() {
  refTableLoading.value = true;
  try {
    const list = await getTableMetaListForSelect();
    refTableOptions.value = (list || []).map((t) => ({
      tableCode: t.tableCode,
      tableName: t.tableName,
    }));
  } catch (e: any) {
    refTableOptions.value = [];
    message.error(e?.message || '加载关联表列表失败');
  } finally {
    refTableLoading.value = false;
  }
}

// ---------- 关联表字段（用于选择匹配字段 & 候选展示字段） ----------
const refFieldLoading = ref(false);
const refFieldsRaw = ref<{ field: string; snake: string; title: string }[]>([]);
const refTableMissing = computed(() => !refFieldLoading.value && state.refTableCode && refFieldsRaw.value.length === 0);

const refSnakeFieldOptions = computed(() =>
  refFieldsRaw.value.map((f) => ({
    value: f.snake,
    label: f.title ? `${f.snake}（${f.title}）` : f.snake,
  })),
);

async function handleRefTableChange(code?: string) {
  state.refMatchField = '';
  refFieldsRaw.value = [];
  if (!code) return;
  refFieldLoading.value = true;
  try {
    const list = await getColumnMetaByTableId(code);
    refFieldsRaw.value = list.map((item: any) => ({
      field: String(item.field || ''),
      snake: camelToSnake(String(item.field || '')),
      title: String(item.title || ''),
    }));
    // 若关联表恰好有同名字段等于默认约定，自动填写匹配字段
    if (state.refLocalField) {
      const hit = refFieldsRaw.value.find((f) => f.snake === state.refLocalField);
      if (hit) state.refMatchField = hit.snake;
    }
  } catch (e: any) {
    refFieldsRaw.value = [];
    message.warning('关联表未配置字段元数据，匹配/展示字段需手动输入');
  } finally {
    refFieldLoading.value = false;
  }
}

// ---------- Step 2：候选展示字段 ----------
const candidateFields = ref<CandidateField[]>([]);
const keyword = ref('');

const filteredFields = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return candidateFields.value;
  return candidateFields.value.filter(
    (f) =>
      f.refTargetFields.join(',').toLowerCase().includes(kw) ||
      (f.refTargetLabel || '').toLowerCase().includes(kw) ||
      (f.field || '').toLowerCase().includes(kw) ||
      (f.title || '').toLowerCase().includes(kw),
  );
});

const selectedCount = computed(() => candidateFields.value.filter((f) => f.selected).length);
const allChecked = computed(() => candidateFields.value.length > 0 && candidateFields.value.every((f) => f.selected));
const indeterminate = computed(() => selectedCount.value > 0 && !allChecked.value);
const hasAnyConflict = computed(() => candidateFields.value.some((f) => f.selected && f.conflict));

function buildCandidates() {
  const matchSnake = state.refMatchField;
  const localSnake = state.refLocalField;
  const localPrefix = stripSuffix(localSnake, ['_code', '_id', '_no']);

  candidateFields.value = refFieldsRaw.value
    .filter((f) => f.snake && f.snake !== matchSnake)
    .map((f) => {
      const virtualField = computeVirtualField(localPrefix, f.snake, f.field);
      const row: CandidateField = {
        rowKey: nextRowKey('pre'),
        refTargetFields: [f.snake],
        refTargetLabel: f.title,
        selected: false,
        field: virtualField,
        title: f.title || virtualField,
        showInList: defaultFlags.showInList,
        searchable: defaultFlags.searchable,
        sortable: defaultFlags.sortable,
        conflict: false,
        custom: false,
        manualField: false,
        manualTitle: false,
      };
      return reactive(row) as CandidateField;
    });
  recomputeConflicts();
}

/**
 * 多选字段变化时：
 * 1. 更新 refTargetFields
 * 2. 若字段名/标题未被用户手工改过，自动用第一个字段重新生成
 * 3. 重新计算冲突
 */
function handleTargetFieldsChange(record: CandidateField, fields: string[]) {
  const cleaned = Array.from(new Set((fields || []).filter((x) => !!x)));
  record.refTargetFields = cleaned;
  if (cleaned.length === 0) {
    record.selected = false;
    recomputeConflicts();
    return;
  }
  const first = cleaned[0];
  const firstRaw = refFieldsRaw.value.find((f) => f.snake === first);
  const localPrefix = stripSuffix(state.refLocalField || '', ['_code', '_id', '_no']);
  if (!record.manualField && firstRaw) {
    record.field = computeVirtualField(localPrefix, firstRaw.snake, firstRaw.field);
  }
  if (!record.manualTitle) {
    if (cleaned.length === 1 && firstRaw?.title) {
      record.title = firstRaw.title;
    } else if (cleaned.length > 1) {
      // 多字段：用标题用 ❤ 拼接作为默认（用户仍可改）
      const titles = cleaned
        .map((snake) => refFieldsRaw.value.find((f) => f.snake === snake)?.title || snake)
        .filter(Boolean);
      record.title = titles.join('❤');
    }
  }
  // 拼接列默认打开列表显示
  if (!record.selected && record.custom) {
    record.selected = true;
    applyDefaults(record);
  }
  recomputeConflicts();
}

/**
 * 新增一个空白拼接行，让用户从关联表字段里多选组合。
 */
function addConcatRow() {
  const row: CandidateField = {
    rowKey: nextRowKey('cat'),
    refTargetFields: [],
    refTargetLabel: '',
    selected: true,
    field: '',
    title: '',
    showInList: defaultFlags.showInList,
    searchable: defaultFlags.searchable,
    sortable: defaultFlags.sortable,
    conflict: false,
    custom: true,
    manualField: false,
    manualTitle: false,
  };
  candidateFields.value = [reactive(row) as CandidateField, ...candidateFields.value];
}

function removeRow(record: CandidateField) {
  candidateFields.value = candidateFields.value.filter((f) => f.rowKey !== record.rowKey);
  recomputeConflicts();
}

/**
 * 基于“优化规则”生成虚拟字段 camelCase：
 * - localPrefix = warehouse
 * - refTargetSnake = warehouse_name → 目标片段 = warehouse_name 去掉前缀 "warehouse_" → name → 加回前缀 = warehouseName
 * - refTargetSnake = manager_name  → 目标片段无重叠 → warehouseManagerName
 */
function computeVirtualField(localPrefix: string, targetSnake: string, originalCamel: string): string {
  const tgt = targetSnake.toLowerCase();
  if (!localPrefix) return originalCamel || snakeToCamel(targetSnake);
  if (tgt.startsWith(`${localPrefix}_`)) {
    return snakeToCamel(`${localPrefix}_${tgt.slice(localPrefix.length + 1)}`);
  }
  return snakeToCamel(`${localPrefix}_${tgt}`);
}

function recomputeConflicts() {
  const camelSet = localFieldCamelSet.value;
  const selectedCamels = new Map<string, number>();
  for (const f of candidateFields.value) {
    if (!f.selected) continue;
    if (!f.field) continue;
    selectedCamels.set(f.field, (selectedCamels.get(f.field) || 0) + 1);
  }
  for (const f of candidateFields.value) {
    const fieldEmpty = !f.field || !f.field.trim();
    const targetsEmpty = !f.refTargetFields || f.refTargetFields.length === 0;
    f.conflict =
      f.selected &&
      (fieldEmpty ||
        targetsEmpty ||
        camelSet.has(f.field) ||
        (selectedCamels.get(f.field) || 0) > 1);
  }
}

function applyDefaults(record: CandidateField) {
  if (record.selected) {
    record.showInList = defaultFlags.showInList;
    record.searchable = defaultFlags.searchable;
    record.sortable = defaultFlags.sortable;
  }
  recomputeConflicts();
}

function handleCheckAll(e: any) {
  const checked = !!e?.target?.checked;
  for (const f of candidateFields.value) {
    f.selected = checked;
    if (checked) {
      f.showInList = defaultFlags.showInList;
      f.searchable = defaultFlags.searchable;
      f.sortable = defaultFlags.sortable;
    }
  }
  recomputeConflicts();
}

watch(
  () => [defaultFlags.showInList, defaultFlags.searchable, defaultFlags.sortable],
  () => {
    for (const f of candidateFields.value) {
      if (!f.selected) continue;
      f.showInList = defaultFlags.showInList;
      f.searchable = defaultFlags.searchable;
      f.sortable = defaultFlags.sortable;
    }
  },
);

watch(
  () => candidateFields.value.map((f) => f.field + '|' + (f.selected ? '1' : '0')),
  () => recomputeConflicts(),
  { deep: true },
);

// ---------- Table columns ----------
const targetColumns = computed<TableColumnsType>(() => [
  { title: '', key: 'selected', width: 56, fixed: 'left' },
  { title: '关联表字段（多选自动拼接）', key: 'refTargetField', width: 320 },
  { title: '虚拟字段编码(camelCase)', key: 'field', width: 200 },
  { title: '显示标题', key: 'title', width: 180 },
  { title: '默认开关', key: 'flags', width: 160 },
  { title: '操作', key: 'ops', width: 70 },
]);

// ---------- handlers ----------
function handleCancel() {
  visible.value = false;
}

function handleNext() {
  if (step.value === 1) {
    if (okDisabled.value) return;
    buildCandidates();
    step.value = 2;
    return;
  }
  submit();
}

async function submit() {
  if (!props.tableCode) {
    message.error('缺少当前表 tableCode');
    return;
  }
  const selected = candidateFields.value.filter((f) => f.selected);
  if (selected.length === 0) {
    message.warning('请至少勾选一个字段');
    return;
  }
  recomputeConflicts();
  if (selected.some((f) => f.conflict)) {
    message.error('存在字段编码冲突，请先解决');
    return;
  }
  const localFieldFinal = state.refLocalField;
  const payload = selected.map((f) => ({
    tableCode: props.tableCode!,
    field: f.field.trim(),
    columnName: camelToSnake(f.field.trim()),
    title: f.title.trim() || f.field.trim(),
    dataType: 'string',
    formType: 'text',
    required: 0,
    readonly: 1,
    editReadonly: 1,
    showInList: f.showInList ? 1 : 0,
    showInForm: 0,
    showInExport: f.showInList ? 1 : 0,
    showInImport: 0,
    searchable: f.searchable ? 1 : 0,
    sortable: f.sortable ? 1 : 0,
    status: 1,
    sortOrder: 9000,
    width: 140,
    refTableCode: state.refTableCode,
    refMatchField: state.refMatchField,
    refTargetField: f.refTargetFields.join(','),
    refLocalField: localFieldFinal,
  }));
  try {
    loading.value = true;
    await batchAddColumnMeta(payload);
    message.success(`已添加 ${payload.length} 个关联字段`);
    visible.value = false;
    emit('success');
  } catch (e: any) {
    message.error(e?.message || '批量新增失败');
  } finally {
    loading.value = false;
  }
}

// ---------- utils ----------
function camelToSnake(s: string) {
  if (!s) return '';
  if (s.includes('_')) return s.toLowerCase();
  return s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function snakeToCamel(s: string) {
  if (!s) return '';
  return s.toLowerCase().replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function stripSuffix(s: string, suffixes: string[]) {
  const lower = (s || '').toLowerCase();
  for (const suf of suffixes) {
    if (lower.endsWith(suf)) return lower.slice(0, lower.length - suf.length);
  }
  return lower;
}

// ---------- lifecycle ----------
watch(visible, (val) => {
  if (!val) return;
  step.value = 1;
  state.refLocalField = '';
  state.refTableCode = '';
  state.refMatchField = '';
  candidateFields.value = [];
  keyword.value = '';
  loadLocalFields();
  loadRefTables();
});
</script>

<style scoped>
.mb-16 {
  margin-bottom: 16px;
}

.step2-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.step2-header .defaults {
  display: flex;
  align-items: center;
  gap: 6px;
}

.step2-header .defaults .label {
  color: #4b5563;
  font-size: 12px;
  margin-right: 4px;
}

.switch-label {
  margin: 0 8px 0 4px;
  font-size: 12px;
  color: #4b5563;
}

.target-list {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  padding: 8px 8px 4px;
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 4px 8px;
  gap: 12px;
}

.target-header .search {
  width: 220px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.ml-8 {
  margin-left: 8px;
}
</style>
