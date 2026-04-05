<template>
  <Form :model="form" :rules="rules" layout="vertical">
    <Row :gutter="16">
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.tableCode')" name="tableCode">
          <Input
            v-model:value="form.tableCode"
            :placeholder="$t('page.lowcode.meta.tableCodeExample')"
            allow-clear
          />
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem label="$t('page.lowcode.meta.tableName')" name="tableName">
          <Input
            v-model:value="form.tableName"
            :placeholder="$t('page.lowcode.meta.tableNameExample')"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="12">
        <FormItem label="$t('page.lowcode.meta.module')" name="module">
          <Select v-model:value="form.module" :placeholder="$t('page.common.pleaseSelect')">
            <SelectOption
              v-for="item in MODULE_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </SelectOption>
          </Select>
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.permissionCode')" name="permissionCode">
          <Input
            v-model:value="form.permissionCode"
            :placeholder="$t('page.lowcode.meta.permissionCodeExample')"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.entityClassPath')" name="entityClass">
          <Input
            v-model:value="form.entityClass"
            :placeholder="$t('page.lowcode.meta.entityClassExample')"
            allow-clear
          />
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.serviceClassPath')" name="serviceClass">
          <Input
            v-model:value="form.serviceClass"
            :placeholder="$t('page.lowcode.meta.serviceClassExample')"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="12">
        <FormItem :label="$t('page.lowcode.meta.defaultPageSize')" name="pageSize">
          <InputNumber
            v-model:value="form.pageSize"
            :min="10"
            :max="100"
            style="width: 100%"
          />
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem label="$t('page.common.status')" name="status">
          <Switch
            v-model:checked="form.status"
            :checkedValue="1"
            :unCheckedValue="0"
            checked-children="$t('page.common.enabled')"
            un-checked-children="$t('page.common.disabled')"
          />
        </FormItem>
      </Col>
    </Row>

    <FormItem :label="'是否' + $t('page.common.treeTable')" name="isTree">
      <Switch v-model:checked="form.isTree" />
    </FormItem>

    <FormItem label="$t('page.common.remark')" name="remark">
      <Textarea
        v-model:value="form.remark"
        :rows="3"
        :placeholder="$t('page.common.inputPlaceholder')"
        allow-clear
      />
    </FormItem>
  </Form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import {
  Col,
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

import { MODULE_OPTIONS } from '../constants/meta';
import type { TableMeta } from '../types/meta';

interface Props {
  modelValue?: Partial<TableMeta>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
});

const emit = defineEmits<{
  'update:modelValue': [value: Partial<TableMeta>];
}>();

// 表单数据
const form = reactive<Partial<TableMeta>>({
  tableCode: '',
  tableName: '',
  module: 'base',
  entityClass: '',
  serviceClass: '',
  permissionCode: '',
  pageSize: 20,
  isTree: false,
  status: 1,
  remark: '',
  ...props.modelValue,
});

// 表单校验规则
const rules = {
  tableCode: [{ required: true, message: () => $t('page.lowcode.meta.inputTableCode'), trigger: 'blur' }],
  tableName: [{ required: true, message: () => $t('page.lowcode.meta.inputTableName'), trigger: 'blur' }],
  module: [{ required: true, message: () => $t('page.lowcode.meta.selectModule'), trigger: 'change' }],
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
