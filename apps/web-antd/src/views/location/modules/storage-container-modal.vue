<template>
  <Modal
    v-model:open="visible"
    title="新建存储容器"
    :confirm-loading="loading"
    width="1100px"
    :body-style="{ padding: '16px 0 0 0' }"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Row :gutter="0" class="modal-body">
      <!-- 左侧配置面板 -->
      <Col :span="15" class="left-panel">
        <div class="panel-content">
          <!-- 上级库位信息卡片 -->
          <div class="section-card">
            <div class="section-title">
              <IconifyIcon icon="material-symbols:account-tree" class="mr-1" />
              上级库位信息
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

          <!-- 容器配置 -->
          <div class="section-card">
            <div class="section-title">
              <IconifyIcon icon="material-symbols:box" class="mr-1" />
              容器配置
            </div>

            <Form layout="horizontal" :label-col="{ span: 10 }" :wrapper-col="{ span: 16 }">
              <Row :gutter="12">
                <Col :span="8">
                  <FormItem label="容器类型" name="locationType">
                    <Select v-model:value="formData.locationType" placeholder="请选择容器类型" @change="handleContainerTypeChange">
                      <SelectOption v-for="t in containerTypeOpts" :key="t" :value="t">{{ t }}</SelectOption>
                    </Select>
                  </FormItem>
                </Col>
                <Col :span="8">
                  <FormItem label="数量" name="quantity">
                    <InputNumber
                      v-model:value="formData.quantity"
                      :min="1"
                      :max="100"
                      style="width: 100%"
                      placeholder="默认1"
                    />
                  </FormItem>
                </Col>
                <Col :span="8">
                  <FormItem label="起始编号" name="startSerial">
                    <InputNumber
                      v-model:value="formData.startSerial"
                      :min="1"
                      :max="9999"
                      style="width: 50%"
                      placeholder="默认1"
                    />
                  </FormItem>
                </Col>
              </Row>

              <Row :gutter="12">
                <Col :span="8">
                  <FormItem label="存储模式" name="storageMode">
                    <Select v-model:value="formData.storageMode" disabled>
                      <SelectOption value="Exclusive">独占模式</SelectOption>
                      <SelectOption value="Shared">共享模式</SelectOption>
                    </Select>
                  </FormItem>
                </Col>
                <Col :span="8">
                  <FormItem label="规格" name="specification">
                    <Input :value="selectedContainerSpec.spec || '-'" disabled />
                  </FormItem>
                </Col>                
              </Row>

              <FormItem label="容器名称" name="locationName">
                <Select
                  v-model:value="formData.locationName"
                  placeholder="请选择流水号规则"
                  :loading="serialRuleLoading"
                  :options="serialRuleOptions"
                  style="width: 100%"
                />
              </FormItem>
              <div
                v-if="formData.locationName && currentSerialPreview"
                class="serial-preview"
              >
                <span class="preview-label">当前容器名称起始数据为 </span>
                <span class="preview-value">{{ currentSerialPreview }}</span>
                <span class="preview-label">，仅供参考，保存时自动生成。</span>
              </div>
            </Form>
          </div>
        </div>
      </Col>

      <!-- 右侧预览面板 -->
      <Col :span="9" class="right-panel">
        <div class="preview-wrapper">
          <div class="preview-title">
            <IconifyIcon icon="material-symbols:preview" class="mr-1" />
            结构预览
            <div class="preview-actions">
              <Button type="text" size="small" class="refresh-btn" @click="loadPreviewTree">
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
  Button,
  Col,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  Row,
  Select,
  SelectOption,
  Tag,
  Tree,
  Modal,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';
import { IconifyIcon } from '@vben/icons';

import { batchCreate, getDetail } from '#/api/wms/location';
import { getDictDataByType } from '#/api/system/dict';
import { getSerialNumberList } from '#/api/system/serial-number';

interface ContainerInfo {
  id?: number;
  locationName: string;
  locationSortNo?: string;
}

interface PositionInfo {
  id?: number;
  parentId?: number;
  locationName: string;
}

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
const formRef = ref<FormInstance>();

// 上级库位详细信息
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

function formatIsUse(use: number) {
  return use === 1 ? '占用' : '空闲';
}

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
  const label = formData.locationType;
  if (!label || !dictOptions.value[label]) return { spec: '', childrenQuantity: 0 };
  return dictOptions.value[label];
});

function handleContainerTypeChange() {
  const label = formData.locationType;
  const opt = dictOptions.value[label];
  if (opt) {
    formData.specification = opt.spec;
    formData.childrenQuantity = opt.childrenQuantity;
    // 规格为1x1时自动共享模式，其他规格自动独占模式
    formData.storageMode = opt.spec === '1x1' ? 'Shared' : 'Exclusive';
  } else {
    formData.specification = '';
    formData.childrenQuantity = 0;
  }
}

// 流水号规则选项（apply_form_field = inv_location|location_name）
const serialRuleLoading = ref(false);
const serialRuleOptions = ref<Array<{ label: string; value: string }>>([]);

// 当前流水号预览值
const currentSerialPreview = ref('');

// 获取当前流水号预览（只是查看，不占用）
async function loadCurrentSerialPreview() {
  if (!formData.locationName) {
    currentSerialPreview.value = '';
    return;
  }
  try {
    const res = await getSerialNumberList({ applyFormField: 'inv_location|location_name', pageSize: 999 });
    const rows = res.rows || [];
    const rule = rows.find((r: any) => (r.ruleName || r.name) === formData.locationName);
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

async function loadContainerDict() {
  try {
    const res = await getDictDataByType('location_type_for_container');
    const list = Array.isArray(res) ? res : (res?.data || []);
    if (list.length > 0) {
      const options: Record<string, { spec: string; childrenQuantity: number }> = {};
      list.forEach((item: any) => {
        const dictValue = item.dictValue || item.dict_value || item.value || '';
        const displayLabel = item.dictLabel || item.dict_label || item.label || item.text || '';
        const parts = dictValue.split('_');
        if (parts.length >= 2) {
          const spec = parts[1];
          const numMatch = (parts[0] || '').match(/^(\d+)/);
          const childrenQuantity = numMatch ? parseInt(numMatch[1], 10) : 0;
          const key = displayLabel || parts[0];
          options[key] = { spec, childrenQuantity };
        }
      });
      dictOptions.value = options;
      dictLoaded.value = Object.keys(options).length > 0;
    }
  } catch (e: any) {
    console.warn('[字典加载失败]', e?.message || e);
  }
}

// 预览树数据结构
interface PreviewTreeNode {
  title: string;
  key: string;
  gradeType: string;
  count?: string;
  children?: PreviewTreeNode[];
}

// 生成孔位子节点
function buildPositionNodes(spec: string, containerIdx: number) {
  const [rows, cols] = spec.split('x').map(Number);
  const previewQty = Math.min(rows * cols, 6);
  const positionNodes: PreviewTreeNode[] = [];

  for (let p = 0; p < previewQty; p++) {
    const rowIdx = Math.floor(p / cols);
    const colIdx = p % cols;
    const rowChar = String.fromCharCode(65 + rowIdx);
    const colStr = String(colIdx + 1).padStart(2, '0');
    positionNodes.push({
      title: `${rowChar}${colStr}`,
      key: `container-${containerIdx}-pos-${p}`,
      gradeType: 'position',
    });
  }

  if (rows * cols > 6) {
    positionNodes.push({
      title: `... 还有 ${rows * cols - 6} 个孔位`,
      key: `container-${containerIdx}-pos-more`,
      gradeType: 'more',
    });
  }

  return positionNodes;
}

// 构建预览树（传入容器名称数组）
function buildPreviewTree(containerNames: string[]): PreviewTreeNode[] {
  const containerNodes: PreviewTreeNode[] = [];

  for (let i = 0; i < containerNames.length; i++) {
    const containerNode: PreviewTreeNode = {
      title: containerNames[i],
      key: `container-${i}`,
      gradeType: 'container',
      children: [],
    };

    if (formData.storageMode === 'Exclusive' && formData.specification) {
      containerNode.children = buildPositionNodes(formData.specification, i);
      const [rows, cols] = formData.specification.split('x').map(Number);
      containerNode.count = `${rows * cols}孔`;
    }

    containerNodes.push(containerNode);
  }

  if ((formData.quantity || 1) > 10) {
    containerNodes.push({
      title: `... 还有 ${(formData.quantity || 1) - 10} 个容器`,
      key: 'container-more',
      gradeType: 'more',
    });
  }

  // 根节点 = 上级库位（存储分区）
  const root: PreviewTreeNode = {
    title: parentInfo.locationName || props.parentLocationName || '上级库位',
    key: 'parent',
    gradeType: 'parent',
    children: containerNodes.length > 0 ? containerNodes : undefined,
  };

  return [root];
}

// 预览树数据（通过 watch + API 调用更新）
const previewTreeData = ref<PreviewTreeNode[]>([]);

// 加载预览树
async function loadPreviewTree() {
  if (!props.parentId) {
    previewTreeData.value = [];
    return;
  }

  // 只有选择了容器类型后才生成容器节点
  if (!formData.locationType) {
    // 只显示根节点
    previewTreeData.value = [
      {
        title: parentInfo.locationName || props.parentLocationName || '上级库位',
        key: 'parent',
        gradeType: 'parent',
        children: undefined,
      },
    ];
    return;
  }

  const qty = Math.min(formData.quantity || 1, 10);
  const containerNames: string[] = [];

  // 用规则 label 拼接预览名称（不消耗真实流水号）
  const ruleLabel = serialRuleOptions.value.find((r) => r.value === formData.locationName)?.label || formData.locationName || formData.locationType || '';
  for (let i = 0; i < qty; i++) {
    const num = (formData.startSerial || 1) + i;
    containerNames.push(`${ruleLabel}${num}`);
  }

  previewTreeData.value = buildPreviewTree(containerNames);
}

const formData = reactive({
  locationType: '',
  storageMode: 'Exclusive',
  quantity: 1,
  startSerial: 1,
  specification: '',
  childrenQuantity: 0,
  locationName: '',
});

const formRules = computed(() => ({
  locationType: [{ required: true, message: '请选择容器类型', trigger: 'change' }],
  storageMode: [{ required: true, message: '请选择存储模式', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  startSerial: [{ required: true, message: '请输入起始编号', trigger: 'blur' }],
}));

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

// 提交
async function handleSubmit() {
  if (!props.parentId) {
    message.warning('请先选择一个上级库位');
    return;
  }

  try {
    await formRef.value?.validate();
    loading.value = true;

    const payload: any = {
      parentId: props.parentId,
      warehouseCode: props.parentWarehouseCode,
      locationGrade: '存储容器',
      locationType: formData.locationType,
      quantity: formData.quantity,
      startSerialNo: formData.startSerial,
      storageMode: formData.storageMode,
      locationName: formData.locationName,
    };

    // 独占模式设置规格并自动生成孔位
    if (formData.storageMode === 'Exclusive' && formData.specification) {
      payload.specification = formData.specification;
      payload.createChildren = true;
      payload.childrenQuantity = formData.childrenQuantity;
      payload.childrenType = '孔';
      payload.childrenLocationGrade = '存储孔位';
    }

    await batchCreate(payload);
    visible.value = false;
    emit('success');
  } catch (e: any) {
    message.error(e?.message || '新建失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}

// 重置表单
watch(visible, (val) => {
  if (val) {
    resetParentInfo();
    loadParentInfo();
    loadContainerDict();
    loadSerialRules();
    currentSerialPreview.value = '';
    formRef.value?.resetFields();
    Object.assign(formData, {
      locationType: '',
      storageMode: 'Exclusive',
      quantity: 1,
      startSerial: 1,
      specification: '',
      childrenQuantity: 0,
      locationName: '',
    });
  }
});

// 监听容器名称变化，获取当前流水号预览
watch(
  () => formData.locationName,
  async (locationName) => {
    if (locationName) {
      await loadCurrentSerialPreview();
    } else {
      currentSerialPreview.value = '';
    }
  },
);

// 弹窗打开时加载预览树（不支持自动刷新，需手动点击刷新按钮）
watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadPreviewTree();
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

      .preview-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .refresh-btn {
        padding: 4px;
        color: #595959;

        &:hover {
          color: #1890ff;
        }
      }
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
}

.section-card {
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;

  .section-title {
    font-weight: 600;
    font-size: 14px;
    color: #262626;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
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

  &.node-grade-container {
    color: #fa8c16;
    font-weight: 600;
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