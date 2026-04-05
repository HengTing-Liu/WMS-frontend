<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    :width="config.modalWidth || 600"
    :confirm-loading="submitting"
    :mask-closable="false"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
      class="page-form"
    >
      <Row :gutter="16">
        <Col
          v-for="field in config.fields"
          :key="field.fieldCode"
          :span="24 / (config.columnCount || 1)"
        >
          <FormItem
            :label="field.fieldName"
            :name="field.fieldCode"
            :rules="getFieldRules(field)"
          >
            <!-- 文本输入 -->
            <Input
              v-if="field.fieldType === 'string'"
              v-model:value="formState[field.fieldCode]"
              :placeholder="$t('page.common.pleaseInput') + field.fieldName"
              :disabled="isView"
              :max-length="field.maxLength"
              allow-clear
            />
            
            <!-- 多行文本 -->
            <Textarea
              v-else-if="field.fieldType === 'textarea'"
              v-model:value="formState[field.fieldCode]"
              :placeholder="$t('page.common.pleaseInput') + field.fieldName"
              :disabled="isView"
              :max-length="field.maxLength"
              :rows="4"
              allow-clear
            />
            
            <!-- 数字输入 -->
            <InputNumber
              v-else-if="field.fieldType === 'number'"
              v-model:value="formState[field.fieldCode]"
              :placeholder="$t('page.common.pleaseInput') + field.fieldName"
              :disabled="isView"
              style="width: 100%"
            />
            
            <!-- 日期选择 -->
            <DatePicker
              v-else-if="field.fieldType === 'date'"
              v-model:value="formState[field.fieldCode]"
              :placeholder="$t('page.common.pleaseSelect') + field.fieldName"
              :disabled="isView"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
            
            <!-- 日期时间选择 -->
            <DatePicker
              v-else-if="field.fieldType === 'datetime'"
              v-model:value="formState[field.fieldCode]"
              :placeholder="$t('page.common.pleaseSelect') + field.fieldName"
              :disabled="isView"
              style="width: 100%"
              show-time
              value-format="YYYY-MM-DD HH:mm:ss"
            />
            
            <!-- 下拉选择 -->
            <Select
              v-else-if="field.fieldType === 'select'"
              v-model:value="formState[field.fieldCode]"
              :placeholder="$t('page.common.pleaseSelect') + field.fieldName"
              :options="field.options || []"
              :disabled="isView"
              allow-clear
              style="width: 100%"
            />
            
            <!-- 布尔值/开关 -->
            <Switch
              v-else-if="field.fieldType === 'boolean'"
              v-model:checked="formState[field.fieldCode]"
              :disabled="isView"
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Modal,
  Form,
  FormItem,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Switch,
  message,
  Row,
  Col,
} from 'ant-design-vue';

const Textarea = Input.TextArea;
import type { FieldMeta, PageFormConfig, CrudApi } from './types';
import { $t } from '@vben/locales';

type FormMode = 'add' | 'edit' | 'view';

const props = defineProps<{
  config: PageFormConfig;
  api: CrudApi;
  primaryKey?: string;
}>();

const emit = defineEmits<{
  success: [data: any];
  cancel: [];
}>();

// 弹窗显示状态
const visible = ref(false);

// 表单模式
const formMode = ref<FormMode>('add');

// 当前编辑的数据ID
const currentId = ref<any>(null);

// 提交中状态
const submitting = ref(false);

// 表单ref
const formRef = ref();

// 表单状态
const formState = ref<Record<string, any>>({});

// 弹窗标题
const modalTitle = computed(() => {
  const titles = {
    add: $t('page.common.add'),
    edit: $t('page.common.edit'),
    view: $t('page.common.view'),
  };
  return titles[formMode.value] || $t('page.common.form');
});

// 是否查看模式
const isView = computed(() => formMode.value === 'view');

// 表单校验规则
const formRules = computed(() => {
  const rules: Record<string, any> = {};
  props.config.fields.forEach((field: FieldMeta) => {
    if (field.required) {
      rules[field.fieldCode] = [
        {
          required: true,
          message: $t('page.common.fieldRequired', { name: field.fieldName }),
          trigger: field.fieldType === 'select' || field.fieldType === 'boolean' ? 'change' : 'blur',
        },
      ];
    }
  });
  return rules;
});

// 获取字段校验规则
const getFieldRules = (field: FieldMeta) => {
  const rules: any[] = [];
  
  if (field.required) {
    rules.push({
      required: true,
      message: $t('page.common.fieldRequired', { name: field.fieldName }),
      trigger: field.fieldType === 'select' || field.fieldType === 'boolean' ? 'change' : 'blur',
    });
  }
  
  return rules;
};

// 初始化表单值
const initFormState = () => {
  const state: Record<string, any> = {};
  props.config.fields.forEach((field: FieldMeta) => {
    // 设置默认值
    if (field.defaultValue !== undefined) {
      state[field.fieldCode] = field.defaultValue;
    } else {
      // 根据类型设置空值
      switch (field.fieldType) {
        case 'boolean':
          state[field.fieldCode] = 0;
          break;
        case 'number':
          state[field.fieldCode] = undefined;
          break;
        default:
          state[field.fieldCode] = undefined;
      }
    }
  });
  formState.value = state;
};

// 打开弹窗 - 新增
const openAdd = (defaultValues?: Record<string, any>) => {
  formMode.value = 'add';
  currentId.value = null;
  initFormState();
  
  if (defaultValues) {
    Object.assign(formState.value, defaultValues);
  }
  
  visible.value = true;
};

// 打开弹窗 - 编辑
const openEdit = async (row: any) => {
  formMode.value = 'edit';
  currentId.value = row[props.primaryKey || 'id'];
  
  // 如果有获取详情的API，调用它
  if (props.api?.get) {
    try {
      const detail = await props.api.get(currentId.value);
      formState.value = { ...detail };
    } catch (error) {
      console.error($t('page.common.getDetailFailed'), error);
      formState.value = { ...row };
    }
  } else {
    formState.value = { ...row };
  }
  
  visible.value = true;
};

// 打开弹窗 - 查看
const openView = async (row: any) => {
  formMode.value = 'view';
  currentId.value = row[props.primaryKey || 'id'];
  
  // 如果有获取详情的API，调用它
  if (props.api?.get) {
    try {
      const detail = await props.api.get(currentId.value);
      formState.value = { ...detail };
    } catch (error) {
      console.error($t('page.common.getDetailFailed'), error);
      formState.value = { ...row };
    }
  } else {
    formState.value = { ...row };
  }
  
  visible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  if (isView.value) {
    visible.value = false;
    return;
  }
  
  try {
    await formRef.value.validate();
    
    // 提交前校验
    if (props.config.beforeSubmit) {
      const valid = await props.config.beforeSubmit(formState.value);
      if (!valid) return;
    }
    
    submitting.value = true;
    
    let res;
    if (formMode.value === 'add') {
      if (!props.api?.add) {
        message.error($t('page.common.addNotConfigured'));
        return;
      }
      res = await props.api.add(formState.value);
    } else {
      if (!props.api?.edit) {
        message.error($t('page.common.editNotConfigured'));
        return;
      }
      res = await props.api.edit({
        ...formState.value,
        [props.primaryKey || 'id']: currentId.value,
      });
    }
    
    message.success(formMode.value === 'add' ? $t('page.common.addSuccess') : $t('page.common.editSuccess'));
    visible.value = false;
    emit('success', formState.value);
  } catch (error: any) {
    console.error($t('page.common.submitFailed'), error);
    if (error?.errorFields) {
      // 表单校验错误
      return;
    }
    message.error($t('page.common.submitFailed'));
  } finally {
    submitting.value = false;
  }
};

// 取消
const handleCancel = () => {
  visible.value = false;
  emit('cancel');
};

// 暴露方法
defineExpose({
  openAdd,
  openEdit,
  openView,
});
</script>

<style scoped>
.page-form :deep(.ant-form-item) {
  margin-bottom: 20px;
}
</style>
