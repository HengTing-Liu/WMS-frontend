<template>
  <div class="query-form-container">
    <Form
      :model="formState"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      class="query-form"
    >
      <Row :gutter="16">
        <Col
          v-for="field in visibleFields"
          :key="field.fieldCode"
          :span="24 / (columnCount || 4)"
        >
          <FormItem :label="field.fieldName">
            <!-- 文本输入 -->
            <Input
              v-if="field.fieldType === 'string'"
              v-model:value="formState[field.fieldCode]"
              :placeholder="$t('page.common.pleaseInput') + field.fieldName"
              allow-clear
              @press-enter="handleSearch"
            />
            <!-- 数字输入 -->
            <InputNumber
              v-else-if="field.fieldType === 'number'"
              v-model:value="formState[field.fieldCode]"
              :placeholder="$t('page.common.pleaseInput') + field.fieldName"
              style="width: 100%"
              @press-enter="handleSearch"
            />
            <!-- 日期选择 -->
            <DatePicker
              v-else-if="field.fieldType === 'date'"
              v-model:value="formState[field.fieldCode]"
              :placeholder="$t('page.common.pleaseSelect') + field.fieldName"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
            <!-- 日期时间选择 -->
            <RangePicker
              v-else-if="field.fieldType === 'datetime'"
              v-model:value="formState[field.fieldCode]"
              :placeholder="[$t('page.common.startTime'), $t('page.common.endTime')]"
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
              allow-clear
              style="width: 100%"
            />
            <!-- 布尔值 -->
            <Select
              v-else-if="field.fieldType === 'boolean'"
              v-model:value="formState[field.fieldCode]"
              :placeholder="$t('page.common.pleaseSelect') + field.fieldName"
              :options="[
                { label: $t('page.common.yes'), value: true },
                { label: $t('page.common.no'), value: false },
              ]"
              allow-clear
              style="width: 100%"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>
    
    <!-- 工具栏 -->
    <div class="query-form-toolbar flex justify-between items-center mt-4">
      <div class="left-tools flex gap-2">
        <Button type="primary" @click="handleSearch">
          <IconifyIcon icon="material-symbols:search" class="size-4" />
          {{ $t('page.common.search') }}
        </Button>
        <Button @click="handleReset">
          <IconifyIcon icon="material-symbols:refresh" class="size-4" />
          {{ $t('page.common.reset') }}
        </Button>
      </div>
      <div class="right-tools flex gap-2">
        <!-- 字段选择器 -->
        <Dropdown v-if="showFieldSelector" :trigger="['click']" overlay-class-name="field-selector-dropdown">
          <Button>
            <IconifyIcon icon="material-symbols:settings" class="size-4" />
            {{ $t('page.common.displayFields') }}
          </Button>
          <template #overlay>
            <div class="field-selector-menu p-2 bg-white rounded shadow border min-w-[150px]" @click.stop>
              <div v-for="field in allFields" :key="field.fieldCode" class="py-1">
                <Checkbox
                  :checked="selectedFields.includes(field.fieldCode)"
                  @change="(e) => toggleField(field.fieldCode, e.target.checked)"
                >
                  {{ field.fieldName }}
                </Checkbox>
              </div>
            </div>
          </template>
        </Dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  Form,
  FormItem,
  Input,
  InputNumber,
  DatePicker,
  RangePicker,
  Select,
  Button,
  Row,
  Col,
  Dropdown,
  Checkbox,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import type { FieldMeta, QueryFormConfig } from './types';
import { $t } from '@vben/locales';

const props = withDefaults(
  defineProps<{
    config: QueryFormConfig;
    loading?: boolean;
  }>(),
  {
    loading: false,
  }
);

const emit = defineEmits<{
  search: [values: Record<string, any>];
  reset: [];
  'update:visibleFields': [fields: string[]];
}>();

// 表单状态
const formState = ref<Record<string, any>>({});

// 选中的字段
const selectedFields = ref<string[]>([]);

// 所有字段
const allFields = computed(() => props.config.fields || []);

// 列数
const columnCount = computed(() => props.config.columnCount || 4);

// 是否显示字段选择器
const showFieldSelector = computed(() => props.config.showFieldSelector !== false);

// 可见字段
const visibleFields = computed(() => {
  if (selectedFields.value.length === 0) {
    return allFields.value;
  }
  return allFields.value.filter((f) => selectedFields.value.includes(f.fieldCode));
});

// 切换字段显示
const toggleField = (fieldCode: string, checked: boolean) => {
  if (checked) {
    selectedFields.value = [...selectedFields.value, fieldCode];
  } else {
    selectedFields.value = selectedFields.value.filter((f) => f !== fieldCode);
  }
  emit('update:visibleFields', selectedFields.value);
};

// 查询
const handleSearch = () => {
  const values: Record<string, any> = {};
  Object.keys(formState.value).forEach((key) => {
    if (formState.value[key] !== undefined && formState.value[key] !== null && formState.value[key] !== '') {
      values[key] = formState.value[key];
    }
  });
  emit('search', values);
};

// 重置
const handleReset = () => {
  formState.value = {};
  emit('reset');
  emit('search', {});
};

// 获取表单值
const getValues = () => {
  return { ...formState.value };
};

// 设置表单值
const setValues = (values: Record<string, any>) => {
  formState.value = { ...values };
};

// 初始化
onMounted(() => {
  // 设置默认显示的字段
  if (props.config.defaultVisibleFields?.length) {
    selectedFields.value = props.config.defaultVisibleFields;
  } else {
    selectedFields.value = allFields.value.map((f) => f.fieldCode);
  }
});

// 暴露方法
defineExpose({
  getValues,
  setValues,
  reset: handleReset,
});
</script>

<style scoped>
.query-form-container {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.query-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style>
