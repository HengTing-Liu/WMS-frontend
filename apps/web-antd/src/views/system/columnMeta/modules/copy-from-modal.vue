<template>
  <Modal
    v-model:open="visible"
    title="从其他表复制字段"
    :confirm-loading="loading"
    width="900px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Alert type="info" show-icon class="mb-4">
      <template #message>
        选择一个源表，勾选需要复制的字段，点击确定将字段复制到当前表
      </template>
    </Alert>

    <Row :gutter="16">
      <!-- 左侧：表选择 -->
      <Col :span="8">
        <div class="panel-title">选择源表</div>
        <div class="table-list">
          <div
            v-for="table in availableTables"
            :key="table.id"
            class="table-item"
            :class="{ active: selectedSourceTableCode === table.tableCode }"
            @click="selectSourceTable(table.tableCode)"
          >
            <div class="table-code">{{ table.tableCode }}</div>
            <div class="table-name">{{ table.tableName }}</div>
          </div>
        </div>
      </Col>

      <!-- 右侧：字段选择 -->
      <Col :span="16">
        <div class="panel-header">
          <div class="panel-title">选择要复制的字段</div>
          <Checkbox
            :checked="isAllSelected"
            :indeterminate="isIndeterminate"
            @change="handleSelectAll"
          >
            全选
          </Checkbox>
        </div>

        <div v-if="!selectedSourceTableCode" class="empty-tip">
          请先选择左侧的源表
        </div>

        <div v-else-if="sourceColumns.length === 0" class="empty-tip">
          该表没有字段
        </div>

        <div v-else class="column-list">
          <CheckboxGroup v-model:value="selectedColumnIds" style="width: 100%">
            <div
              v-for="col in sourceColumns"
              :key="col.id"
              class="column-item"
            >
              <Checkbox :value="col.id">
                <div class="column-info">
                  <div class="column-main">
                    <span class="column-code">{{ col.field || col.columnCode }}</span>
                    <span class="column-name">{{ col.title || col.columnName }}</span>
                  </div>
                  <div class="column-tags">
                    <Tag size="small" :color="getFieldTypeColor(col.formType || col.fieldType)">
                      {{ getFieldTypeLabel(col.formType || col.fieldType) }}
                    </Tag>
                    <Tag size="small" :color="getDataTypeColor(col.dataType)">
                      {{ col.dataType }}
                    </Tag>
                  </div>
                </div>
              </Checkbox>
            </div>
          </CheckboxGroup>
        </div>

        <div v-if="selectedColumnIds.length > 0" class="selected-count">
          已选择 {{ selectedColumnIds.length }} 个字段
        </div>
      </Col>
    </Row>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Alert,
  Checkbox,
  CheckboxGroup,
  Col,
  Modal,
  Row,
  Tag,
  message,
} from 'ant-design-vue';
import {
  getColumnMetaByTableId,
  batchAddColumnMeta,
  type ColumnMetaApi,
} from '#/api/system/columnMeta';

const props = defineProps<{
  tableCode?: string;
  tableList: { id: number; tableCode: string; tableName: string }[];
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });

const loading = ref(false);
const selectedSourceTableCode = ref<string | undefined>(undefined);
const sourceColumns = ref<ColumnMetaApi.ColumnMeta[]>([]);
const selectedColumnIds = ref<(number | string)[]>([]);

// 过滤掉当前表
const availableTables = computed(() =>
  props.tableList.filter((t) => t.tableCode !== props.tableCode)
);

// 全选状态
const isAllSelected = computed(() => {
  if (sourceColumns.value.length === 0) return false;
  return selectedColumnIds.value.length === sourceColumns.value.length;
});

const isIndeterminate = computed(() => {
  if (sourceColumns.value.length === 0) return false;
  return (
    selectedColumnIds.value.length > 0 &&
    selectedColumnIds.value.length < sourceColumns.value.length
  );
});

async function selectSourceTable(tableCode: string) {
  selectedSourceTableCode.value = tableCode;
  selectedColumnIds.value = [];

  try {
    const columns = await getColumnMetaByTableId(tableCode);
    sourceColumns.value = columns.sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );
  } catch (error: any) {
    message.error(error?.message || '加载字段列表失败');
    sourceColumns.value = [];
  }
}

function handleSelectAll(e: any) {
  const checked = e.target.checked;
  if (checked) {
    selectedColumnIds.value = sourceColumns.value
      .map((col) => col.id!)
      .filter(Boolean);
  } else {
    selectedColumnIds.value = [];
  }
}

async function handleSubmit() {
  if (!props.tableCode) {
    message.error('目标表不存在');
    return;
  }

  if (selectedColumnIds.value.length === 0) {
    message.warning('请至少选择一个字段');
    return;
  }

  try {
    loading.value = true;

    // 准备复制的数据（去除id，更新tableCode）
    const dataToCopy = sourceColumns.value
      .filter((col) => selectedColumnIds.value.includes(col.id!))
      .map((col, index) => ({
        tableCode: props.tableCode!,
        field: col.field || col.columnCode,
        title: col.title || col.columnName,
        formType: col.formType || col.fieldType,
        dataType: col.dataType,
        dictType: col.dictType,
        required: col.required ?? col.isRequired,
        isUnique: col.isUnique,
        showInList: col.showInList ?? col.isShowInList,
        showInForm: col.showInForm ?? col.isShowInForm,
        showInExport: col.showInExport ?? 0,
        searchable: col.searchable ?? 0,
        sortable: col.sortable ?? col.isSortable,
        width: col.width ?? col.listWidth,
        colSpan: col.colSpan ?? col.formColSpan ?? 24,
        defaultValue: col.defaultValue,
        placeholder: col.placeholder,
        rulesJson: col.rulesJson || col.validRules,
        linkageJson: col.linkageJson,
        visibleCondition: col.visibleCondition,
        componentProps: col.componentProps,
        dataSource: col.dataSource,
        apiUrl: col.apiUrl,
        labelField: col.labelField,
        valueField: col.valueField,
        sectionKey: col.sectionKey,
        i18nKey: col.i18nKey,
        remark: col.remark,
        sortOrder: col.sortOrder,
        status: col.status ?? col.isEnabled,
      }));

    await batchAddColumnMeta(dataToCopy);
    message.success(`成功复制 ${dataToCopy.length} 个字段`);
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '复制失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}

function resetForm() {
  selectedSourceTableCode.value = undefined;
  sourceColumns.value = [];
  selectedColumnIds.value = [];
}

// 辅助函数
function getFieldTypeLabel(type: string): string {
  const map: Record<string, string> = {
    text: '文本',
    textarea: '多行文本',
    number: '数字',
    select: '下拉选择',
    switch: '开关',
    date: '日期',
    datetime: '日期时间',
    radio: '单选',
    checkbox: '多选',
  };
  return map[type] || type;
}

function getFieldTypeColor(type: string): string {
  const map: Record<string, string> = {
    text: 'blue',
    textarea: 'cyan',
    number: 'green',
    select: 'purple',
    switch: 'orange',
    date: 'magenta',
    datetime: 'red',
    radio: 'gold',
    checkbox: 'lime',
  };
  return map[type] || 'default';
}

function getDataTypeColor(type: string): string {
  const map: Record<string, string> = {
    string: 'blue',
    int: 'green',
    decimal: 'orange',
    datetime: 'purple',
  };
  return map[type] || 'default';
}

// 监听 visible 变化
watch(visible, (val) => {
  if (val) {
    resetForm();
  }
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.panel-title {
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  margin-bottom: 12px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.table-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.2s;
}

.table-item:last-child {
  border-bottom: none;
}

.table-item:hover {
  background: #f9fafb;
}

.table-item.active {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.table-code {
  font-weight: 500;
  color: #1f2937;
  font-size: 13px;
}

.table-name {
  color: #6b7280;
  font-size: 12px;
  margin-top: 2px;
}

.column-list {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
}

.column-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.column-item:last-child {
  border-bottom: none;
}

.column-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 8px;
}

.column-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.column-code {
  font-weight: 500;
  color: #1f2937;
  font-family: monospace;
}

.column-name {
  color: #6b7280;
  font-size: 13px;
}

.column-tags {
  display: flex;
  gap: 4px;
}

.empty-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #9ca3af;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;
}

.selected-count {
  margin-top: 12px;
  text-align: right;
  color: #3b82f6;
  font-weight: 500;
}
</style>
