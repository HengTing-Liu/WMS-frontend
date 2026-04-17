<template>
  <Modal
    v-model:open="visible"
    title="新建存储分区"
    :confirm-loading="loading"
    width="560px"
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
        <Input :value="parentLocationName" disabled placeholder="请先在树中选择上级库位" />
      </FormItem>

      <FormItem label="库位类型" name="locationType">
        <Select v-model:value="formData.locationType" placeholder="请选择库位类型">
          <SelectOption value="层">层</SelectOption>
          <SelectOption value="架">架</SelectOption>
          <SelectOption value="行">行</SelectOption>
          <SelectOption value="列">列</SelectOption>
          <SelectOption value="格">格</SelectOption>
        </Select>
      </FormItem>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="数量" name="quantity">
            <InputNumber
              v-model:value="formData.quantity"
              :min="1"
              :max="100"
              style="width: 100%"
              placeholder="默认为1"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="起始编号" name="startSerial">
            <InputNumber
              v-model:value="formData.startSerial"
              :min="1"
              :max="9999"
              style="width: 100%"
              placeholder="默认为1"
            />
          </FormItem>
        </Col>
      </Row>

      <FormItem label="编号规则" name="codeRule">
        <Select v-model:value="formData.codeRule" placeholder="请选择编号规则">
          <SelectOption value="SEQUENCE">顺序编号（层1/3、层2/3、层3/3）</SelectOption>
          <SelectOption value="PREFIX_SEQ">前缀+序号（如 A-001）</SelectOption>
        </Select>
      </FormItem>

      <FormItem label="名称前缀（可选）">
        <Input v-model:value="formData.prefix" placeholder="如不填则使用库位类型作为前缀" :maxlength="50" />
      </FormItem>

      <Alert
        v-if="formData.quantity > 1"
        :message="`将创建 ${formData.quantity} 个存储分区：` + previewNames"
        type="info"
        show-icon
        class="mb-4"
      />
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import {
  Alert,
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

import { batchCreate } from '#/api/wms/location';

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

const formData = reactive({
  locationType: '',
  quantity: 1,
  startSerial: 1,
  codeRule: 'SEQUENCE',
  prefix: '',
});

const formRules = {
  locationType: [{ required: true, message: '请选择库位类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  startSerial: [{ required: true, message: '请输入起始编号', trigger: 'blur' }],
  codeRule: [{ required: true, message: '请选择编号规则', trigger: 'change' }],
};

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

// 预览生成的名称
const previewNames = computed(() => {
  if (formData.quantity <= 0) return '';
  const prefix = formData.prefix || formData.locationType || '';
  const names: string[] = [];
  for (let i = 0; i < Math.min(formData.quantity, 10); i++) {
    const num = (formData.startSerial || 1) + i;
    if (formData.codeRule === 'SEQUENCE') {
      names.push(`${prefix}${num}/${formData.quantity}`);
    } else {
      names.push(`${prefix}-${String(num).padStart(3, '0')}`);
    }
  }
  let result = names.join('、');
  if (formData.quantity > 10) {
    result += `...（共${formData.quantity}个）`;
  }
  return result;
});

async function handleSubmit() {
  if (!props.parentId) {
    message.warning('请先选择一个上级库位');
    return;
  }

  try {
    await formRef.value?.validate();
    loading.value = true;

    const prefix = formData.prefix || formData.locationType || '';

    const payload = {
      parentId: props.parentId,
      warehouseCode: props.parentWarehouseCode,
      locationType: formData.locationType,
      quantity: formData.quantity,
      startSerialNo: formData.startSerial,
      codeRule: formData.codeRule,
      locationNamePrefix: prefix,
    };

    await batchCreate(payload);
    message.success(`新建 ${formData.quantity} 个存储分区成功`);
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
      quantity: 1,
      startSerial: 1,
      codeRule: 'SEQUENCE',
      prefix: '',
    });
  }
});
</script>