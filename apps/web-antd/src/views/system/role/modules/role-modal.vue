<template>
  <Modal
    :title="isEdit ? $t('page.system.role.editTitle') : $t('page.system.role.addTitle')"
    v-model:open="visible"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="700px"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 18 }"
    >
      <FormItem :label="$t('page.system.role.roleName')" name="roleName">
        <Input v-model:value="formData.roleName" :placeholder="$t('page.system.role.roleNamePlaceholder')" />
      </FormItem>

      <FormItem :label="$t('page.system.role.roleKey')" name="roleKey">
        <Input v-model:value="formData.roleKey" :placeholder="$t('page.system.role.roleKeyPlaceholder')" :disabled="isEdit" />
      </FormItem>

      <FormItem :label="$t('page.system.role.roleSort')" name="roleSort">
        <InputNumber v-model:value="formData.roleSort" :min="0" style="width: 100%" />
      </FormItem>

      <!-- 数据权限 -->
      <FormItem :label="$t('page.system.role.dataScope')" name="dataScope">
        <Select v-model:value="formData.dataScope" @change="handleDataScopeChange" :placeholder="$t('page.system.role.dataScopePlaceholder')">
          <SelectOption value="1">{{ $t('page.system.role.dataScope1') }}</SelectOption>
          <SelectOption value="2">{{ $t('page.system.role.dataScope2') }}</SelectOption>
          <SelectOption value="3">{{ $t('page.system.role.dataScope3') }}</SelectOption>
          <SelectOption value="4">{{ $t('page.system.role.dataScope4') }}</SelectOption>
          <SelectOption value="5">{{ $t('page.system.role.dataScope5') }}</SelectOption>
        </Select>
      </FormItem>

      <!-- 自定义数据权限 - 部门选择 -->
      <FormItem v-if="formData.dataScope === '2'" :label="$t('page.system.role.dataScopeDepts')" name="deptIds">
        <Tree
          v-model:checked-keys="formData.deptIds"
          :tree-data="deptTreeData"
          :checkable="true"
          :check-strictly="false"
          :default-expand-all="true"
          :field-names="{ title: 'label', key: 'id', children: 'children' }"
          :height="250"
          :selectable="false"
        />
      </FormItem>

      <FormItem :label="$t('page.system.role.status')" name="status">
        <RadioGroup v-model:value="formData.status">
          <Radio value="0">{{ $t('page.common.enabled') }}</Radio>
          <Radio value="1">{{ $t('page.common.disabled') }}</Radio>
        </RadioGroup>
      </FormItem>

      <FormItem :label="$t('page.common.remark')" name="remarks">
        <Textarea v-model:value="formData.remarks" :rows="3" />
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
  Select,
  SelectOption,
  RadioGroup,
  Radio,
  Textarea,
  Tree,
  message,
} from 'ant-design-vue';
import { $t } from '@vben/locales';
import { addRole, editRole, getRoleById, getDeptTree } from '#/api';

const visible = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const formRef = ref();
const deptTreeData = ref<any[]>([]);

const formData = reactive({
  roleId: undefined as number | undefined,
  roleName: '',
  roleKey: '',
  roleSort: 0,
  dataScope: '1',
  deptIds: [] as number[],
  status: '0',
  remarks: '',
});

const rules = computed(() => ({
  roleName: [{ required: true, message: $t('page.system.role.roleNameRequired'), trigger: 'blur' }],
  roleKey: [{ required: true, message: $t('page.system.role.roleKeyRequired'), trigger: 'blur' }],
  roleSort: [{ required: true, message: $t('page.system.role.roleSortRequired'), trigger: 'blur' }],
  deptIds: formData.dataScope === '2' ? [{ required: true, message: $t('page.system.role.deptIdsRequired'), trigger: 'change', type: 'array' as const }] : [],
}));

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 加载部门树
const loadDeptTree = async () => {
  try {
    const res = await getDeptTree();
    deptTreeData.value = res || [];
  } catch (error) {
    console.error($t('page.common.loadDeptTreeFail'), error);
  }
};

// 数据权限变化时
const handleDataScopeChange = (value: any) => {
  if (value !== '2') {
    // 如果不是自定义权限，清空部门选择
    formData.deptIds = [];
  }
};

const open = async (row?: any) => {
  visible.value = true;
  isEdit.value = !!row?.roleId;
  
  // 重置表单
  Object.assign(formData, {
    roleId: undefined,
    roleName: '',
    roleKey: '',
    roleSort: 0,
    dataScope: '1',
    deptIds: [],
    status: '0',
    remarks: '',
  });

  // 加载部门树
  await loadDeptTree();

  if (isEdit.value && row?.roleId) {
    try {
      loading.value = true;
      const res = await getRoleById(row.roleId);
      if (res) {
        Object.assign(formData, {
          roleId: res.roleId,
          roleName: res.roleName,
          roleKey: res.roleKey,
          roleSort: res.roleSort || 0,
          dataScope: res.dataScope || '1',
          deptIds: res.deptIds || [],
          status: res.status || '0',
          remarks: res.remarks || '',
        });
      }
    } catch (error) {
      message.error($t('page.message.loadFail'));
    } finally {
      loading.value = false;
    }
  }

  setTimeout(() => {
    formRef.value?.clearValidate();
  }, 0);
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    // 构造提交数据
    const submitData = {
      ...formData,
      // 如果不是自定义权限，清空部门ID
      deptIds: formData.dataScope === '2' ? formData.deptIds : [],
    };

    if (isEdit.value) {
      await editRole(submitData);
      message.success($t('page.message.editSuccess'));
    } else {
      await addRole(submitData);
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
