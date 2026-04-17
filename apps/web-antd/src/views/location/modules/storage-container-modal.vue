<template>
  <Modal
    v-model:open="visible"
    title="新建存储容器"
    :confirm-loading="loading"
    width="600px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      layout="vertical"
    >
      <FormItem label="上级库位">
        <Input :value="parentLocationName" disabled placeholder="请先选择上级库位" />
      </FormItem>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="容器类型" name="locationType">
            <Select v-model:value="formData.locationType" placeholder="请选择容器类型">
              <SelectOption value="盒">盒</SelectOption>
              <SelectOption value="箱">箱</SelectOption>
              <SelectOption value="笼">笼</SelectOption>
              <SelectOption value="抽屉">抽屉</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="存储模式" name="storageMode">
            <Select v-model:value="formData.storageMode" placeholder="请选择存储模式">
              <SelectOption value="Exclusive">独占模式</SelectOption>
              <SelectOption value="Shared">共享模式</SelectOption>
            </Select>
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
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
              style="width: 100%"
              placeholder="默认1"
            />
          </FormItem>
        </Col>
        <Col :span="8">
          <FormItem label="编号规则" name="codeRule">
            <Select v-model:value="formData.codeRule" placeholder="规则">
              <SelectOption value="SEQUENCE">顺序编号</SelectOption>
              <SelectOption value="PREFIX_SEQ">前缀+序号</SelectOption>
            </Select>
          </FormItem>
        </Col>
      </Row>

      <FormItem
        v-if="formData.storageMode === 'Exclusive'"
        label="规格（独占模式）"
        name="specification"
        :required="formData.storageMode === 'Exclusive'"
      >
        <Select v-model:value="formData.specification" placeholder="请选择规格">
          <SelectOption value="2x2">2×2（4孔）</SelectOption>
          <SelectOption value="4x4">4×4（16孔）</SelectOption>
          <SelectOption value="6x6">6×6（36孔）</SelectOption>
          <SelectOption value="8x12">8×12（96孔）</SelectOption>
          <SelectOption value="9x9">9×9（81孔）</SelectOption>
        </Select>
      </FormItem>

      <FormItem v-if="formData.storageMode === 'Shared'" label="规格">
        <Input value="1×1（共享模式，无需孔位）" disabled />
      </FormItem>

      <FormItem label="名称前缀（可选）">
        <Input v-model:value="formData.prefix" placeholder="如不填则使用容器类型作为前缀" :maxlength="50" />
      </FormItem>

      <!-- 预览按钮 -->
      <FormItem>
        <Button type="dashed" block @click="handlePreview" :disabled="!canPreview">
          <IconifyIcon icon="material-symbols:preview" class="mr-1" />
          预览容器及孔位
        </Button>
      </FormItem>
    </Form>
  </Modal>

  <!-- 预览弹窗 -->
  <ContainerPreviewModal
    v-model:visible="showPreviewModal"
    :containers="previewContainers"
    :positions="previewPositions"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import {
  Button,
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  Row,
  Select,
  SelectOption,
  Modal,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';
import { IconifyIcon } from '@vben/icons';

import { batchCreate } from '#/api/wms/location';
import ContainerPreviewModal from './container-preview-modal.vue';

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
const showPreviewModal = ref(false);

// 预览数据
const previewContainers = ref<ContainerInfo[]>([]);
const previewPositions = ref<PositionInfo[]>([]);

const formData = reactive({
  locationType: '',
  storageMode: 'Exclusive',
  quantity: 1,
  startSerial: 1,
  codeRule: 'SEQUENCE',
  specification: '4x4',
  prefix: '',
});

const formRules = computed(() => ({
  locationType: [{ required: true, message: '请选择容器类型', trigger: 'change' }],
  storageMode: [{ required: true, message: '请选择存储模式', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  startSerial: [{ required: true, message: '请输入起始编号', trigger: 'blur' }],
  codeRule: [{ required: true, message: '请选择编号规则', trigger: 'change' }],
  specification: formData.storageMode === 'Exclusive'
    ? [{ required: true, message: '独占模式必须选择规格', trigger: 'change' }]
    : [],
}));

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

const canPreview = computed(() => {
  return props.parentId && formData.locationType && formData.quantity > 0;
});

// 生成预览数据
function generatePreview(): { containers: ContainerInfo[]; positions: PositionInfo[] } {
  const containers: ContainerInfo[] = [];
  const positions: PositionInfo[] = [];
  const prefix = formData.prefix || formData.locationType || '';
  const serialLen = formData.codeRule === 'PREFIX_SEQ' ? 3 : 0;

  for (let i = 0; i < Math.min(formData.quantity, 10); i++) {
    const num = (formData.startSerial || 1) + i;
    let name = '';
    if (formData.codeRule === 'SEQUENCE') {
      name = serialLen > 0
        ? `${prefix}-${String(num).padStart(serialLen, '0')}`
        : `${prefix}${num}`;
    } else {
      name = `${prefix}-${String(num).padStart(3, '0')}`;
    }

    const containerId = 100 + i; // 临时ID
    containers.push({ locationName: name, locationSortNo: `TMP${containerId}` });

    // 独占模式生成孔位
    if (formData.storageMode === 'Exclusive') {
      const [rows, cols] = (formData.specification || '4x4').split('x').map(Number);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const rowLabel = String.fromCharCode(65 + r); // A, B, C...
          const colNum = String(c + 1).padStart(2, '0');
          positions.push({
            parentId: containerId,
            locationName: `${rowLabel}${colNum}`,
          });
        }
      }
    }
  }

  return { containers, positions };
}

// 预览
async function handlePreview() {
  if (!canPreview.value) {
    message.warning('请填写完整信息后再预览');
    return;
  }

  try {
    await formRef.value?.validate();

    // 前端模拟预览（实际也可调用后端预览接口）
    const preview = generatePreview();
    previewContainers.value = preview.containers;
    previewPositions.value = preview.positions;
    showPreviewModal.value = true;
  } catch (e) {
    message.warning('请先填写必填信息');
  }
}

// 提交
async function handleSubmit() {
  if (!props.parentId) {
    message.warning('请先选择一个上级库位');
    return;
  }

  try {
    await formRef.value?.validate();
    loading.value = true;

    const prefix = formData.prefix || formData.locationType || '';

    const payload: any = {
      parentId: props.parentId,
      warehouseCode: props.parentWarehouseCode,
      locationType: formData.locationType,
      locationGrade: 'Container',
      quantity: formData.quantity,
      startSerialNo: formData.startSerial,
      codeRule: formData.codeRule,
      locationNamePrefix: prefix,
      storageMode: formData.storageMode,
    };

    // 独占模式设置规格并自动生成孔位
    if (formData.storageMode === 'Exclusive' && formData.specification) {
      payload.specification = formData.specification;
      payload.createChildren = true;
      payload.childrenQuantity = formData.specification.includes('x')
        ? parseInt(formData.specification.split('x')[0]) * parseInt(formData.specification.split('x')[1])
        : 1;
      payload.childrenType = '孔';
    }

    await batchCreate(payload);
    message.success(`新建 ${formData.quantity} 个存储容器成功`);
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
    formRef.value?.resetFields();
    Object.assign(formData, {
      locationType: '',
      storageMode: 'Exclusive',
      quantity: 1,
      startSerial: 1,
      codeRule: 'SEQUENCE',
      specification: '4x4',
      prefix: '',
    });
    previewContainers.value = [];
    previewPositions.value = [];
  }
});
</script>