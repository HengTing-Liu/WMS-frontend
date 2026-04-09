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

    <Row :gutter="16">
      <Col :span="8">
        <FormItem :label="$t('page.lowcode.meta.colSpan')" name="colSpan">
          <InputNumber
            v-model:value="form.colSpan"
            :min="1"
            :max="24"
            style="width: 100%"
          />
        </FormItem>
      </Col>
      <Col :span="8">
        <FormItem :label="$t('page.lowcode.meta.sectionKey')" name="sectionKey">
          <Input
            v-model:value="form.sectionKey"
            :placeholder="$t('page.lowcode.meta.sectionKeyPlaceholder')"
            allow-clear
          />
        </FormItem>
      </Col>
      <Col :span="8">
        <FormItem :label="$t('page.lowcode.meta.i18nKey')" name="i18nKey">
          <Input
            v-model:value="form.i18nKey"
            :placeholder="$t('page.lowcode.meta.i18nKeyPlaceholder')"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>

    <FormItem :label="$t('page.lowcode.meta.visibleCondition')" name="visibleCondition">
      <Textarea
        v-model:value="form.visibleCondition"
        :rows="2"
        :placeholder="$t('page.lowcode.meta.visibleConditionPlaceholder')"
        allow-clear
      />
    </FormItem>

    <Divider orientation="left">{{ $t('page.lowcode.meta.dataSourceConfig') }}</Divider>

    <Row :gutter="16">
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.dataSource')" name="dataSource">
          <Select v-model:value="form.dataSource" :placeholder="$t('page.lowcode.meta.selectDataSource')">
            <SelectOption value="dict">{{ $t('page.lowcode.meta.dict') }}</SelectOption>
            <SelectOption value="api">{{ $t('page.lowcode.meta.api') }}</SelectOption>
            <SelectOption value="static">{{ $t('page.lowcode.meta.static') }}</SelectOption>
          </Select>
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.apiUrl')" name="apiUrl">
          <Input
            v-model:value="form.apiUrl"
            :placeholder="$t('page.lowcode.meta.apiUrlPlaceholder')"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.labelField')" name="labelField">
          <Input
            v-model:value="form.labelField"
            :placeholder="$t('page.lowcode.meta.labelFieldPlaceholder')"
            allow-clear
          />
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.valueField')" name="valueField">
          <Input
            v-model:value="form.valueField"
            :placeholder="$t('page.lowcode.meta.valueFieldPlaceholder')"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>

    <FormItem :label="$t('page.common.remark')" name="remark">
      <Textarea
        v-model:value="form.remark"
        :rows="2"
        :placeholder="$t('page.common.inputRemark')"
        allow-clear
      />
    </FormItem>

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
  // 补全的字段
  colSpan: 24,
  sectionKey: '',
  i18nKey: '',
  visibleCondition: '',
  dataSource: '',
  apiUrl: '',
  labelField: '',
  valueField: '',
  remark: '',
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
