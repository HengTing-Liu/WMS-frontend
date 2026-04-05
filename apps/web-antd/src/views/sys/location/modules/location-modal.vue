<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Modal, Form, Input, Select, Switch, message } from 'ant-design-vue';
import { createLocation, updateLocation, type LocationResult } from '#/api/sys/location';
import { $t } from '@vben/locales';

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
  { label: $t('page.wms.location.locationType.STORAGE'), value: 'STORAGE' },
  { label: $t('page.wms.location.locationType.PICK'), value: 'PICK' },
  { label: $t('page.wms.location.locationType.COLLECT'), value: 'COLLECT' },
  { label: $t('page.wms.location.locationType.RETURN'), value: 'RETURN' },
];

const title = computed(() => (props.mode === 'add' ? $t('page.wms.location.addTitle') : $t('page.wms.location.editTitle')));

const rules = {
  locationCode: [{ required: true, message: $t('page.wms.location.locationCodeRequired'), trigger: 'blur' }],
  locationName: [{ required: true, message: $t('page.wms.location.locationNameRequired'), trigger: 'blur' }],
  warehouseId: [{ required: true, message: $t('page.wms.location.warehouseIdRequired'), trigger: 'change' }],
  locationType: [{ required: true, message: $t('page.wms.location.locationTypeRequired'), trigger: 'change' }],
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
      message.success($t('page.message.addSuccess'));
    } else {
      await updateLocation({ id: props.record!.id, ...data });
      message.success($t('page.message.updateSuccess'));
    }
    emit('success');
    handleClose();
  } catch (error: any) {
    message.error(error?.message || $t('page.message.saveFail'));
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
    :ok-text="$t('page.common.confirm')"
    :cancel-text="$t('page.common.cancel')"
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
      <Form.Item :label="$t('page.wms.location.locationCode')" name="locationCode">
        <Input v-model:value="formState.locationCode" :placeholder="$t('page.wms.location.locationCodePlaceholder')" :disabled="mode === 'edit'" />
      </Form.Item>
      <Form.Item :label="$t('page.wms.location.locationName')" name="locationName">
        <Input v-model:value="formState.locationName" :placeholder="$t('page.wms.location.locationNamePlaceholder')" />
      </Form.Item>
      <Form.Item :label="$t('page.wms.location.warehouseId')" name="warehouseId">
        <Select
          v-model:value="formState.warehouseId"
          :placeholder="$t('page.wms.location.warehouseIdPlaceholder')"
          :options="warehouseOptions"
          allow-clear
        />
      </Form.Item>
      <Form.Item :label="$t('page.wms.location.locationType')" name="locationType">
        <Select
          v-model:value="formState.locationType"
          :placeholder="$t('page.wms.location.locationTypePlaceholder')"
          :options="locationTypeOptions"
          allow-clear
        />
      </Form.Item>
      <Form.Item v-if="mode === 'edit'" :label="$t('page.common.status')" name="isEnabled">
        <Switch
          v-model:checked="formState.isEnabled"
          :checked-children="$t('page.common.enabled')"
          :un-checked-children="$t('page.common.disabled')"
          :checked-value="1"
          :unchecked-value="0"
        />
      </Form.Item>
      <Form.Item :label="$t('page.common.remark')" name="remark">
        <Input.TextArea v-model:value="formState.remark" :placeholder="$t('page.common.remarkPlaceholder')" :rows="3" />
      </Form.Item>
    </Form>
  </Modal>
</template>
