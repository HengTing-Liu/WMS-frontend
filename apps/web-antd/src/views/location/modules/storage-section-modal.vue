<template>
  <Modal
    v-model:open="visible"
    title="新建存储分区"
    :confirm-loading="loading"
    width="1200px"
    :body-style="{ padding: '16px 0 0 0' }"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Row :gutter="0" class="modal-body">
      <!-- 左侧配置面板 -->
      <Col :span="15" class="left-panel">
        <div class="panel-content">
          <!-- 父节点信息卡片 -->
          <div class="section-card">
            <div class="section-title">
              <IconifyIcon icon="material-symbols:account-tree" class="mr-1" />
              本级库位信息
            </div>
            <div class="parent-info-full">
              <div class="info-row">
                <span class="info-label">库位ID：</span>
                <span class="info-value">{{ parentInfo.id ?? '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">库位名称：</span>
                <span class="info-value">{{ parentInfo.locationName || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">库位等级：</span>
                <Tag color="blue">{{ formatLocationGrade(parentInfo.locationGrade) }}</Tag>
              </div>
              <div class="info-row">
                <span class="info-label">库位类型：</span>
                <span class="info-value">{{ parentInfo.locationType || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">层级深度：</span>
                <span class="info-value">{{ parentInfo.locationLevel }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">总层数：</span>
                <span class="info-value">{{ parentInfo.locationLevelCount }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">同级序号：</span>
                <span class="info-value">{{ parentInfo.internalSerialNo }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">同级总数：</span>
                <span class="info-value">{{ parentInfo.internalQuantity }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">仓库编码：</span>
                <span class="info-value">{{ parentInfo.warehouseCode || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">使用状态：</span>
                <Tag :color="parentInfo.isUse === 1 ? 'red' : 'green'">{{ formatIsUse(parentInfo.isUse) }}</Tag>
              </div>
              <div class="info-row">
                <span class="info-label">排序号：</span>
                <span class="info-value">{{ parentInfo.locationSortNo || '-' }}</span>
              </div>
              <div class="info-row info-row-wide">
                <span class="info-label">全路径名称：</span>
                <span class="info-value">{{ parentInfo.locationFullpathName || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- 分区层级配置 -->
          <div class="section-card">
            <div class="section-title">
              <IconifyIcon icon="material-symbols:layers" class="mr-1" />
              分区层级配置
              <span class="section-subtitle">（从上到下，最多5级）</span>
            </div>

            <div class="level-header">
              <span class="level-header-item" style="width: 28%">库位类型</span>
              <span class="level-header-item" style="width: 28%">数量</span>
              <span class="level-header-item" style="width: 28%">起始编号</span>
              <span class="level-header-item" style="width: 16%">操作</span>
            </div>

            <div
              v-for="(level, idx) in formData.levels"
              :key="idx"
              class="level-row"
            >
              <div class="level-badge">{{ idx + 1 }}</div>
              <Select
                v-model:value="level.locationType"
                placeholder="类型"
                style="width: 28%"
                size="small"
              >
                <SelectOption v-for="t in sectionTypeOpts" :key="t" :value="t">{{ t }}</SelectOption>
              </Select>
              <InputNumber
                v-model:value="level.quantity"
                :min="1"
                :max="100"
                placeholder="数量"
                style="width: 28%"
                size="small"
              />
              <InputNumber
                v-model:value="level.startSerialNo"
                :min="1"
                :max="9999"
                placeholder="起始"
                style="width: 28%"
                size="small"
              />
              <Button
                v-if="formData.levels.length > 1"
                type="link"
                danger
                size="small"
                class="del-btn"
                @click="removeLevel(idx)"
              >
                <IconifyIcon icon="material-symbols:delete-outline" />
              </Button>
            </div>

            <Button
              v-if="formData.levels.length < 5"
              type="dashed"
              block
              size="small"
              class="add-level-btn"
              @click="addLevel"
            >
              <IconifyIcon icon="material-symbols:add" />
              添加层级
            </Button>
          </div>

          <!-- 容器配置 -->
          <div class="section-card" :class="{ disabled: !createContainer }">
            <div class="section-title" style="justify-content: space-between;">
              <div style="display: flex; align-items: center;">
                <IconifyIcon icon="material-symbols:box" class="mr-1" />
                容器配置
                <span class="section-subtitle">（最底层分区下自动创建）</span>
              </div>
              <Checkbox v-model:checked="createContainer">
                是否创建容器
              </Checkbox>
            </div>

            <Row :gutter="15">
              <Col :span="5">
                <div class="form-item">
                  <label class="form-label">容器类型</label>
                  <Select
                    v-model:value="formData.container.locationType"
                    placeholder="请选择"
                    size="small"
                    style="width: 100%"
                    :disabled="!createContainer"
                    :dropdown-style="{ minWidth: '220px' }"
                    @change="handleContainerTypeChange"
                  >
                    <SelectOption v-for="t in containerTypeOpts" :key="t" :value="t">{{ t }}</SelectOption>
                  </Select>
                </div>
              </Col>
              <Col :span="4">
                <div class="form-item">
                  <label class="form-label">规格</label>
                  <Input
                    :value="selectedContainerSpec.spec || '-'"
                    size="small"
                    disabled
                    style="width: 100%"
                  />
                </div>
              </Col>
              <Col :span="3">
                <div class="form-item">
                  <label class="form-label">数量</label>
                  <InputNumber
                    v-model:value="formData.container.quantity"
                    :min="1"
                    :max="100"
                    style="width: 100%"
                    size="small"
                    placeholder="数量"
                    :disabled="!createContainer"
                  />
                </div>
              </Col>
              <Col :span="10">
                <div class="form-item">
                  <label class="form-label">容器名称</label>
                  <Select
                    v-model:value="formData.container.locationName"
                    placeholder="请选择流水号规则"
                    size="small"
                    :disabled="!createContainer"
                    :loading="serialRuleLoading"
                    :options="serialRuleOptions"
                    style="width: 100%"
                  />
                </div>
              </Col>
            </Row>
            <div
              v-if="createContainer && formData.container.locationName && currentSerialPreview"
              class="serial-preview"
            >
              <span class="preview-label">当前容器名称起始数据为 </span>
              <span class="preview-value">{{ currentSerialPreview }}</span>
              <span class="preview-label">，仅供参考，保存时自动生成。</span>
            </div>
          </div>

          <!-- 统计信息 -->
          <Alert
            :message="statsMessage"
            type="info"
            show-icon
            class="stats-alert"
          />
        </div>
      </Col>

      <!-- 右侧预览面板 -->
      <Col :span="9" class="right-panel">
        <div class="preview-wrapper">
          <div class="preview-title">
            <IconifyIcon icon="material-symbols:preview" class="mr-1" />
            结构预览
            <div class="preview-actions">
              <Button type="text" size="small" class="refresh-btn" @click="handleRefreshPreview">
                <template #icon><IconifyIcon icon="material-symbols:refresh" /></template>
              </Button>
            </div>
          </div>
          <div class="preview-content">
            <Empty
              v-if="previewTreeData.length === 0"
              description="暂无预览数据"
              image="simple"
            />
            <Tree
              v-else
              :tree-data="previewTreeData"
              :default-expand-all="true"
              :show-line="true"
              :show-icon="true"
              class="preview-tree"
            >
              <template #title="{ dataRef }">
                <span :class="['tree-node', `node-grade-${dataRef.gradeType}`]">
                  {{ dataRef.title }}
                  <Tag
                    v-if="dataRef.count"
                    size="small"
                    class="node-count"
                  >
                    {{ dataRef.count }}个
                  </Tag>
                </span>
              </template>
            </Tree>
          </div>
        </div>
      </Col>
    </Row>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Empty,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  SelectOption,
  Tag,
  Tree,
  message,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import { batchCreateHierarchy, getDetail } from '#/api/wms/location';
import type { LevelConfig, ContainerConfig } from '#/api/wms/location';
import { getDictDataByType } from '#/api/system/dict';
import { getSerialNumberList } from '#/api/system/serial-number';

interface Props {
  visible: boolean;
  parentId: number | null;
  parentLocationName: string;
  parentWarehouseCode: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
  (e: 'success'): void;
}>();

const loading = ref(false);
// 不再使用 containerSpec / customRows / customCols，规格由字典自动解析
const createContainer = ref(false);

// 分区类型字典：dict_label 列表
const sectionDictLoaded = ref(false);
const sectionDictOptions = ref<string[]>([]);

// 分区类型选项
const sectionTypeOpts = computed(() => {
  if (!sectionDictLoaded.value) return ['层', '架', '行', '列', '格'];
  return sectionDictOptions.value;
});

// 字典数据：dict_label -> { spec, childrenQuantity }
const dictLoaded = ref(false);
const dictOptions = ref<Record<string, { spec: string; childrenQuantity: number }>>({});

// 容器类型选项 = 字典 dict_label 列表
const containerTypeOpts = computed(() => {
  if (!dictLoaded.value) return ['96孔盒', '48孔盒', '24孔盒'];
  return Object.keys(dictOptions.value);
});

// 当前选中的容器类型对应的规格（从 dict_value 解析）
const selectedContainerSpec = computed(() => {
  const label = formData.container.locationType;
  if (!label || !dictOptions.value[label]) return { spec: '', childrenQuantity: 0 };
  return dictOptions.value[label];
});

// 流水号规则选项（apply_form_field = inv_location|location_name）
const serialRuleLoading = ref(false);
const serialRuleOptions = ref<Array<{ label: string; value: string }>>([]);

// 当前流水号预览值
const currentSerialPreview = ref('');

// 获取当前流水号预览（只是查看，不占用）
async function loadCurrentSerialPreview() {
  if (!formData.container.locationName) {
    currentSerialPreview.value = '';
    return;
  }
  try {
    const res = await getSerialNumberList({ applyFormField: 'inv_location|location_name', pageSize: 999 });
    const rows = res.rows || [];
    const rule = rows.find((r: any) => (r.ruleName || r.name) === formData.container.locationName);
    if (!rule) {
      currentSerialPreview.value = '';
      return;
    }
    const prefix = rule.prefix || '';
    const suffix = rule.suffix || '';
    const seqLength = rule.seqLength || rule.seq_length || 4;
    const currentSeq = rule.currentSeq || rule.current_seq || 1;
    const dateFormat = rule.dateFormat || rule.date_format || '';
    let datePart = '';
    if (dateFormat) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      if (dateFormat === 'yyyy') datePart = String(year);
      else if (dateFormat === 'yyyyMM') datePart = `${year}${month}`;
      else if (dateFormat === 'yyyyMMdd') datePart = `${year}${month}${day}`;
    }
    const seqStr = String(currentSeq).padStart(seqLength, '0');
    currentSerialPreview.value = `${prefix}${datePart}${seqStr}${suffix}`;
  } catch {
    currentSerialPreview.value = '';
  }
}

async function loadSerialRules() {
  serialRuleLoading.value = true;
  try {
    const res = await getSerialNumberList({ applyFormField: 'inv_location|location_name', pageSize: 999 });
    serialRuleOptions.value = (res.rows || []).map((r: any) => ({
      label: r.ruleName || r.name || r.ruleCode || r.applyFormField,
      value: r.ruleName || r.name || r.applyFormField,
    }));
  } catch (e: any) {
    console.warn('[流水号规则加载失败]', e?.message || e);
    serialRuleOptions.value = [];
  } finally {
    serialRuleLoading.value = false;
  }
}

// 父节点详细信息
const parentInfo = reactive({
  id: null as number | null,
  parentId: null as number | null,
  locationName: '',
  locationGrade: '',
  locationType: '',
  locationLevel: 1,
  locationLevelCount: 1,
  internalSerialNo: 1,
  internalQuantity: 1,
  warehouseCode: '',
  parentName: '',
  storageMode: '',
  specification: '',
  isUse: 0,
  locationSortNo: '',
  locationFullpathName: '',
  occupancyRate: 0,
  remarks: '',
});

function formatStorageMode(mode: string) {
  if (mode === 'Exclusive') return '独占';
  if (mode === 'Shared') return '共享';
  return mode || '-';
}

function formatIsUse(use: number) {
  return use === 1 ? '占用' : '空闲';
}

function formatLocationGrade(grade: string) {
  const map: Record<string, string> = {
    'StorageType': '存储对象',
    '存储对象': '存储对象',
    'StorageSection': '存储分区',
    '存储分区': '存储分区',
    'Container': '存储容器',
    '存储容器': '存储容器',
    'ContainerPosition': '孔位',
    '孔位': '孔位',
    'Type': '类型',
    '类型': '类型',
  };
  return map[grade] || grade || '-';
}

function formatOccupancyRate(rate: number) {
  if (rate === null || rate === undefined) return '-';
  return `${(rate * 100).toFixed(2)}%`;
}

// 表单数据
const formData = reactive<{
  levels: LevelConfig[];
  container: ContainerConfig;
}>({
  levels: [
    { locationType: '层', quantity: 1, startSerialNo: 1 },
  ],
  container: {
    locationType: '',
    quantity: 1,
    specification: '',
    childrenQuantity: 0,
    childrenType: '孔',
    locationName: '',
  },
});

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

function handleContainerTypeChange() {
  const label = formData.container.locationType;
  const opt = dictOptions.value[label];
  if (opt) {
    formData.container.specification = opt.spec;
    formData.container.childrenQuantity = opt.childrenQuantity;
  }
}

async function loadSectionDict() {
  try {
    const res = await getDictDataByType('location_type_for_section');
    const list = Array.isArray(res) ? res : (res?.data || []);
    if (list.length > 0) {
      const options: string[] = [];
      list.forEach((item: any) => {
        const dictLabel = item.dictLabel || item.dict_label || item.label || item.text || '';
        if (dictLabel) {
          options.push(dictLabel);
        }
      });
      sectionDictOptions.value = options;
      sectionDictLoaded.value = options.length > 0;
    }
  } catch (e: any) {
    console.warn('[分区字典加载失败]', e?.message || e);
    // 保持默认
  }
}

async function loadContainerDict() {
  try {
    const res = await getDictDataByType('location_type_for_container');
    const list = Array.isArray(res) ? res : (res?.data || []);
    console.log('[字典加载] 原始数据条数:', list.length);
    if (list.length > 0) {
      const options: Record<string, { spec: string; childrenQuantity: number }> = {};
      list.forEach((item: any, idx: number) => {
        // 兼容多种可能的字段名
        const dictValue = item.dictValue || item.dict_value || item.value || '';
        const displayLabel = item.dictLabel || item.dict_label || item.label || item.text || '';
        console.log(`[字典项 ${idx}]`, { raw: item, dictValue, displayLabel });
        const parts = dictValue.split('_');
        if (parts.length >= 2) {
          const spec = parts[1];
          const numMatch = (parts[0] || '').match(/^(\d+)/);
          const childrenQuantity = numMatch ? parseInt(numMatch[1], 10) : 0;
          // 优先使用 displayLabel，若为空则回退到 dictValue 的第一部分
          const key = displayLabel || parts[0];
          options[key] = { spec, childrenQuantity };
        }
      });
      dictOptions.value = options;
      dictLoaded.value = Object.keys(options).length > 0;
      console.log('[字典解析结果]', dictOptions.value);
    }
  } catch (e: any) {
    console.warn('[字典加载失败]', e?.message || e);
    // 保持默认
  }
}

// 加载父节点详情
async function loadParentInfo() {
  if (!props.parentId) return;
  try {
    const data = await getDetail(props.parentId);
    if (data) {
      parentInfo.id = data.id ?? null;
      parentInfo.parentId = data.parentId ?? null;
      parentInfo.locationName = data.locationName || props.parentLocationName;
      parentInfo.locationGrade = data.locationGrade || '存储对象';
      parentInfo.locationType = data.locationType || '';
      parentInfo.locationLevel = data.locationLevel ?? 1;
      parentInfo.locationLevelCount = data.locationLevelCount ?? 1;
      parentInfo.internalSerialNo = data.internalSerialNo ?? 1;
      parentInfo.internalQuantity = data.internalQuantity ?? 1;
      parentInfo.warehouseCode = data.warehouseCode || props.parentWarehouseCode;
      parentInfo.parentName = data.parentName || '';
      parentInfo.storageMode = data.storageMode || '';
      parentInfo.specification = data.specification || '';
      parentInfo.isUse = data.isUse ?? 0;
      parentInfo.locationSortNo = data.locationSortNo || '';
      parentInfo.locationFullpathName = data.locationFullpathName || '';
      parentInfo.occupancyRate = data.occupancyRate ?? 0;
      parentInfo.remarks = data.remarks || '';
    } else {
      parentInfo.locationName = props.parentLocationName;
      parentInfo.warehouseCode = props.parentWarehouseCode;
    }
  } catch {
    parentInfo.locationName = props.parentLocationName;
    parentInfo.warehouseCode = props.parentWarehouseCode;
  }
}

function resetParentInfo() {
  parentInfo.id = null;
  parentInfo.parentId = null;
  parentInfo.locationName = '';
  parentInfo.locationGrade = '';
  parentInfo.locationType = '';
  parentInfo.locationLevel = 1;
  parentInfo.locationLevelCount = 1;
  parentInfo.internalSerialNo = 1;
  parentInfo.internalQuantity = 1;
  parentInfo.warehouseCode = '';
  parentInfo.parentName = '';
  parentInfo.storageMode = '';
  parentInfo.specification = '';
  parentInfo.isUse = 0;
  parentInfo.locationSortNo = '';
  parentInfo.locationFullpathName = '';
  parentInfo.occupancyRate = 0;
  parentInfo.remarks = '';
}

// 添加层级
function addLevel() {
  if (formData.levels.length >= 5) {
    message.warning('最多支持5级分区');
    return;
  }
  const typeOptions = sectionTypeOpts.value;
  const usedTypes = formData.levels.map((l) => l.locationType);
  const nextType = typeOptions.find((t) => !usedTypes.includes(t)) || typeOptions[0] || '层';
  formData.levels.push({
    locationType: nextType,
    quantity: 1,
    startSerialNo: 1,
  });
}

// 删除层级
function removeLevel(idx: number) {
  if (formData.levels.length <= 1) {
    message.warning('至少需要保留一个层级');
    return;
  }
  formData.levels.splice(idx, 1);
}

// 统计信息
const statsMessage = computed(() => {
  let totalPartitions = 1;
  formData.levels.forEach((l) => {
    totalPartitions *= (l.quantity || 1);
  });

  if (!createContainer.value) {
    return `预计创建：${totalPartitions} 个分区（不创建容器）`;
  }

  const containerCount = formData.container.quantity || 0;
  const positionCount = containerCount * (formData.container.childrenQuantity || 0);
  const totalNodes = totalPartitions + totalPartitions * containerCount + totalPartitions * containerCount * (formData.container.childrenQuantity || 0);

  if (totalNodes > 10000) {
    return `⚠️ 预计创建 ${totalPartitions} 个分区、${totalPartitions * containerCount} 个容器、${totalPartitions * positionCount} 个孔位，总计约 ${totalNodes.toLocaleString()} 个节点，数量较大请谨慎操作`;
  }
  return `预计创建：${totalPartitions} 个分区 → ${totalPartitions * containerCount} 个容器 → ${totalPartitions * positionCount} 个孔位，共 ${totalNodes.toLocaleString()} 个节点`;
});

// 预览树数据结构
interface PreviewTreeNode {
  title: string;
  key: string;
  gradeType: string;
  count?: string;
  children?: PreviewTreeNode[];
}

// 生成预览树
// 预览树数据（通过 watch + API 调用更新）
const previewTreeData = ref<PreviewTreeNode[]>([]);

// 刷新预览树
async function handleRefreshPreview() {
  await loadPreviewTree();
}

async function loadPreviewTree() {
  if (!props.parentId || formData.levels.length === 0) {
    previewTreeData.value = [];
    return;
  }

  const root: PreviewTreeNode = {
    title: parentInfo.locationName || props.parentLocationName || '上级库位',
    key: 'parent',
    gradeType: 'parent',
    children: [],
  };

  // 递归生成分区层级
  function buildLevelNodes(
    parentNode: PreviewTreeNode,
    levelIdx: number,
    parentPrefix: string,
  ) {
    if (levelIdx >= formData.levels.length) {
      if (createContainer.value) {
        buildContainerNodes(parentNode, parentPrefix);
      }
      return;
    }

    const config = formData.levels[levelIdx];
    const qty = Math.min(config.quantity || 1, 5);
    const children: PreviewTreeNode[] = [];

    for (let i = 0; i < qty; i++) {
      const serial = (config.startSerialNo || 1) + i;
      const name = `${config.locationType}${serial}`;
      const node: PreviewTreeNode = {
        title: name,
        key: `${parentPrefix}-${levelIdx}-${i}`,
        gradeType: 'section',
        children: [],
      };
      buildLevelNodes(node, levelIdx + 1, `${parentPrefix}-${levelIdx}-${i}`);
      children.push(node);
    }

    if (config.quantity > 5) {
      children.push({
        title: `... 还有 ${config.quantity - 5} 个`,
        key: `${parentPrefix}-more`,
        gradeType: 'more',
      });
    }

    parentNode.children = children;
  }

  // 生成容器节点
  function buildContainerNodes(parentNode: PreviewTreeNode, parentPrefix: string) {
    const containerQty = Math.min(formData.container.quantity || 1, 3);
    const children: PreviewTreeNode[] = [];

    for (let i = 0; i < containerQty; i++) {
      let name: string;
      if (formData.container.locationName) {
        const ruleLabel = serialRuleOptions.value.find(
          (r) => r.value === formData.container.locationName,
        )?.label || formData.container.locationName;
        name = `${ruleLabel}${i + 1}`;
      } else {
        name = `${formData.container.locationType || '容器'}${i + 1}`;
      }
      const node: PreviewTreeNode = {
        title: name,
        key: `${parentPrefix}-c-${i}`,
        gradeType: 'container',
        children: [],
      };
      buildPositionNodes(node, parentPrefix, i);
      children.push(node);
    }

    if ((formData.container.quantity || 1) > 3) {
      children.push({
        title: `... 还有 ${(formData.container.quantity || 1) - 3} 个容器`,
        key: `${parentPrefix}-c-more`,
        gradeType: 'more',
      });
    }

    parentNode.children = children;
  }

  // 生成孔位节点
  function buildPositionNodes(parentNode: PreviewTreeNode, parentPrefix: string, idx: number) {
    const childrenQty = formData.container.childrenQuantity || 0;
    if (childrenQty <= 0) return;

    const spec = formData.container.specification || '8x12';
    let cols = 12;
    const match = spec.match(/(\d+)x(\d+)/);
    if (match) {
      cols = parseInt(match[2], 10);
    }

    const previewQty = Math.min(childrenQty, 6);
    const children: PreviewTreeNode[] = [];

    for (let i = 0; i < previewQty; i++) {
      const rowIdx = Math.floor(i / cols);
      const colIdx = i % cols;
      const rowChar = String.fromCharCode(65 + rowIdx);
      const colStr = String(colIdx + 1).padStart(2, '0');
      const name = `${rowChar}${colStr}`;

      children.push({
        title: name,
        key: `${parentPrefix}-c-${idx}-p-${i}`,
        gradeType: 'position',
      });
    }

    if (childrenQty > 6) {
      children.push({
        title: `... 还有 ${childrenQty - 6} 个孔位`,
        key: `${parentPrefix}-c-${idx}-p-more`,
        gradeType: 'more',
      });
    }

    parentNode.children = children;
  }

  buildLevelNodes(root, 0, 'root');
  previewTreeData.value = [root];
}

async function handleSubmit() {
  if (!props.parentId) {
    message.warning('请先选择一个上级库位');
    return;
  }

  // 校验
  for (let i = 0; i < formData.levels.length; i++) {
    const level = formData.levels[i];
    if (!level.locationType) {
      message.warning(`第 ${i + 1} 层分区类型不能为空`);
      return;
    }
    if (!level.quantity || level.quantity < 1) {
      message.warning(`第 ${i + 1} 层数量必须大于0`);
      return;
    }
  }

  if (createContainer.value) {
    if (!formData.container.locationType) {
      message.warning('容器类型不能为空');
      return;
    }
    if (!formData.container.quantity || formData.container.quantity < 1) {
      message.warning('容器数量必须大于0');
      return;
    }
  }

  try {
    loading.value = true;

    const payload: any = {
      parentId: props.parentId,
      warehouseCode: props.parentWarehouseCode || parentInfo.warehouseCode || '',
      levels: formData.levels.map((l) => ({
        locationType: l.locationType,
        quantity: l.quantity,
        startSerialNo: l.startSerialNo || 1,
      })),
    };

    if (createContainer.value) {
      payload.container = {
        locationType: formData.container.locationType,
        quantity: formData.container.quantity,
        specification: formData.container.specification,
        childrenQuantity: formData.container.childrenQuantity,
        childrenType: formData.container.childrenType || '孔',
        locationName: formData.container.locationName,
      };
    }

    await batchCreateHierarchy(payload);
    visible.value = false;
    emit('success');
    message.success('新建存储分区成功');
  } catch (e: any) {
    message.error(e?.message || '新建失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}

// 弹窗打开时重置
watch(visible, (val) => {
  if (val) {
    resetParentInfo();
    loadParentInfo();
    loadSectionDict();
    loadContainerDict();
    loadSerialRules();
    // 重置表单
    const defaultSectionType = sectionTypeOpts.value[0] || '层';
    formData.levels = [{ locationType: defaultSectionType, quantity: 1, startSerialNo: 1 }];
    formData.container = {
      locationType: '',
      quantity: 1,
      specification: '',
      childrenQuantity: 0,
      childrenType: '孔',
      locationName: '',
    };
    // 规格由字典自动解析，无需重置
    createContainer.value = false;
    currentSerialPreview.value = '';
  }
});

// 弹窗打开时加载预览树（不支持自动刷新，需手动点击刷新按钮）
watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadPreviewTree();
    }
  },
);

// 监听容器名称和创建容器状态变化，获取当前流水号预览
watch(
  () => [createContainer.value, formData.container.locationName],
  async ([isCreate, locationName]) => {
    if (isCreate && locationName) {
      await loadCurrentSerialPreview();
    } else {
      currentSerialPreview.value = '';
    }
  },
);
</script>

<style scoped lang="less">
.modal-body {
  min-height: 480px;
  max-height: 640px;
}

.left-panel {
  border-right: 1px solid #f0f0f0;
  padding-right: 16px;

  .panel-content {
    padding: 0 16px;
    max-height: 600px;
    overflow-y: auto;
  }
}

.right-panel {
  padding-left: 16px;

  .preview-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;

    .preview-title {
      font-weight: 600;
      font-size: 14px;
      color: #262626;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .preview-content {
      flex: 1;
      overflow-y: auto;
      background: #fafafa;
      border-radius: 6px;
      padding: 12px;
      min-height: 400px;
    }
  }

  .preview-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    .refresh-btn {
      padding: 4px;
      color: #595959;

      &:hover {
        color: #1890ff;
      }
    }
  }
}

.section-card {
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;

  &.disabled {
    opacity: 0.55;
    background: #f5f5f5;

    :deep(.ant-select-disabled),
    :deep(.ant-input-number-disabled) {
      background-color: #f5f5f5;
    }
  }

  .section-title {
    font-weight: 600;
    font-size: 14px;
    color: #262626;
    margin-bottom: 12px;
    display: flex;
    align-items: center;

    .section-subtitle {
      font-weight: 400;
      font-size: 12px;
      color: #8c8c8c;
      margin-left: 8px;
    }
  }
}

.parent-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  .info-row {
    display: flex;
    align-items: center;
    font-size: 13px;

    .info-label {
      color: #8c8c8c;
      margin-right: 4px;
    }

    .info-value {
      color: #262626;
      font-weight: 500;
    }
  }
}

.parent-info-full {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;

  .info-row {
    display: flex;
    align-items: center;
    font-size: 13px;
    overflow: hidden;

    .info-label {
      color: #8c8c8c;
      margin-right: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .info-value {
      color: #262626;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .info-row-wide {
    grid-column: span 3;

    .info-value {
      white-space: normal;
      word-break: break-all;
    }
  }
}

.level-header {
  display: flex;
  padding: 0 4px 8px;
  font-size: 12px;
  color: #8c8c8c;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;

  .level-header-item {
    text-align: center;
  }
}

.level-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;

  .level-badge {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #e6f7ff;
    color: #1890ff;
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .del-btn {
    padding: 0 4px;
    min-width: 24px;
  }
}

.add-level-btn {
  margin-top: 4px;
}

.form-item {
  .form-label {
    display: block;
    font-size: 12px;
    color: #595959;
    margin-bottom: 4px;
  }
}

.mt-2 {
  margin-top: 8px;
}

.stats-alert {
  margin-top: 4px;
}

.serial-preview {
  font-size: 13px;
  margin-top: 4px;
  line-height: 1.6;
  text-align: right;

  .preview-label {
    color: #262626;
  }

  .preview-value {
    color: #1890ff;
    font-size: 15px;
    font-weight: 600;
  }
}

.preview-tree {
  background: transparent;

  :deep(.ant-tree-treenode) {
    padding: 2px 0;
  }
}

.tree-node {
  font-size: 13px;

  &.node-grade-parent {
    color: #1890ff;
    font-weight: 600;
  }

  &.node-grade-section {
    color: #722ed1;
  }

  &.node-grade-container {
    color: #fa8c16;
  }

  &.node-grade-position {
    color: #52c41a;
    font-size: 12px;
  }

  &.node-grade-more {
    color: #8c8c8c;
    font-style: italic;
  }

  .node-count {
    margin-left: 4px;
    font-size: 11px;
    line-height: 16px;
    padding: 0 4px;
  }
}

.mr-1 {
  margin-right: 4px;
}
</style>
