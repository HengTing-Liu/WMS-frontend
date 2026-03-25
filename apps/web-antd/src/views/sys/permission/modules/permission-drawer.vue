<template>
  <Drawer
    :title="isEdit ? $t('page.common.edit') : $t('page.common.add')"
    v-model:open="visible"
    width="500px"
    :body-style="{ padding: '24px' }"
    @close="handleClose"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      layout="vertical"
      class="permission-form"
    >
      <!-- C类/M类/F类通用：菜单名称（低代码配置驱动） -->
      <FormItem :label="$t('page.system.menu.menuName')" name="menuName">
        <Input v-model:value="formData.menuName" :placeholder="$t('page.system.menu.menuNamePlaceholder')" />
      </FormItem>

      <!-- C类：上级菜单（可选，顶级不选） -->
      <FormItem v-if="formData.menuType === 'C' && !isEdit" :label="$t('page.system.menu.parentMenu')" name="parentId">
        <TreeSelect
          v-model:value="formData.parentId"
          :tree-data="menuTreeData"
          :field-names="{ label: 'menuName', value: 'menuId', children: 'children' }"
          :placeholder="$t('page.system.menu.parentMenuPlaceholder')"
          allow-clear
          tree-default-expand-all
        />
      </FormItem>

      <!-- M类：路由地址（低代码配置驱动） -->
      <FormItem v-if="formData.menuType === 'M'" :label="$t('page.system.menu.path')" name="path">
        <Input v-model:value="formData.path" placeholder="/xxx/yyy" />
      </FormItem>

      <!-- M类：组件路径（低代码配置驱动） -->
      <FormItem v-if="formData.menuType === 'M'" :label="$t('page.system.menu.component')" name="component">
        <Input v-model:value="formData.component" placeholder="@/views/xxx/index.vue" />
      </FormItem>

      <!-- M类：图标（低代码配置驱动） -->
      <FormItem v-if="formData.menuType === 'M'" :label="$t('page.system.menu.icon')" name="icon">
        <Input v-model:value="formData.icon" placeholder="material-symbols:settings" />
      </FormItem>

      <!-- F类：权限码（低代码配置驱动） -->
      <FormItem v-if="formData.menuType === 'F'" :label="$t('page.system.permission.perms')" name="perms">
        <Input v-model:value="formData.perms" placeholder="wms:base:user:add" />
      </FormItem>

      <!-- C类/M类/F类通用：排序号（低代码配置驱动） -->
      <FormItem :label="$t('page.system.dept.orderNum')" name="orderNum">
        <InputNumber v-model:value="formData.orderNum" :min="0" style="width: 100%" />
      </FormItem>

      <!-- 低代码扩展字段区域（可选，通过meta配置控制显示） -->
      <template v-if="metaMap?.entityName">
        <Divider />
        <FormItem :label="$t('page.system.permission.entityName')" name="entityName">
          <Input v-model:value="formData.entityName" :placeholder="$t('page.system.permission.entityNamePlaceholder')" />
        </FormItem>
      </template>
    </Form>

    <template #footer>
      <Button class="mr-2" @click="handleClose">{{ $t('page.common.cancel') }}</Button>
      <Button type="primary" :loading="loading" @click="handleSubmit">{{ $t('page.common.save') }}</Button>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Drawer, Form, FormItem, Input, InputNumber, TreeSelect, Button, Divider, message } from 'ant-design-vue';
import { $t } from '@vben/locales';
import { addPermission, updatePermission } from '#/api/sys/permission';
import { getMenuList } from '#/api/system/menu';
import type { MenuMetaMap } from '../types/permission';

interface MenuNode {
  menuId: number;
  menuName: string;
  children?: MenuNode[];
}

const props = defineProps<{
  data?: {
    menuId?: number | string;
    menuType?: string;
    parentId?: number | string;
    isEdit?: boolean;
    record?: any;
  };
  metaMap?: MenuMetaMap;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const visible = ref(false);
const loading = ref(false);
const formRef = ref();
const menuTreeData = ref<MenuNode[]>([]);

const isEdit = computed(() => props.data?.isEdit);

// 低代码配置（从props传入）
const metaMap = computed(() => props.metaMap);

const formData = ref({
  menuId: undefined as number | string | undefined,
  menuType: 'C' as 'C' | 'M' | 'F',
  parentId: undefined as number | string | undefined,
  menuName: '',
  path: '',
  component: '',
  icon: '',
  perms: '',
  orderNum: 0,
  entityName: '',
});

// 根据节点类型获取表单验证规则（低代码配置驱动）
const formRules = computed(() => {
  const baseRules: any = {
    menuName: [
      { required: true, message: $t('page.system.menu.menuNameRequired'), trigger: 'blur' },
      { max: 50, message: $t('page.system.menu.menuNameLength'), trigger: 'blur' },
    ],
    orderNum: [{ required: true, message: ' ', trigger: 'change' }],
  };

  if (formData.value.menuType === 'M') {
    return {
      ...baseRules,
      path: [{ required: true, message: () => $t('page.common.inputRoute'), trigger: 'blur' }],
      component: [{ required: true, message: () => $t('page.common.inputComponent'), trigger: 'blur' }],
    };
  }

  if (formData.value.menuType === 'F') {
    return {
      ...baseRules,
      perms: [{ required: true, message: () => $t('page.common.inputPermCode'), trigger: 'blur' }],
    };
  }

  return baseRules;
});

// 加载上级菜单树（用于C类选择上级）
const loadMenuTree = async () => {
  try {
    const res = await getMenuList({ pageNum: 1, pageSize: 1000 });
    const flatList = res.rows || [];
    // 构建下拉树（只取C类和M类作为上级菜单）
    const filtered = flatList.filter((item: any) => item.menuType === 'C' || item.menuType === 'M');
    menuTreeData.value = buildSelectTree(filtered);
  } catch (error) {
    console.error($t('page.common.loadMenuTreeFail'), error);
  }
};

// 构建树形下拉数据
const buildSelectTree = (list: any[]): MenuNode[] => {
  const map = new Map<number, MenuNode>();
  const result: MenuNode[] = [];

  list.forEach((item: any) => {
    map.set(item.menuId, { menuId: item.menuId, menuName: item.menuName, children: [] });
  });

  list.forEach((item: any) => {
    const node = map.get(item.menuId)!;
    if (item.parentId === 0 || item.parentId === '0' || !map.has(item.parentId)) {
      result.push(node);
    } else {
      const parent = map.get(item.parentId);
      if (parent) {
        parent.children!.push(node);
      }
    }
  });

  return result;
};

// 打开抽屉
const open = (
  config: {
    menuType: 'C' | 'M' | 'F';
    parentId?: number | string;
    menuId?: number | string;
    isEdit?: boolean;
    record?: any;
  },
  meta?: MenuMetaMap
) => {
  visible.value = true;
  loadMenuTree();

  if (config.isEdit && config.record) {
    // 编辑模式
    formData.value = {
      menuId: config.record.menuId,
      menuType: config.record.menuType,
      parentId: config.record.parentId,
      menuName: config.record.menuName || '',
      path: config.record.path || '',
      component: config.record.component || '',
      icon: config.record.icon || '',
      perms: config.record.perms || '',
      orderNum: config.record.orderNum || 0,
      entityName: config.record.entityName || meta?.entityName || '',
    };
  } else {
    // 新增模式
    formData.value = {
      menuId: undefined,
      menuType: config.menuType,
      parentId: config.parentId,
      menuName: '',
      path: '',
      component: '',
      icon: '',
      perms: '',
      orderNum: 0,
      entityName: meta?.entityName || '',
    };
  }
};

// 关闭抽屉
const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
};

// 提交表单（低代码驱动）
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const submitData: any = {
      menuId: formData.value.menuId,
      menuType: formData.value.menuType,
      parentId: formData.value.parentId || 0,
      menuName: formData.value.menuName,
      path: formData.value.path,
      component: formData.value.component,
      icon: formData.value.icon,
      perms: formData.value.perms,
      orderNum: formData.value.orderNum,
    };

    // 低代码扩展字段（如果配置了entityName）
    if (formData.value.entityName && metaMap.value?.entityName) {
      submitData.params = {
        entityName: formData.value.entityName,
        listMode: metaMap.value.listMode,
        treeLabelField: metaMap.value.treeLabelField,
        treeParentField: metaMap.value.treeParentField,
      };
    }

    if (isEdit.value) {
      await updatePermission(submitData);
    } else {
      await addPermission(submitData);
    }

    message.success($t('page.message.saveSuccess'));
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || $t('page.message.saveFail'));
  } finally {
    loading.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped>
.permission-form {
  padding-bottom: 60px;
}
</style>
