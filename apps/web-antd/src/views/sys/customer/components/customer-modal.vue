<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    width="700px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <FormItem :label="$t('page.customer.customerCode')" name="customerCode">
        <Input
          v-model:value="formData.customerCode"
          :placeholder="$t('page.common.inputPlaceholder')"
          :disabled="isEdit"
          :maxlength="50"
        />
      </FormItem>
      <FormItem :label="$t('page.customer.customerName')" name="customerName">
        <Input
          v-model:value="formData.customerName"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="100"
        />
      </FormItem>
      <FormItem :label="$t('page.customer.contactPerson')">
        <Input
          v-model:value="formData.contactPerson"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="50"
        />
      </FormItem>
      <FormItem :label="$t('page.customer.mobile')">
        <Input
          v-model:value="formData.mobile"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="20"
        />
      </FormItem>
      <FormItem :label="$t('page.customer.contactPhone')">
        <Input
          v-model:value="formData.contactPhone"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="20"
        />
      </FormItem>
      <FormItem :label="$t('page.customer.email')">
        <Input
          v-model:value="formData.email"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="100"
        />
      </FormItem>
      <FormItem :label="$t('page.customer.province')">
        <Cascader
          v-model:value="regionValue"
          :options="regionOptions"
          :placeholder="$t('page.common.selectPlaceholder')"
          change-on-select
          @change="handleRegionChange"
        />
      </FormItem>
      <FormItem :label="$t('page.customer.address')">
        <Input
          v-model:value="formData.address"
          :placeholder="$t('page.common.inputPlaceholder')"
          :maxlength="200"
        />
      </FormItem>
      <FormItem :label="$t('page.customer.isEnabled')" name="isEnabled">
        <Switch
          v-model:checked="formData.isEnabled"
          :checkedValue="1"
          :unCheckedValue="0"
        />
      </FormItem>
      <FormItem :label="$t('page.customer.remark')">
        <Textarea
          v-model:value="formData.remark"
          :placeholder="$t('page.common.inputPlaceholder')"
          :rows="3"
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { $t } from '@vben/locales';
import {
  Cascader,
  Form,
  FormItem,
  Input,
  Modal,
  Switch,
  Textarea,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';
import type { CascaderProps } from 'ant-design-vue';

import {
  createCustomer,
  updateCustomer,
  getCustomerDetail,
  type CustomerResult,
} from '#/api/sys/customer';

const props = defineProps<{
  customerId?: number;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const visible = defineModel<boolean>('open', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => !!props.customerId);

const modalTitle = computed(() =>
  isEdit.value ? $t('page.customer.editTitle') : $t('page.customer.addTitle')
);

const formData = reactive<Record<string, any>>({
  id: undefined,
  customerCode: '',
  customerName: '',
  contactPerson: '',
  mobile: '',
  contactPhone: '',
  email: '',
  province: '',
  city: '',
  district: '',
  address: '',
  isEnabled: 1,
  remark: '',
});

// 省市区联动
const regionValue = ref<string[]>([]);

const regionOptions = ref<any[]>([]);

async function loadRegions() {
  try {
    const res = await fetch('/geo.json');
    const data = await res.json();
    regionOptions.value = data;
  } catch {
    regionOptions.value = [];
  }
}

function handleRegionChange(value: string[]) {
  formData.province = value[0] || '';
  formData.city = value[1] || '';
  formData.district = value[2] || '';
}

watch(regionValue, (val) => {
  if (!val || val.length === 0) {
    formData.province = '';
    formData.city = '';
    formData.district = '';
  }
});

const formRules = {
  customerCode: [
    { required: true, message: () => $t('page.customer.codeRequired'), trigger: 'blur' },
    { max: 50, message: () => $t('page.customer.codeMaxLength'), trigger: 'blur' },
  ],
  customerName: [
    { required: true, message: () => $t('page.customer.nameRequired'), trigger: 'blur' },
    { max: 100, message: () => $t('page.customer.nameMaxLength'), trigger: 'blur' },
  ],
  isEnabled: [
    { required: true, message: () => $t('page.customer.statusRequired'), trigger: 'change' },
  ],
};

// 加载详情
const loadDetail = async (id: number) => {
  try {
    const res = await getCustomerDetail(id);
    Object.assign(formData, res.data || res);
    // 恢复省市区
    const region: string[] = [];
    if (res.province) region.push(res.province);
    if (res.city) region.push(res.city);
    if (res.district) region.push(res.district);
    regionValue.value = region;
  } catch {
    message.error($t('page.customer.loadDetailFailed'));
  }
};

// 打开弹窗时加载数据
const open = async (id?: number) => {
  visible.value = true;
  resetForm();
  await loadRegions();
  if (id) {
    await loadDetail(id);
  }
};

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (isEdit.value) {
      await updateCustomer(formData);
      message.success($t('page.common.updateSuccess'));
    } else {
      await createCustomer(formData);
      message.success($t('page.common.createSuccess'));
    }

    visible.value = false;
    emit('success');
  } catch (error) {
    // 表单验证失败或请求失败
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  visible.value = false;
  resetForm();
  emit('cancel');
};

// 重置表单
const resetForm = () => {
  formData.id = undefined;
  formData.customerCode = '';
  formData.customerName = '';
  formData.contactPerson = '';
  formData.mobile = '';
  formData.contactPhone = '';
  formData.email = '';
  formData.province = '';
  formData.city = '';
  formData.district = '';
  formData.address = '';
  formData.isEnabled = 1;
  formData.remark = '';
  regionValue.value = [];
  formRef.value?.resetFields();
};

// 暴露方法
defineExpose({
  open,
});
</script>
