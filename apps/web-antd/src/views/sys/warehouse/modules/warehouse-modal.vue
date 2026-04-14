<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    width="800px"
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
      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.warehouseCode')" name="warehouseCode">
            <Input
              v-model:value="formData.warehouseCode"
              :placeholder="$t('page.common.inputPlaceholder')"
              :disabled="isEdit"
              :maxlength="100"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.warehouseName')" name="warehouseName">
            <Input
              v-model:value="formData.warehouseName"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="100"
            />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.warehouseType')">
            <Input
              v-model:value="formData.warehouseType"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.warehouseLocation')">
            <Input
              v-model:value="formData.warehouseLocation"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="100"
            />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.temperatureZone')">
            <Input
              v-model:value="formData.temperatureZone"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.qualityZone')">
            <Input
              v-model:value="formData.qualityZone"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
      </Row>

      <Divider>{{ $t('page.warehouse.erpSection') || 'ERP信息' }}</Divider>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.erpCompanyCode')">
            <Input
              v-model:value="formData.erpCompanyCode"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.erpCompanyName')">
            <Input
              v-model:value="formData.erpCompanyName"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="100"
            />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.erpWarehouseCode')">
            <Input
              v-model:value="formData.erpWarehouseCode"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.erpLocationCode')">
            <Input
              v-model:value="formData.erpLocationCode"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
      </Row>

      <Divider>{{ $t('page.warehouse.managerSection') || '责任人信息' }}</Divider>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.employeeCode')">
            <Input
              v-model:value="formData.employeeCode"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.employeeName')">
            <Input
              v-model:value="formData.employeeName"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.deptCode')">
            <Input
              v-model:value="formData.deptCode"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.deptNameFullPath')">
            <Input
              v-model:value="formData.deptNameFullPath"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="200"
            />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.isEnabled')" name="isEnabled">
            <Switch
              v-model:checked="formData.isEnabled"
              :checked-value="1"
              :un-checked-value="0"
            />
          </FormItem>
        </Col>
      </Row>

      <FormItem :label="$t('page.warehouse.remark')">
        <Textarea
          v-model:value="formData.remarks"
          :placeholder="$t('page.common.inputPlaceholder')"
          :rows="3"
          :maxlength="500"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { $t } from '@vben/locales';
import {
  Col,
  Divider,
  Form,
  FormItem,
  Input,
  Modal,
  Row,
  Switch,
  Textarea,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';

import {
  createWarehouse,
  updateWarehouse,
  getWarehouseDetail,
  type WarehouseResult,
} from '#/api/sys/warehouse';

const props = defineProps<{
  warehouseId?: number;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const visible = defineModel<boolean>('open', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => !!props.warehouseId);

const modalTitle = computed(() =>
  isEdit.value ? $t('page.warehouse.editTitle') : $t('page.warehouse.addTitle')
);

const formData = reactive<Record<string, any>>({
  id: undefined,
  warehouseType: '',
  warehouseCode: '',
  warehouseLocation: '',
  warehouseName: '',
  temperatureZone: '',
  qualityZone: '',
  employeeCode: '',
  employeeName: '',
  deptCode: '',
  deptNameFullPath: '',
  erpCompanyCode: '',
  erpCompanyName: '',
  erpWarehouseCode: '',
  erpLocationCode: '',
  isEnabled: 1,
  remarks: '',
});

const formRules = {
  warehouseCode: [
    { required: true, message: () => $t('page.warehouse.codeRequired'), trigger: 'blur' },
    { max: 100, message: () => $t('page.warehouse.codeMaxLength'), trigger: 'blur' },
  ],
  warehouseName: [
    { required: true, message: () => $t('page.warehouse.nameRequired'), trigger: 'blur' },
    { max: 100, message: () => $t('page.warehouse.nameMaxLength'), trigger: 'blur' },
  ],
  isEnabled: [
    { required: true, message: () => $t('page.warehouse.statusRequired'), trigger: 'change' },
  ],
};

// 加载详情
const loadDetail = async (id: number) => {
  try {
    const res = await getWarehouseDetail(id);
    Object.assign(formData, res.data || res);
  } catch {
    message.error($t('page.warehouse.loadDetailFailed'));
  }
};

// 打开弹窗时加载数据
const open = async (id?: number) => {
  visible.value = true;
  resetForm();
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
      await updateWarehouse(formData);
      message.success($t('page.common.updateSuccess'));
    } else {
      await createWarehouse(formData);
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
  formData.warehouseType = '';
  formData.warehouseCode = '';
  formData.warehouseLocation = '';
  formData.warehouseName = '';
  formData.temperatureZone = '';
  formData.qualityZone = '';
  formData.employeeCode = '';
  formData.employeeName = '';
  formData.deptCode = '';
  formData.deptNameFullPath = '';
  formData.erpCompanyCode = '';
  formData.erpCompanyName = '';
  formData.erpWarehouseCode = '';
  formData.erpLocationCode = '';
  formData.isEnabled = 1;
  formData.remarks = '';
  formRef.value?.resetFields();
};

// 暴露方法
defineExpose({
  open,
});
</script>
