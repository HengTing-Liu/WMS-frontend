<template>
  <Modal
    :title="isEdit ? $t('page.system.dept.editTitle') : $t('page.system.dept.addTitle')"
    v-model:open="visible"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="600px"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 18 }"
    >
      <!-- 上级部门 -->
      <FormItem :label="$t('page.system.dept.parentDept')" name="parentId">
        <TreeSelect
          v-model:value="formData.parentId"
          :tree-data="deptTreeSelectData"
          :field-names="{ label: 'deptName', value: 'deptId', children: 'children' }"
          :placeholder="$t('page.system.dept.parentDeptPlaceholder')"
          allow-clear
          tree-default-expand-all
          style="width: 100%"
        />
      </FormItem>

      <!-- 部门名称 -->
      <FormItem :label="$t('page.system.dept.deptName')" name="deptName">
        <Input
          v-model:value="formData.deptName"
          :placeholder="$t('page.system.dept.deptNamePlaceholder')"
          :max-length="30"
          show-count
        />
      </FormItem>

      <!-- 显示排序 -->
      <FormItem :label="$t('page.system.dept.orderNum')" name="orderNum">
        <InputNumber v-model:value="formData.orderNum" :min="0" :max="9999" style="width: 100%" />
      </FormItem>

      <!-- 负责人 -->
      <FormItem :label="$t('page.system.dept.leader')" name="leader">
        <Input v-model:value="formData.leader" :placeholder="$t('page.system.dept.leaderPlaceholder')" />
      </FormItem>

      <!-- 联系电话 -->
      <FormItem :label="$t('page.system.dept.phone')" name="phone">
        <Input v-model:value="formData.phone" :placeholder="$t('page.system.dept.phonePlaceholder')" />
      </FormItem>

      <!-- 邮箱 -->
      <FormItem :label="$t('page.system.dept.email')" name="email">
        <Input v-model:value="formData.email" :placeholder="$t('page.system.dept.emailPlaceholder')" />
      </FormItem>

      <!-- 部门状态 -->
      <FormItem :label="$t('page.common.status')" name="status">
        <RadioGroup v-model:value="formData.status">
          <Radio value="0">{{ $t('page.common.enabled') }}</Radio>
          <Radio value="1">{{ $t('page.common.disabled') }}</Radio>
        </RadioGroup>
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import {
  Modal,
  Form,
  FormItem,
  Input,
  InputNumber,
  RadioGroup,
  Radio,
  TreeSelect,
  message,
} from 'ant-design-vue';
import { $t } from '@vben/locales';
import { addDept, editDept, getDeptById } from '#/api';

interface Props {
  deptTree: any[];
}

const props = defineProps<Props>();

const visible = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const formRef = ref();

const formData = reactive({
  deptId: undefined as number | undefined,
  parentId: 0,
  deptName: '',
  orderNum: 0,
  leader: '',
  phone: '',
  email: '',
  status: '0',
});

// 转换树数据，添加根节点选项
const deptTreeSelectData = computed(() => {
  return [
    { deptId: 0, deptName: $t('page.system.dept.root'), children: props.deptTree },
  ];
});

const rules = computed(() => ({
  deptName: [
    { required: true, message: $t('page.system.dept.deptNameRequired'), trigger: 'blur' },
    { min: 1, max: 30, message: $t('page.system.dept.deptNameLength'), trigger: 'blur' },
  ],
  orderNum: [{ required: true, message: $t('page.system.dept.orderNumRequired'), trigger: 'blur' }],
  email: [
    { type: 'email' as const, message: $t('page.system.dept.emailFormat'), trigger: 'blur' },
  ],
}));

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const open = async (row?: any) => {
  visible.value = true;
  isEdit.value = !!row?.deptId;

  // 重置表单
  Object.assign(formData, {
    deptId: undefined,
    parentId: 0,
    deptName: '',
    orderNum: 0,
    leader: '',
    phone: '',
    email: '',
    status: '0',
  });

  if (isEdit.value && row?.deptId) {
    try {
      loading.value = true;
      const res = await getDeptById(row.deptId);
      if (res?.data) {
        Object.assign(formData, {
          deptId: res.data.deptId,
          parentId: res.data.parentId || 0,
          deptName: res.data.deptName,
          orderNum: res.data.orderNum || 0,
          leader: res.data.leader || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          status: res.data.status || '0',
        });
      }
    } catch (error) {
      message.error($t('page.message.loadFail'));
    } finally {
      loading.value = false;
    }
  } else if (row?.parentId !== undefined) {
    // 新增子部门
    formData.parentId = row.parentId;
  }

  setTimeout(() => {
    formRef.value?.clearValidate();
  }, 0);
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    if (isEdit.value) {
      await editDept(formData);
      message.success($t('page.message.editSuccess'));
    } else {
      await addDept(formData);
      message.success($t('page.message.addSuccess'));
    }

    visible.value = false;
    emit('success');
  } catch (error: any) {
    if (error?.errorFields) return;
    message.error(isEdit.value ? $t('page.message.editFail') : $t('page.message.addFail'));
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  formRef.value?.resetFields();
};

defineExpose({ open });
</script>
