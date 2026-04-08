<template>
  <Modal
    :title="isEdit ? '编辑仓位' : '新增仓位'"
    v-model:open="open"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="640px"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 18 }"
    >
      <Form.Item label="仓库" name="warehouseId">
        <Select v-model:value="formData.warehouseId" placeholder="请选择仓库" :disabled="isEdit">
          <Select.Option v-for="w in warehouseOptions" :key="w.value" :value="w.value">
            {{ w.label }}
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="库区" name="locationId">
        <Select v-model:value="formData.locationId" placeholder="请选择库区">
          <Select.Option v-for="l in locationOptions" :key="l.value" :value="l.value">
            {{ l.label }}
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="仓位编码" name="storageCode">
        <Input v-model:value="formData.storageCode" placeholder="请输入仓位编码" />
      </Form.Item>
      <Form.Item label="仓位名称" name="storageName">
        <Input v-model:value="formData.storageName" placeholder="请输入仓位名称" />
      </Form.Item>
      <Form.Item label="状态" name="status">
        <Select v-model:value="formData.status" placeholder="请选择状态">
          <Select.Option :value="0">禁用</Select.Option>
          <Select.Option :value="1">启用</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="备注" name="remark">
        <Textarea v-model:value="formData.remark" placeholder="请输入备注" :rows="3" />
      </Form.Item>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form, Input, Select, Textarea, message } from 'ant-design-vue';
import { addStorage as createStorage, updateStorage } from '#/api/wms/storage';

interface Props {
  storageId?: number;
  warehouseOptions: Array<{ label: string; value: number }>;
  locationOptions: Array<{ label: string; value: number }>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'success'): void;
}>();

const open = computed({
  get: () => false,
  set: (val) => emit('update:open', val),
});

const loading = ref(false);
const isEdit = computed(() => !!props.storageId);

const formData = ref({
  warehouseId: undefined as number | undefined,
  locationId: undefined as number | undefined,
  storageCode: '',
  storageName: '',
  status: 1,
  remark: '',
});

const rules = {};

const handleSubmit = async () => {
  loading.value = true;
  try {
    if (isEdit.value) {
      await updateStorage({ storageId: props.storageId, ...formData.value });
      message.success('编辑成功');
    } else {
      await createStorage(formData.value);
      message.success('新增成功');
    }
    emit('success');
  } catch {
    message.error('操作失败');
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit('update:open', false);
};
</script>