<template>
  <!-- Modal 模式 -->
  <Modal
    v-if="mode === 'modal'"
    v-model:open="visible"
    :title="formTitle"
    :width="formWidth"
    :confirm-loading="submitting"
    :mask-closable="false"
    :destroy-on-close="true"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="labelCol"
      :wrapper-col="wrapperCol"
      class="lc-form"
    >
      <Row :gutter="16">
        <Col
          v-for="field in fields"
          :key="field.fieldCode"
          :span="24 / (columnCount || 1)"
        >
          <FormItem
            :label="field.fieldName"
            :name="field.fieldCode"
          >
            <!-- 文本输入 -->
            <Input
              v-if="field.fieldType === 'string'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseInput')}${field.fieldName}`"
              :disabled="isFieldReadonly(field)"
              :max-length="field.maxLength"
              allow-clear
            />

            <!-- 多行文本 -->
            <Textarea
              v-else-if="field.fieldType === 'textarea'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseInput')}${field.fieldName}`"
              :disabled="isFieldReadonly(field)"
              :max-length="field.maxLength"
              :rows="4"
              show-count
              allow-clear
            />

            <!-- 数字输入 -->
            <InputNumber
              v-else-if="field.fieldType === 'number'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseInput')}${field.fieldName}`"
              :disabled="isFieldReadonly(field)"
              style="width: 100%"
            />

            <!-- 日期选择 -->
            <DatePicker
              v-else-if="field.fieldType === 'date'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseSelect')}${field.fieldName}`"
              :disabled="isFieldReadonly(field)"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />

            <!-- 日期时间选择 -->
            <DatePicker
              v-else-if="field.fieldType === 'datetime'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseSelect')}${field.fieldName}`"
              :disabled="isFieldReadonly(field)"
              style="width: 100%"
              show-time
              value-format="YYYY-MM-DD HH:mm:ss"
            />

            <!-- 下拉选择 -->
            <Select
              v-else-if="field.fieldType === 'select'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseSelect')}${field.fieldName}`"
              :options="field.options || []"
              :disabled="isFieldReadonly(field)"
              allow-clear
              style="width: 100%"
            />

            <!-- 布尔值/开关 -->
            <Switch
              v-else-if="field.fieldType === 'boolean'"
              v-model:checked="formData[field.fieldCode]"
              :disabled="isFieldReadonly(field)"
              :checked-value="1"
              :un-checked-value="0"
              :checked-children="$t('page.common.yes')"
              :un-checked-children="$t('page.common.no')"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>
  </Modal>

  <!-- Drawer 模式 -->
  <Drawer
    v-else
    v-model:open="visible"
    :title="formTitle"
    :width="formWidth"
    :placement="placement"
    :destroy-on-close="true"
    @close="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="labelCol"
      :wrapper-col="wrapperCol"
      class="lc-form"
    >
      <Row :gutter="16">
        <Col
          v-for="field in fields"
          :key="field.fieldCode"
          :span="24 / (columnCount || 1)"
        >
          <FormItem
            :label="field.fieldName"
            :name="field.fieldCode"
          >
            <!-- 文本输入 -->
            <Input
              v-if="field.fieldType === 'string'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseInput')}${field.fieldName}`"
              :disabled="isFieldReadonly(field)"
              :max-length="field.maxLength"
              allow-clear
            />

            <!-- 多行文本 -->
            <Textarea
              v-else-if="field.fieldType === 'textarea'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseInput')}${field.fieldName}`"
              :disabled="isFieldReadonly(field)"
              :max-length="field.maxLength"
              :rows="4"
              show-count
              allow-clear
            />

            <!-- 数字输入 -->
            <InputNumber
              v-else-if="field.fieldType === 'number'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseInput')}${field.fieldName}`"
              :disabled="isFieldReadonly(field)"
              style="width: 100%"
            />

            <!-- 日期选择 -->
            <DatePicker
              v-else-if="field.fieldType === 'date'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseSelect')}${field.fieldName}`"
              :disabled="isFieldReadonly(field)"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />

            <!-- 日期时间选择 -->
            <DatePicker
              v-else-if="field.fieldType === 'datetime'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseSelect')}${field.fieldName}`"
              :disabled="isFieldReadonly(field)"
              style="width: 100%"
              show-time
              value-format="YYYY-MM-DD HH:mm:ss"
            />

            <!-- 下拉选择 -->
            <Select
              v-else-if="field.fieldType === 'select'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || `${$t('page.common.pleaseSelect')}${field.fieldName}`"
              :options="field.options || []"
              :disabled="isFieldReadonly(field)"
              allow-clear
              style="width: 100%"
            />

            <!-- 布尔值/开关 -->
            <Switch
              v-else-if="field.fieldType === 'boolean'"
              v-model:checked="formData[field.fieldCode]"
              :disabled="isFieldReadonly(field)"
              :checked-value="1"
              :un-checked-value="0"
              :checked-children="$t('page.common.yes')"
              :un-checked-children="$t('page.common.no')"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>

    <template #footer>
      <div class="lc-form-drawer-footer">
        <Button @click="handleCancel">{{ $t('page.common.cancel') }}</Button>
        <Button
          v-if="!isView"
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          {{ $t('page.common.confirm') }}
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Modal,
  Drawer,
  Form,
  FormItem,
  Input,
  InputNumber,
  Textarea,
  DatePicker,
  Select,
  Switch,
  Row,
  Col,
  Button,
  message,
} from 'ant-design-vue';
import { $t } from '@vben/locales';
import { useUserStore } from '@vben/stores';
import type { LcFormProps, LcFormField, LcCrudApi } from './types';

type FormMode = 'add' | 'edit' | 'view';

const props = withDefaults(defineProps<LcFormProps>(), {
  mode: 'modal',
  width: 600,
  placement: 'right',
  labelCol: () => ({ span: 6 }),
  wrapperCol: () => ({ span: 16 }),
  primaryKey: 'id',
  fields: () => [],
});

const emit = defineEmits<{
  success: [data: any, mode: FormMode];
  cancel: [];
  'update:open': [open: boolean];
}>();
const userStore = useUserStore();

// 可见性
const visible = ref(false);

// 表单模式
const formMode = ref<FormMode>('add');

// 当前编辑 ID
const currentId = ref<any>(null);

// 提交中状态
const submitting = ref(false);

// 表单 ref
const formRef = ref();

// 表单数据
const formData = ref<Record<string, any>>({});

// 列数 (用于 Row 布局)
const columnCount = computed(() => {
  if (props.fields.length <= 2) return 1;
  return 1; // 默认单列，更灵活的布局由外部控制
});

// 弹窗宽度
const formWidth = computed(() => {
  if (props.mode === 'drawer') {
    return props.width;
  }
  // Modal 模式根据字段数量调整
  if (props.fields.length > 6) return 800;
  return props.width;
});

// 弹窗标题
const formTitle = computed(() => {
  const prefix = props.fields[0]?.fieldName || '';
  const titles: Record<FormMode, string> = {
    add: $t('page.common.addTitle', { name: prefix.replace(/[^\u4e00-\u9fa5]/g, '') }),
    edit: $t('page.common.editTitle', { name: prefix.replace(/[^\u4e00-\u9fa5]/g, '') }),
    view: $t('page.common.viewTitle', { name: prefix.replace(/[^\u4e00-\u9fa5]/g, '') }),
  };
  return titles[formMode.value];
});

// 是否查看模式
const isView = computed(() => formMode.value === 'view');

function normalizeFieldCode(code?: string) {
  return String(code || '')
    .toLowerCase()
    .replace(/[_-]/g, '');
}

function isCreatorField(code?: string) {
  return normalizeFieldCode(code) === 'createby';
}

function isCreateTimeField(code?: string) {
  return normalizeFieldCode(code) === 'createtime';
}

function isUpdaterField(code?: string) {
  return normalizeFieldCode(code) === 'updateby';
}

function isUpdateTimeField(code?: string) {
  return normalizeFieldCode(code) === 'updatetime';
}

function isAuditFieldCode(code?: string) {
  return (
    isCreatorField(code)
    || isCreateTimeField(code)
    || isUpdaterField(code)
    || isUpdateTimeField(code)
  );
}

function isFieldReadonly(field: LcFormField) {
  return isView.value || isAuditFieldCode(field.fieldCode);
}

function isBlank(value: any) {
  return value == null || String(value).trim() === '';
}

function formatNow() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function getCurrentOperator() {
  const info: any = userStore.userInfo || {};
  return (
    info?.realName
    || info?.nickName
    || info?.username
    || info?.userName
    || 'system'
  );
}

function applyAuditDefaults(mode: Exclude<FormMode, 'view'>) {
  const operator = getCurrentOperator();
  const now = formatNow();
  for (const key of Object.keys(formData.value)) {
    if (isCreatorField(key) && isBlank(formData.value[key])) {
      formData.value[key] = operator;
    }
    if (isCreateTimeField(key) && isBlank(formData.value[key])) {
      formData.value[key] = now;
    }
    if (isUpdaterField(key) && (mode === 'edit' || isBlank(formData.value[key]))) {
      formData.value[key] = operator;
    }
    if (isUpdateTimeField(key) && (mode === 'edit' || isBlank(formData.value[key]))) {
      formData.value[key] = now;
    }
  }
}

// 表单验证规则
const formRules = computed(() => {
  const rules: Record<string, any[]> = {};

  props.fields.forEach((field: LcFormField) => {
    const fieldRules: any[] = [];

    if (field.required) {
      const trigger = ['select', 'boolean'].includes(field.fieldType) ? 'change' : 'blur';
      fieldRules.push({
        required: true,
        message: $t('page.common.fieldRequired', { name: field.fieldName }),
        trigger,
      });
    }

    if (field.maxLength && field.fieldType === 'string') {
      fieldRules.push({
        max: field.maxLength,
        message: $t('page.common.maxLength', { name: field.fieldName, length: field.maxLength }),
        trigger: 'blur',
      });
    }

    if (fieldRules.length > 0) {
      rules[field.fieldCode] = fieldRules;
    }
  });

  return rules;
});

// 初始化表单数据
function initFormData() {
  const data: Record<string, any> = {};
  props.fields.forEach((field: LcFormField) => {
    if (field.defaultValue !== undefined) {
      data[field.fieldCode] = field.defaultValue;
    } else {
      switch (field.fieldType) {
        case 'boolean':
          data[field.fieldCode] = 0;
          break;
        case 'number':
          data[field.fieldCode] = undefined;
          break;
        default:
          data[field.fieldCode] = undefined;
      }
    }
  });
  return data;
}

// 打开弹窗 - 新增
function openAdd(defaultValues?: Record<string, any>) {
  formMode.value = 'add';
  currentId.value = null;
  formData.value = initFormData();

  if (defaultValues) {
    Object.assign(formData.value, defaultValues);
  }
  applyAuditDefaults('add');

  visible.value = true;
}

// 打开弹窗 - 编辑
async function openEdit(row: any) {
  formMode.value = 'edit';
  currentId.value = row[props.primaryKey];

  // 优先调用 API 获取详情
  if (props.api?.get) {
    try {
      const detail = await props.api.get(currentId.value);
      formData.value = { ...detail };
      applyAuditDefaults('edit');
      visible.value = true;
      return;
    } catch (error) {
      console.error($t('page.common.getDetailFailed'), error);
    }
  }

  // 回退使用 row 数据
  formData.value = { ...row };
  applyAuditDefaults('edit');
  visible.value = true;
}

// 打开弹窗 - 查看
async function openView(row: any) {
  formMode.value = 'view';
  currentId.value = row[props.primaryKey];

  if (props.api?.get) {
    try {
      const detail = await props.api.get(currentId.value);
      formData.value = { ...detail };
      visible.value = true;
      return;
    } catch (error) {
      console.error($t('page.common.getDetailFailed'), error);
    }
  }

  formData.value = { ...row };
  visible.value = true;
}

// 提交表单
async function handleSubmit() {
  if (isView.value) {
    visible.value = false;
    return;
  }

  try {
    // 表单验证
    applyAuditDefaults(formMode.value === 'add' ? 'add' : 'edit');
    await formRef.value?.validate();

    submitting.value = true;

    let result;
    if (formMode.value === 'add') {
      if (!props.api?.add) {
        message.warning($t('page.common.addNotConfigured'));
        return;
      }
      result = await props.api.add(formData.value);
      message.success($t('page.common.addSuccess'));
    } else {
      if (!props.api?.edit) {
        message.warning($t('page.common.editNotConfigured'));
        return;
      }
      result = await props.api.edit({
        ...formData.value,
        [props.primaryKey]: currentId.value,
      });
      message.success($t('page.common.editSuccess'));
    }

    visible.value = false;
    emit('success', formData.value, formMode.value);
  } catch (error: any) {
    console.error($t('page.common.submitFailed'), error);
    if (error?.errorFields) {
      return; // 表单验证错误，不做处理
    }
    message.error($t('page.common.submitFailed'));
  } finally {
    submitting.value = false;
  }
}

// 取消
function handleCancel() {
  visible.value = false;
  emit('cancel');
}

// 获取表单数据
function getValues() {
  return { ...formData.value };
}

// 设置表单数据
function setValues(values: Record<string, any>) {
  formData.value = { ...values };
}

// 重置表单
function reset() {
  formRef.value?.resetFields();
  formData.value = initFormData();
}

// 暴露方法
defineExpose({
  openAdd,
  openEdit,
  openView,
  getValues,
  setValues,
  reset,
  formRef,
});
</script>

<style scoped>
.lc-form :deep(.ant-form-item) {
  margin-bottom: 20px;
}

.lc-form-drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
