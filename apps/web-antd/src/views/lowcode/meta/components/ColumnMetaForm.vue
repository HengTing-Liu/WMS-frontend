<template>
  <Form :model="form" :rules="rules" layout="vertical">
    <Row :gutter="16">
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.selectTable')" name="tableCode">
          <Select v-model:value="form.tableCode" :placeholder="$t('page.lowcode.meta.selectTable')">
            <SelectOption value="wms_warehouse">{{ $t('page.lowcode.meta.warehouse') }}</SelectOption>
            <SelectOption value="wms_location">{{ $t('page.lowcode.meta.locationManagement') }}</SelectOption>
            <SelectOption value="base_material">{{ $t('page.lowcode.meta.material') }}</SelectOption>
          </Select>
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.fieldName')" name="field">
          <Input
            v-model:value="form.field"
            :placeholder="$t('page.lowcode.meta.inputFieldNameExample')"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.displayName')" name="title">
          <Input
            v-model:value="form.title"
            :placeholder="$t('page.lowcode.meta.inputDisplayNameExample')"
            allow-clear
          />
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.dataType')" name="dataType">
          <Select v-model:value="form.dataType" :placeholder="$t('page.lowcode.meta.selectDataType')">
            <SelectOption
              v-for="item in DATA_TYPES"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </SelectOption>
          </Select>
        </FormItem>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.formType')" name="formType">
          <Select v-model:value="form.formType" :placeholder="$t('page.lowcode.meta.selectFormType')">
            <SelectOption
              v-for="item in FORM_TYPES"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </SelectOption>
          </Select>
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.dictType')" name="dictType">
          <Input
            v-model:value="form.dictType"
            :placeholder="$t('page.lowcode.meta.inputDictTypePlaceholder')"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>

    <Divider orientation="left">{{ $t('page.lowcode.meta.displayConfig') }}</Divider>

    <Row :gutter="16">
      <Col :span="8">
        <FormItem :label="$t('page.lowcode.meta.showInList')">
          <Switch v-model:checked="form.isShowInList" />
        </FormItem>
      </Col>
      <Col :span="8">
        <FormItem :label="$t('page.lowcode.meta.showInForm')">
          <Switch v-model:checked="form.isShowInForm" />
        </FormItem>
      </Col>
      <Col :span="8">
        <FormItem :label="$t('page.lowcode.meta.searchable')">
          <Switch v-model:checked="form.isSearchable" />
        </FormItem>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="8">
        <FormItem :label="$t('page.lowcode.meta.sortable')">
          <Switch v-model:checked="form.isSortable" />
        </FormItem>
      </Col>
      <Col :span="8">
        <FormItem :label="$t('page.lowcode.meta.required')">
          <Switch v-model:checked="form.isRequired" />
        </FormItem>
      </Col>
      <Col :span="8">
        <FormItem :label="$t('page.lowcode.meta.colWidth')" name="width">
          <InputNumber
            v-model:value="form.width"
            :min="50"
            :max="500"
            style="width: 100%"
          />
        </FormItem>
      </Col>
    </Row>

    <FormItem :label="$t('page.lowcode.meta.sortNo')" name="sortOrder">
      <InputNumber
        v-model:value="form.sortOrder"
        :min="0"
        style="width: 100%"
      />
    </FormItem>

    <Divider orientation="left">{{ $t('page.lowcode.meta.advancedConfig') }}</Divider>

    <Row :gutter="16">
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.placeholder')" name="placeholder">
          <Input
            v-model:value="form.placeholder"
            :placeholder="$t('page.lowcode.meta.inputPlaceholder')"
            allow-clear
          />
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.defaultValue')" name="defaultValue">
          <Input
            v-model:value="form.defaultValue"
            :placeholder="$t('page.lowcode.meta.inputDefaultValue')"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>

    <FormItem :label="$t('page.lowcode.meta.linkageConfig')" name="linkageJson">
      <Textarea
        v-model:value="form.linkageJson"
        :rows="3"
        :placeholder="$t('page.lowcode.meta.linkageJsonExample')"
        allow-clear
      />
    </FormItem>

    <FormItem :label="$t('page.lowcode.meta.validationRules')" name="rulesJson">
      <Textarea
        v-model:value="form.rulesJson"
        :rows="3"
        :placeholder="$t('page.lowcode.meta.validationRulesExample')"
        allow-clear
      />
    </FormItem>
  </Form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import {
  Col,
  Divider,
  Form,
  FormItem,
  Input,
  InputNumber,
  Row,
  Select,
  SelectOption,
  Switch,
  Textarea,
} from 'ant-design-vue';

import { DATA_TYPES, FORM_TYPES } from '../constants/meta';
import type { ColumnMeta } from '../types/meta';

interface Props {
  modelValue?: Partial<ColumnMeta>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
});

const emit = defineEmits<{
  'update:modelValue': [value: Partial<ColumnMeta>];
}>();

// 表单数据
const form = reactive<Partial<ColumnMeta>>({
  tableCode: '',
  field: '',
  title: '',
  dataType: 'string',
  formType: 'input',
  dictType: '',
  linkageJson: '',
  isShowInList: true,
  isShowInForm: true,
  isSearchable: false,
  isSortable: false,
  isRequired: false,
  width: 120,
  sortOrder: 0,
  rulesJson: '',
  placeholder: '',
  defaultValue: '',
  ...props.modelValue,
});

// 表单校验规则
const rules = {
  tableCode: [{ required: true, message: () => $t('page.lowcode.meta.selectTable'), trigger: 'change' }],
  field: [{ required: true, message: () => $t('page.lowcode.meta.inputFieldName'), trigger: 'blur' }],
  title: [{ required: true, message: () => $t('page.lowcode.meta.inputDisplayName'), trigger: 'blur' }],
  dataType: [{ required: true, message: () => $t('page.lowcode.meta.selectDataType'), trigger: 'change' }],
  formType: [{ required: true, message: () => $t('page.lowcode.meta.selectFormType'), trigger: 'change' }],
};

// 监听props变化
watch(
  () => props.modelValue,
  (val) => {
    Object.assign(form, val);
  },
  { deep: true }
);

// 监听表单变化
watch(
  form,
  (val) => {
    emit('update:modelValue', val);
  },
  { deep: true }
);
</script>
