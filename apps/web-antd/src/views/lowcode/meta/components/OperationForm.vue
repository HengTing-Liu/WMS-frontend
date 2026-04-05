<template>
  <Form :model="form" :rules="rules" layout="vertical">
    <Row :gutter="16">
      <Col :span="12">
        <FormItem label="所属表" name="tableCode">
          <Select v-model:value="form.tableCode" placeholder="请选择表">
            <SelectOption value="wms_warehouse">仓库档案</SelectOption>
            <SelectOption value="wms_location">库位管理</SelectOption>
            <SelectOption value="base_material">物料档案</SelectOption>
          </Select>
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem label="操作标识" name="operationCode">
          <Input
            v-model:value="form.operationCode"
            placeholder="如：add/edit/delete"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="12">
        <FormItem label="$t('page.lowcode.meta.operationName')" name="operationName">
          <Input
            v-model:value="form.operationName"
            placeholder="如：新增/编辑/删除"
            allow-clear
          />
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem label="$t('page.lowcode.meta.operationType')" name="operationType">
          <Select v-model:value="form.operationType" placeholder="请选择$t('page.lowcode.meta.operationType')">
            <SelectOption
              v-for="item in OPERATION_TYPES"
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
        <FormItem :label="$t('page.lowcode.meta.buttonStyle')" name="buttonType">
          <Select v-model:value="form.buttonType" :placeholder="$t('page.lowcode.meta.selectButtonStyle')">
            <SelectOption
              v-for="item in BUTTON_TYPES"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </SelectOption>
          </Select>
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem label="图标" name="icon">
          <Input
            v-model:value="form.icon"
            placeholder="如：plus/edit/delete"
            allow-clear
          >
            <template #prefix>
              <IconifyIcon icon="material-symbols:settings" class="size-4" />
            </template>
          </Input>
        </FormItem>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="12">
        <FormItem label="权限标识" name="permission">
          <Input
            v-model:value="form.permission"
            placeholder="如：wms:warehouse:add"
            allow-clear
          />
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem label="位置" name="position">
          <Select v-model:value="form.position" placeholder="请选择位置">
            <SelectOption
              v-for="item in POSITION_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </SelectOption>
          </Select>
        </FormItem>
      </Col>
    </Row>

    <FormItem label="排序号" name="sortOrder">
      <InputNumber
        v-model:value="form.sortOrder"
        :min="0"
        style="width: 100%"
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
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import { BUTTON_TYPES, OPERATION_TYPES, POSITION_OPTIONS } from '../constants/meta';
import type { TableOperation } from '../types/meta';

interface Props {
  modelValue?: Partial<TableOperation>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
});

const emit = defineEmits<{
  'update:modelValue': [value: Partial<TableOperation>];
}>();

// 表单数据
const form = reactive<Partial<TableOperation>>({
  tableCode: '',
  operationCode: '',
  operationName: '',
  operationType: 'button',
  buttonType: 'default',
  icon: '',
  permission: '',
  position: 'toolbar',
  sortOrder: 0,
  ...props.modelValue,
});

// 表单校验规则
const rules = {
  tableCode: [{ required: true, message: () => $t('page.lowcode.meta.selectTable'), trigger: 'change' }],
  operationCode: [{ required: true, message: () => $t('page.lowcode.meta.inputOperationCode'), trigger: 'blur' }],
  operationName: [{ required: true, message: () => $t('page.lowcode.meta.inputOperationName'), trigger: 'blur' }],
  operationType: [{ required: true, message: () => $t('page.lowcode.meta.selectOperationType'), trigger: 'change' }],
  position: [{ required: true, message: () => $t('page.lowcode.meta.selectPosition'), trigger: 'change' }],
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
