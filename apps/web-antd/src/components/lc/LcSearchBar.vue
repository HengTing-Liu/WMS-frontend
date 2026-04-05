<template>
  <div class="lc-search-bar-container">
    <Form
      :model="formData"
      class="lc-search-bar"
    >
      <Row :gutter="16">
        <Col
          v-for="field in visibleFields"
          :key="field.fieldCode"
          :span="24 / (columns || 4)"
        >
          <FormItem :label="field.fieldName">
            <!-- 文本输入 -->
            <Input
              v-if="field.fieldType === 'string'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || $t('page.common.inputPlaceholder', { name: field.fieldName })"
              allow-clear
              @press-enter="handleSearch"
            />

            <!-- 数字输入 -->
            <InputNumber
              v-else-if="field.fieldType === 'number'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || $t('page.common.inputPlaceholder', { name: field.fieldName })"
              style="width: 100%"
              @press-enter="handleSearch"
            />

            <!-- 日期选择 -->
            <DatePicker
              v-else-if="field.fieldType === 'date'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || $t('page.common.selectPlaceholder', { name: field.fieldName })"
              style="width: 100%"
              value-format="YYYY-MM-DD"
              @press-enter="handleSearch"
            />

            <!-- 日期范围选择 -->
            <RangePicker
              v-else-if="field.fieldType === 'datetime'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="[$t('page.common.startTime'), $t('page.common.endTime')]"
              style="width: 100%"
              show-time
              value-format="YYYY-MM-DD HH:mm:ss"
              @press-enter="handleSearch"
            />

            <!-- 下拉选择 -->
            <Select
              v-else-if="field.fieldType === 'select'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || $t('page.common.selectPlaceholder', { name: field.fieldName })"
              :options="field.options || []"
              allow-clear
              style="width: 100%"
            />

            <!-- 布尔值 -->
            <Select
              v-else-if="field.fieldType === 'boolean'"
              v-model:value="formData[field.fieldCode]"
              :placeholder="field.placeholder || $t('page.common.selectPlaceholder', { name: field.fieldName })"
              :options="[
                { label: $t('page.common.yes'), value: 1 },
                { label: $t('page.common.no'), value: 0 },
              ]"
              allow-clear
              style="width: 100%"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>

    <!-- 工具栏 -->
    <div class="lc-search-bar-toolbar">
      <div class="left-tools flex gap-2">
        <Button type="primary" @click="handleSearch">
          <IconifyIcon icon="material-symbols:search" class="size-4" />
          {{ $t('page.common.query') }}
        </Button>
        <Button @click="handleReset">
          <IconifyIcon icon="material-symbols:refresh" class="size-4" />
          {{ $t('page.common.reset') }}
        </Button>
      </div>

      <div v-if="showFieldSelector" class="right-tools flex gap-2">
        <Dropdown>
          <Button>
            <IconifyIcon icon="material-symbols:settings" class="size-4" />
            {{ $t('page.common.displayFields') }}
          </Button>
          <template #overlay>
            <div class="p-2 bg-white rounded shadow border min-w-[150px] max-h-[300px] overflow-y-auto">
              <Checkbox
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleAll"
              >
                {{ $t('page.common.selectAll') }}
              </Checkbox>
              <Divider style="margin: 8px 0" />
              <div v-for="field in fields" :key="field.fieldCode" class="py-1">
                <Checkbox
                  :checked="selectedFields.includes(field.fieldCode)"
                  @change="(e: any) => toggleField(field.fieldCode, e.target.checked)"
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
  Divider,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import type { LcSearchBarProps, LcSearchField } from './types';

const props = withDefaults(defineProps<LcSearchBarProps>(), {
  columns: 4,
  showFieldSelector: true,
  defaultVisibleFields: () => [],
  fields: () => [],
});

const emit = defineEmits<{
  search: [values: Record<string, any>];
  reset: [];
  'update:visibleFields': [fields: string[]];
}>();

// 表单数据
const formData = ref<Record<string, any>>({});

// 选中的字段
const selectedFields = ref<string[]>([]);

// 可见字段
const visibleFields = computed(() => {
  if (selectedFields.value.length === 0) {
    return props.fields;
  }
  return props.fields.filter((f) => selectedFields.value.includes(f.fieldCode));
});

// 是否全选
const isAllSelected = computed(() => {
  return selectedFields.value.length === props.fields.length;
});

// 半选状态
const isIndeterminate = computed(() => {
  return selectedFields.value.length > 0 && selectedFields.value.length < props.fields.length;
});

// 切换单个字段
function toggleField(fieldCode: string, checked: boolean) {
  if (checked) {
    if (!selectedFields.value.includes(fieldCode)) {
      selectedFields.value = [...selectedFields.value, fieldCode];
    }
  } else {
    selectedFields.value = selectedFields.value.filter((f) => f !== fieldCode);
  }
  emit('update:visibleFields', selectedFields.value);
}

// 切换全选
function toggleAll(e: any) {
  if (e.target.checked) {
    selectedFields.value = props.fields.map((f) => f.fieldCode);
  } else {
    selectedFields.value = [];
  }
  emit('update:visibleFields', selectedFields.value);
}

// 查询
function handleSearch() {
  const values: Record<string, any> = {};
  Object.keys(formData.value).forEach((key) => {
    const val = formData.value[key];
    if (val !== undefined && val !== null && val !== '') {
      values[key] = val;
    }
  });
  emit('search', values);
}

// 重置
function handleReset() {
  formData.value = {};
  emit('reset');
  emit('search', {});
}

// 获取表单值
function getValues() {
  const values: Record<string, any> = {};
  Object.keys(formData.value).forEach((key) => {
    const val = formData.value[key];
    if (val !== undefined && val !== null && val !== '') {
      values[key] = val;
    }
  });
  return values;
}

// 设置表单值
function setValues(values: Record<string, any>) {
  formData.value = { ...values };
}

// 初始化
onMounted(() => {
  // 初始化 formData
  props.fields.forEach((field) => {
    if (formData.value[field.fieldCode] === undefined) {
      formData.value[field.fieldCode] = field.defaultValue ?? '';
    }
  });

  // 设置默认显示的字段
  if (props.defaultVisibleFields.length > 0) {
    selectedFields.value = [...props.defaultVisibleFields];
  } else {
    selectedFields.value = props.fields.map((f) => f.fieldCode);
  }
});

// 暴露方法
defineExpose({
  getValues,
  setValues,
  reset: handleReset,
  search: handleSearch,
});
</script>

<style scoped>
.lc-search-bar-container {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.lc-search-bar :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.lc-search-bar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
</style>
