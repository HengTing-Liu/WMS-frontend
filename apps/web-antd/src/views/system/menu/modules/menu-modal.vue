<template>
  <Modal
    :title="isEdit ? $t('page.system.menu.editTitle') : $t('page.system.menu.addTitle')"
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
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
    >
      <!-- 菜单类型 -->
      <FormItem :label="$t('page.system.menu.menuType')" name="menuType">
        <RadioGroup v-model:value="formData.menuType" @change="handleTypeChange">
          <Radio value="M">{{ $t('page.system.menu.typeDirectory') }}</Radio>
          <Radio value="C">{{ $t('page.system.menu.typeMenu') }}</Radio>
          <Radio value="F">{{ $t('page.system.menu.typeButton') }}</Radio>
        </RadioGroup>
      </FormItem>

      <!-- 上级菜单 -->
      <FormItem :label="$t('page.system.menu.parentMenu')" name="parentId">
        <TreeSelect
          v-model:value="formData.parentId"
          :tree-data="menuTreeSelectData"
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
      <FormItem :label="$t('page.system.menu.orderNum')" name="orderNum">
        <InputNumber v-model:value="formData.orderNum" :min="0" :max="9999" style="width: 100%" />
      </FormItem>

      <!-- 路由地址（目录/菜单）-->
      <FormItem v-if="formData.menuType !== 'F'" :label="$t('page.system.menu.path')" name="path">
        <Input
          v-model:value="formData.path"
          :placeholder="$t('page.system.menu.pathPlaceholder')"
          :max-length="200"
          show-count
        />
      </FormItem>

      <!-- 组件路径（菜单）-->
      <FormItem v-if="formData.menuType === 'C'" :label="$t('page.system.menu.component')" name="component">
        <Input
          v-model:value="formData.component"
          :placeholder="$t('page.system.menu.componentPlaceholder')"
          :max-length="200"
          show-count
        />
      </FormItem>

      <!-- 权限标识 -->
      <FormItem v-if="formData.menuType !== 'M'" :label="$t('page.system.menu.perms')" name="perms">
        <Input
          v-model:value="formData.perms"
          :placeholder="$t('page.system.menu.permsPlaceholder')"
          :max-length="100"
          show-count
        />
      </FormItem>

      <!-- 菜单图标（目录/菜单）-->
      <FormItem v-if="formData.menuType !== 'F'" :label="$t('page.system.menu.icon')" name="icon">
        <Input
          v-model:value="formData.icon"
          :placeholder="$t('page.system.menu.iconPlaceholder')"
          :max-length="100"
          show-count
        />
      </FormItem>

      <Row :gutter="16">
        <Col :span="12">
          <!-- 是否外链 -->
          <FormItem v-if="formData.menuType !== 'F'" :label="$t('page.system.menu.isFrame')" name="isFrame">
            <RadioGroup v-model:value="formData.isFrame">
              <Radio value="0">{{ $t('page.common.yes') }}</Radio>
              <Radio value="1">{{ $t('page.common.no') }}</Radio>
            </RadioGroup>
          </FormItem>
        </Col>
        <Col :span="12">
          <!-- 是否缓存 -->
          <FormItem v-if="formData.menuType === 'C'" :label="$t('page.system.menu.isCache')" name="isCache">
            <RadioGroup v-model:value="formData.isCache">
              <Radio value="0">{{ $t('page.common.yes') }}</Radio>
              <Radio value="1">{{ $t('page.common.no') }}</Radio>
            </RadioGroup>
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <!-- 显示状态 -->
          <FormItem v-if="formData.menuType !== 'F'" :label="$t('page.system.menu.visible')" name="visible">
            <RadioGroup v-model:value="formData.visible">
              <Radio value="0">{{ $t('page.system.menu.visibleShow') }}</Radio>
              <Radio value="1">{{ $t('page.system.menu.visibleHide') }}</Radio>
            </RadioGroup>
          </FormItem>
        </Col>
        <Col :span="12">
          <!-- 菜单状态 -->
          <FormItem :label="$t('page.common.status')" name="status">
            <RadioGroup v-model:value="formData.status">
              <Radio value="0">{{ $t('page.common.enabled') }}</Radio>
              <Radio value="1">{{ $t('page.common.disabled') }}</Radio>
            </RadioGroup>
          </FormItem>
        </Col>
      </Row>

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
  Row,
  Col,
  TreeSelect,
  message,
} from 'ant-design-vue';
import { $t } from '@vben/locales';
import { addMenu, editMenu, getMenuById } from '#/api';

interface Props {
  menuTree: any[];
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
  isFrame: '1',
  isCache: '0',
  menuType: 'M',
  visible: '0',
  status: '0',
  perms: '',
  icon: '',
  remarks: '',
});

// 转换树数据，添加根节点选项
const menuTreeSelectData = computed(() => {
  return [
    { menuId: 0, menuName: $t('page.system.menu.root'), children: props.menuTree },
  ];
});

const rules = computed(() => ({
  menuName: [
    { required: true, message: $t('page.system.menu.menuNameRequired'), trigger: 'blur' },
    { min: 1, max: 50, message: $t('page.system.menu.menuNameLength'), trigger: 'blur' },
  ],
  orderNum: [{ required: true, message: $t('page.system.menu.orderNumRequired'), trigger: 'blur' }],
  path: formData.menuType !== 'F' ? [
    { required: true, message: $t('page.system.menu.pathRequired'), trigger: 'blur' },
  ] : [],
  component: formData.menuType === 'C' ? [
    { required: true, message: $t('page.system.menu.componentRequired'), trigger: 'blur' },
  ] : [],
}));

const emit = defineEmits<{
  (e: 'success'): void;
}>();

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
    isFrame: '1',
    isCache: '0',
    menuType: 'M',
    visible: '0',
    status: '0',
    perms: '',
    icon: '',
    remarks: '',
  });

  if (isEdit.value && row?.menuId) {
    try {
      loading.value = true;
      const res = await getMenuById(row.menuId);
      if (res?.data) {
        Object.assign(formData, res.data);
      }
    } catch (error) {
      message.error($t('page.message.loadFail'));
    } finally {
      loading.value = false;
    }
  } else if (row?.parentId !== undefined) {
    // 新增子菜单
    formData.parentId = row.parentId;
    formData.menuType = 'C';
  }

  setTimeout(() => {
    formRef.value?.clearValidate();
  }, 0);
};

const handleTypeChange = () => {
  // 切换类型时重置一些字段
  if (formData.menuType === 'F') {
    formData.icon = '';
    formData.isFrame = '1';
  }
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (isEdit.value) {
      await editMenu(formData);
      message.success($t('page.message.editSuccess'));
    } else {
      await addMenu(formData);
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
