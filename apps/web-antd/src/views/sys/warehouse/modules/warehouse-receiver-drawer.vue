<template>
  <Drawer
    v-model:open="visible"
    :title="drawerTitle"
    width="520"
    :destroy-on-close="true"
    @close="handleClose"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      layout="vertical"
      class="receiver-form"
    >
      <FormItem :label="$t('page.warehouse.consignee')" name="consignee">
        <Input
          v-model:value="formData.consignee"
          :placeholder="$t('page.common.inputPlaceholder')"
          allow-clear
        />
      </FormItem>

      <FormItem :label="$t('page.warehouse.phoneNumber')" name="phoneNumber">
        <Input
          v-model:value="formData.phoneNumber"
          :placeholder="$t('page.common.inputPlaceholder')"
          allow-clear
          maxlength="11"
        />
      </FormItem>

      <FormItem :label="$t('page.warehouse.country')" name="country">
        <Select v-model:value="formData.country" disabled>
          <SelectOption value="中国">{{ $t('page.warehouse.china') }}</SelectOption>
        </Select>
      </FormItem>

      <FormItem :label="$t('page.warehouse.provinceCity')" required>
        <Row :gutter="8">
          <Col :span="8">
            <FormItem name="province" no-style>
              <Select
                v-model:value="formData.province"
                :placeholder="$t('page.warehouse.province')"
                @change="handleProvinceChange"
              >
                <SelectOption v-for="item in provinceList" :key="item.code" :value="item.name">
                  {{ item.name }}
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem name="city" no-style>
              <Select
                v-model:value="formData.city"
                :placeholder="$t('page.warehouse.city')"
                :disabled="!formData.province"
                @change="handleCityChange"
              >
                <SelectOption v-for="item in cityList" :key="item.code" :value="item.name">
                  {{ item.name }}
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem name="district" no-style>
              <Select
                v-model:value="formData.district"
                :placeholder="$t('page.warehouse.district')"
                :disabled="!formData.city"
              >
                <SelectOption v-for="item in districtList" :key="item.code" :value="item.name">
                  {{ item.name }}
                </SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>
      </FormItem>

      <FormItem :label="$t('page.warehouse.detailedAddress')" name="detailedAddress">
        <Textarea
          v-model:value="formData.detailedAddress"
          :placeholder="$t('page.common.inputPlaceholder')"
          :rows="3"
          allow-clear
          show-count
          :maxlength="500"
        />
      </FormItem>

      <FormItem :label="$t('page.warehouse.postalCode')" name="postalCode">
        <Input
          v-model:value="formData.postalCode"
          :placeholder="$t('page.common.inputPlaceholder')"
          allow-clear
          maxlength="6"
        />
      </FormItem>

      <FormItem name="isDefault">
        <Checkbox v-model:checked="isDefaultChecked">
          {{ $t('page.warehouse.setAsDefault') }}
        </Checkbox>
      </FormItem>
    </Form>

    <template #footer>
      <div class="drawer-footer">
        <Button @click="handleClose">{{ $t('page.common.cancel') }}</Button>
        <Button type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ $t('page.common.confirm') }}
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { $t } from '@vben/locales';
import {
  Button,
  Checkbox,
  Col,
  Drawer,
  Form,
  FormItem,
  Input,
  Row,
  Select,
  SelectOption,
  Textarea,
  message,
} from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';

import {
  createWarehouseReceiver,
  getWarehouseReceiverDetail,
  updateWarehouseReceiver,
} from '#/api/sys/warehouse-receiver';
import { regionData } from '#/utils/region-data';

const props = defineProps<{
  open: boolean;
  receiverId?: number;
  warehouseCode: string;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}>();

const visible = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const drawerTitle = computed(() => {
  return props.receiverId
    ? $t('page.warehouse.editReceiver')
    : $t('page.warehouse.addReceiver');
});

const formRef = ref<InstanceType<typeof Form> | null>(null);
const submitLoading = ref(false);

const formData = ref({
  id: undefined as number | undefined,
  warehouseCode: '',
  consignee: '',
  phoneNumber: '',
  country: '中国',
  province: '',
  city: '',
  district: '',
  detailedAddress: '',
  postalCode: '',
  isDefault: 0,
});

const isDefaultChecked = computed({
  get: () => formData.value.isDefault === 1,
  set: (val) => {
    formData.value.isDefault = val ? 1 : 0;
  },
});

const provinceList = computed(() => regionData);
const cityList = computed(() => {
  const province = provinceList.value.find((p) => p.name === formData.value.province);
  return province?.children || [];
});
const districtList = computed(() => {
  const city = cityList.value.find((c) => c.name === formData.value.city);
  return city?.children || [];
});

const formRules: Record<string, Rule[]> = {
  consignee: [
    { required: true, message: $t('page.warehouse.consigneeRequired'), trigger: 'blur' },
    { min: 2, max: 50, message: $t('page.warehouse.consigneeLength'), trigger: 'blur' },
  ],
  phoneNumber: [
    { required: true, message: $t('page.warehouse.phoneNumberRequired'), trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: $t('page.warehouse.phoneNumberFormat'), trigger: 'blur' },
  ],
  province: [{ required: true, message: $t('page.warehouse.provinceRequired'), trigger: 'change' }],
  city: [{ required: true, message: $t('page.warehouse.cityRequired'), trigger: 'change' }],
  district: [{ required: true, message: $t('page.warehouse.districtRequired'), trigger: 'change' }],
  detailedAddress: [
    { required: true, message: $t('page.warehouse.detailedAddressRequired'), trigger: 'blur' },
    { min: 5, max: 500, message: $t('page.warehouse.detailedAddressLength'), trigger: 'blur' },
  ],
  postalCode: [{ pattern: /^\d{6}$/, message: $t('page.warehouse.postalCodeFormat'), trigger: 'blur' }],
};

const handleProvinceChange = () => {
  formData.value.city = '';
  formData.value.district = '';
};

const handleCityChange = () => {
  formData.value.district = '';
};

const fetchDetail = async () => {
  if (!props.receiverId) return;
  try {
    const res = await getWarehouseReceiverDetail(props.receiverId);
    const data = res.data;
    if (data) {
      formData.value = {
        id: data.id,
        warehouseCode: data.warehouseCode,
        consignee: data.consignee,
        phoneNumber: data.phoneNumber,
        country: data.country || '中国',
        province: data.province,
        city: data.city,
        district: data.district,
        detailedAddress: data.detailedAddress,
        postalCode: data.postalCode || '',
        isDefault: data.isDefault,
      };
    }
  } catch {
    message.error($t('page.common.fetchFailed'));
  }
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    submitLoading.value = true;
    const data = { ...formData.value, warehouseCode: props.warehouseCode };
    if (props.receiverId) {
      await updateWarehouseReceiver(props.receiverId, data);
      message.success($t('page.common.updateSuccess'));
    } else {
      await createWarehouseReceiver(data);
      message.success($t('page.common.createSuccess'));
    }
    emit('success');
    handleClose();
  } catch (error) {
    console.error(error);
  } finally {
    submitLoading.value = false;
  }
};

const handleClose = () => {
  formRef.value?.resetFields();
  visible.value = false;
};

watch(
  () => props.open,
  (val) => {
    if (val) {
      formData.value = {
        id: undefined,
        warehouseCode: props.warehouseCode,
        consignee: '',
        phoneNumber: '',
        country: '中国',
        province: '',
        city: '',
        district: '',
        detailedAddress: '',
        postalCode: '',
        isDefault: 0,
      };
      if (props.receiverId) {
        fetchDetail();
      }
    }
  }
);
</script>

<style scoped>
.receiver-form {
  padding: 8px 0;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
