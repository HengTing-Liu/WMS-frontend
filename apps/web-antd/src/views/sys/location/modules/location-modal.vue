<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Modal, Form, Input, Select, Switch, message } from 'ant-design-vue';
import { createLocation, updateLocation, type LocationResult } from '#/api/sys/location';

const props = defineProps<{
  visible: boolean;
  mode: 'add' | 'edit';
  record: LocationResult | null;
  warehouseOptions: Array<{ label: string; value: number }>;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'success': [];
}>();

const loading = ref(false);
const formRef = ref();
const formState = ref({
  locationCode: '',
  locationName: '',
  warehouseId: undefined as number | undefined,
  locationType: undefined as string | undefined,
  isEnabled: 1,
  remark: '',
});

const locationTypeOptions = [
  { label: '存储区', value: 'STORAGE' },
  { label: '拣货区', value: 'PICK' },
  { label: '集货区', value: 'COLLECT' },
  { label: '退货区', value: 'RETURN' },
];

const title = computed(() => (props.mode === 'add' ? '新建库区' : '编辑库区'));

const rules = {
  locationCode: [{ required: true, message: '请输入库区编码', trigger: 'blur' }],
  locationName: [{ required: true, message: '请输入库区名称', trigger: 'blur' }],
  warehouseId: [{ required: true, message: '请选择所属仓库', trigger: 'change' }],
  locationType: [{ required: true, message: '请选择库区类型', trigger: 'change' }],
};

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.mode === 'edit' && props.record) {
        formState.value = {
          locationCode: props.record.locationCode || '',
          locationName: props.record.locationName || '',
          warehouseId: props.record.warehouseId,
          locationType: props.record.locationType,
          isEnabled: props.record.isEnabled ?? 1,
          remark: props.record.remark || '',
        };
      } else {
        formState.value = {
          locationCode: '',
          locationName: '',
          warehouseId: undefined,
          locationType: undefined,
          isEnabled: 1,
          remark: '',
        };
      }
    }
  }
);

function handleClose() {
  emit('update:visible', false);
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const data = { ...formState.value };
    if (props.mode === 'add') {
      await createLocation(data);
      message.success('新建成功');
    } else {
      await updateLocation({ id: props.record!.id, ...data });
      message.success('编辑成功');
    }
    emit('success');
    handleClose();
  } catch (error: any) {
    message.error(error?.message || (props.mode === 'add' ? '新建失败' : '编辑失败'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    :open="visible"
    :title="title"
    :confirm-loading="loading"
    width="560px"
    ok-text="确定"
    cancel-text="取消"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <Form
      ref="formRef"
      :model="formState"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <Form.Item label="库区编码" name="locationCode">
        <Input v-model:value="formState.locationCode" placeholder="请输入库区编码" :disabled="mode === 'edit'" />
      </Form.Item>
      <Form.Item label="库区名称" name="locationName">
        <Input v-model:value="formState.locationName" placeholder="请输入库区名称" />
      </Form.Item>
      <Form.Item label="所属仓库" name="warehouseId">
        <Select
          v-model:value="formState.warehouseId"
          placeholder="请选择所属仓库"
          :options="warehouseOptions"
          allow-clear
        />
      </Form.Item>
      <Form.Item label="库区类型" name="locationType">
        <Select
          v-model:value="formState.locationType"
          placeholder="请选择库区类型"
          :options="locationTypeOptions"
          allow-clear
        />
      </Form.Item>
      <Form.Item v-if="mode === 'edit'" label="状态" name="isEnabled">
        <Switch
          v-model:checked="formState.isEnabled"
          checked-children="启用"
          un-checked-children="停用"
          :checked-value="1"
          :unchecked-value="0"
        />
      </Form.Item>
      <Form.Item label="备注" name="remark">
        <Input.TextArea v-model:value="formState.remark" placeholder="请输入备注" :rows="3" />
      </Form.Item>
    </Form>
  </Modal>
</template>
