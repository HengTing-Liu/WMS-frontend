<template>
  <Modal
    :title="isEdit ? $t('page.common.edit') : $t('page.common.add')"
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
      <!-- 菜单类型 -->
      <FormItem :label="$t('page.system.permission.permissionType')" name="menuType">
        <RadioGroup v-model:value="formData.menuType" @change="handleTypeChange">
          <Radio value="C">{{ $t('page.system.permission.typeCatalog') }}</Radio>
          <Radio value="M">{{ $t('page.system.permission.typeMenu') }}</Radio>
          <Radio value="F">{{ $t('page.system.permission.typeButton') }}</Radio>
        </RadioGroup>
      </FormItem>

      <!-- 上级菜单 -->
      <FormItem :label="$t('page.system.menu.parentMenu')" name="parentId">
        <TreeSelect
          v-model:value="formData.parentId"
          :tree-data="permissionTreeSelectData"
          :field-names="{ label: 'menuName', value: 'menuId', children: 'children' }"
          :placeholder="$t('page.system.menu.parentMenuPlaceholder')"
          allow-clear
          tree-default-expand-all
          style="width: 100%"
        />
      </FormItem>

      <!-- 菜单名称 -->
      <FormItem :label="$t('page.system.menu.menuName')" name="menuName">
        <Input
          v-model:value="formData.menuName"
          :placeholder="$t('page.system.menu.menuNamePlaceholder')"
          :max-length="50"
          show-count
        />
      </FormItem>

      <!-- 显示排序 -->
      <FormItem :label="$t('page.system.dept.orderNum')" name="orderNum">
        <InputNumber v-model:value="formData.orderNum" :min="0" :max="9999" style="width: 100%" />
      </FormItem>

      <!-- 路由地址（菜单）-->
      <FormItem v-if="formData.menuType === 'M'" :label="$t('page.system.menu.path')" name="path">
        <Input
          v-model:value="formData.path"
          :placeholder="$t('page.system.menu.pathPlaceholder')"
          :max-length="200"
          show-count
        />
      </FormItem>

      <!-- 组件路径（菜单）-->
      <FormItem v-if="formData.menuType === 'M'" :label="$t('page.system.menu.component')" name="component">
        <Input
          v-model:value="formData.component"
          :placeholder="$t('page.system.menu.componentPlaceholder')"
          :max-length="200"
          show-count
        />
      </FormItem>

      <!-- 权限码（按钮）-->
      <FormItem v-if="formData.menuType === 'F'" :label="$t('page.system.permission.perms')" name="perms">
        <Input
          v-model:value="formData.perms"
          :placeholder="$t('page.system.permission.permsPlaceholder')"
          :max-length="100"
          show-count
        />
      </FormItem>

      <!-- 菜单图标（菜单）-->
      <FormItem v-if="formData.menuType === 'M'" :label="$t('page.system.menu.icon')" name="icon">
        <Input
          v-model:value="formData.icon"
          :placeholder="$t('page.system.menu.iconPlaceholder')"
          :max-length="100"
          show-count
        />
      </FormItem>

      <!-- 状态 -->
      <FormItem :label="$t('page.common.status')" name="isEnabled">
        <RadioGroup v-model:value="formData.isEnabled">
          <Radio :value="1">{{ $t('page.common.enabled') }}</Radio>
          <Radio :value="0">{{ $t('page.common.disabled') }}</Radio>
        </RadioGroup>
      </FormItem>

      <!-- 备注 -->
      <FormItem :label="$t('page.common.remark')" name="remarks">
        <Textarea v-model:value="formData.remarks" :rows="3" :max-length="500" show-count />
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
  Textarea,
  TreeSelect,
  message,
} from 'ant-design-vue';
import { $t } from '@vben/locales';
import { addPermission, updatePermission, getPermissionById } from '#/api/sys/permission';

interface Props {
  permissionTree: any[];
}

const props = defineProps<Props>();

const visible = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const formRef = ref();

const formData = reactive({
  menuId: undefined as number | undefined,
  menuName: '',
  parentId: 0,
  orderNum: 0,
  path: '',
  component: '',
  menuType: 'C',
  perms: '',
  icon: '',
  isEnabled: 1,
  remarks: '',
});

// 转换树数据，添加根节点选项
const permissionTreeSelectData = computed(() => {
  return [
    { menuId: 0, menuName: $t('page.system.menu.root'), children: props.permissionTree || [] },
  ];
});

const rules = computed(() => ({
  menuName: [
    { required: true, message: $t('page.system.menu.menuNameRequired'), trigger: 'blur' },
    { min: 1, max: 50, message: $t('page.system.menu.menuNameLength'), trigger: 'blur' },
  ],
  orderNum: [{ required: true, message: $t('page.system.menu.orderNumRequired'), trigger: 'blur' }],
  path:
    formData.menuType === 'M'
      ? [{ required: true, message: $t('page.system.menu.pathRequired'), trigger: 'blur' }]
      : [],
  component:
    formData.menuType === 'M'
      ? [{ required: true, message: $t('page.system.menu.componentRequired'), trigger: 'blur' }]
      : [],
  perms:
    formData.menuType === 'F'
      ? [{ required: true, message: $t('page.system.permission.permsRequired'), trigger: 'blur' }]
      : [],
}));

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const handleTypeChange = () => {
  if (formData.menuType === 'F') {
    formData.icon = '';
  }
};

const open = async (row?: any) => {
  visible.value = true;
  isEdit.value = !!row?.menuId;

  // 重置表单
  Object.assign(formData, {
    menuId: undefined,
    menuName: '',
    parentId: 0,
    orderNum: 0,
    path: '',
    component: '',
    menuType: 'C',
    perms: '',
    icon: '',
    isEnabled: 1,
    remarks: '',
  });

  if (isEdit.value && row?.menuId) {
    try {
      loading.value = true;
      const res = await getPermissionById(row.menuId);
      if (res?.data) {
        Object.assign(formData, res.data);
      } else if (res) {
        Object.assign(formData, res);
      }
    } catch (error) {
      message.error($t('page.message.loadFail'));
    } finally {
      loading.value = false;
    }
  } else if (row?.parentId !== undefined) {
    // 新增子菜单
    formData.parentId = row.parentId;
    formData.menuType = row.menuType || 'M';
  }

  setTimeout(() => {
    formRef.value?.clearValidate();
  }, 0);
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (isEdit.value) {
      await updatePermission(formData);
      message.success($t('page.message.editSuccess'));
    } else {
      await addPermission(formData);
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
