<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { IconPicker, useVbenModal } from '@vben/common-ui';
import { Form, Input, InputNumber, Radio, TreeSelect, Spin, message } from 'ant-design-vue';
import { getMenuDetail, getMenuList, addMenu, updateMenu, type MenuItem } from '#/api';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

interface MenuTreeOption {
  title: string;
  value: number;
  children?: MenuTreeOption[];
}

const data = ref<{
  isEdit?: boolean;
  menuId?: number;
  parentRow?: MenuItem;
  onSuccess?: () => void;
}>();

const title = ref('');
const loading = ref(false);

const isEdit = computed(() => !!data.value?.isEdit && data.value?.menuId != null);

// 表单数据（完全对齐若依字段）
const form = reactive({
  menuId: undefined as number | undefined,
  parentId: 0,
  menuType: 'M',
  icon: 'carbon:logo-github',
  orderNum: 0,
  menuName: '',
  routeName: '',
  isFrame: '1',
  path: '',
  component: '',
  perms: '',
  query: '',
  isCache: '0',
  visible: '0',
  status: '0',
});

const menuTreeOptions = ref<MenuTreeOption[]>([]);

function resetForm(parentId = 0) {
  form.menuId = undefined;
  form.parentId = parentId;
  form.menuType = 'M';
  form.icon = 'carbon:logo-github';
  form.orderNum = 0;
  form.menuName = '';
  form.routeName = '';
  form.isFrame = '1';
  form.path = '';
  form.component = '';
  form.perms = '';
  form.query = '';
  form.isCache = '0';
  form.visible = '0';
  form.status = '0';
}

function buildMenuTree(list: MenuItem[]): MenuTreeOption[] {
  const map = new Map<number, MenuTreeOption & { children: MenuTreeOption[] }>();
  list.forEach((item) => {
    map.set(item.menuId, {
      title: item.menuName,
      value: item.menuId,
      children: [],
    });
  });
  const roots: (MenuTreeOption & { children: MenuTreeOption[] })[] = [];
  map.forEach((node, id) => {
    const item = list.find((m) => m.menuId === id)!;
    if (!item.parentId || !map.has(item.parentId)) {
      roots.push(node);
    } else {
      map.get(item.parentId)!.children.push(node);
    }
  });
  return roots;
}

async function loadMenuTree() {
  const res = (await getMenuList()) as any;
  const list: MenuItem[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  const children = buildMenuTree(list);
  menuTreeOptions.value = [
    { title: '主类目', value: 0, children },
  ];
}

const [Modal, modalApi] = useVbenModal({
  footerClass: 'justify-center',
  showCancelButton: true,
  showConfirmButton: true,
  openAutoFocus: false,
  destroyOnClose: true,
  centered: true,
  class: 'w-[720px]',
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await handleSubmit();
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const payload = modalApi.getData<typeof data.value>();
    data.value = payload ?? {};
    title.value = isEdit.value ? '修改菜单' : '添加菜单';
    loading.value = true;
    try {
      await loadMenuTree();
      if (isEdit.value && data.value?.menuId != null) {
        const res = (await getMenuDetail(data.value.menuId)) as any;
        const detail = res?.data ?? res;
        resetForm(detail.parentId ?? 0);
        form.menuId = detail.menuId;
        form.menuType = detail.menuType ?? 'M';
        form.icon = detail.icon ?? 'carbon:logo-github';
        form.orderNum = detail.orderNum ?? 0;
        form.menuName = detail.menuName ?? '';
        form.routeName = detail.routeName ?? '';
        form.isFrame = detail.isFrame ?? '1';
        form.path = detail.path ?? '';
        form.component = detail.component ?? '';
        form.perms = detail.perms ?? '';
        form.query = detail.query ?? '';
        form.isCache = detail.isCache ?? '0';
        form.visible = detail.visible ?? '0';
        form.status = detail.status ?? '0';
      } else {
        const parentId = data.value?.parentRow?.menuId ?? 0;
        resetForm(parentId);
      }
    } catch (e: any) {
      message.error(e?.message ?? '加载菜单信息失败');
    } finally {
      loading.value = false;
    }
  },
});

async function handleSubmit() {
  loading.value = true;
  try {
    const payload: Record<string, any> = {
      parentId: form.parentId,
      menuName: form.menuName,
      orderNum: form.orderNum,
      menuType: form.menuType,
      icon: form.icon,
      isFrame: form.isFrame,
      path: form.path,
      component: form.component,
      perms: form.perms,
      query: form.query,
      isCache: form.isCache,
      visible: form.visible,
      status: form.status,
      routeName: form.routeName,
    };
    let res: any;
    if (isEdit.value && form.menuId != null) {
      payload.menuId = form.menuId;
      res = await updateMenu(payload);
    } else {
      res = await addMenu(payload);
    }
    // 调用成功（若依后端异常会直接抛错到 catch），这里统一视为成功
    message.success(res?.msg ?? '操作成功');
    // 通知父组件刷新菜单列表
    emit('success');
    if (data.value?.onSuccess) {
      await Promise.resolve(data.value.onSuccess());
    }
    modalApi.close();
    // 自动刷新整页，使侧边栏菜单和路由立即生效
    window.location.reload();
  } catch (e: any) {
    message.error(e?.message ?? '操作失败');
  } finally {
    loading.value = false;
  }
}

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="title">
    <Spin :spinning="loading">
      <Form
        layout="horizontal"
        :label-col="{ style: { width: '100px' } }"
        :wrapper-col="{ style: { flex: 1 } }"
        class="menu-form grid grid-cols-2 gap-x-6"
      >
        <!-- 上级菜单 -->
        <Form.Item label="上级菜单" class="col-span-2">
          <TreeSelect
            v-model:value="form.parentId"
            :tree-data="menuTreeOptions"
            tree-default-expand-all
            allow-clear
            placeholder="选择上级菜单"
            class="w-full"
          />
        </Form.Item>

        <!-- 菜单类型 -->
        <Form.Item label="菜单类型" class="col-span-2">
          <Radio.Group v-model:value="form.menuType">
            <Radio value="M">目录</Radio>
            <Radio value="C">菜单</Radio>
            <Radio value="F">按钮</Radio>
          </Radio.Group>
        </Form.Item>

        <!-- 菜单图标（目录、菜单） -->
        <Form.Item
          v-if="form.menuType !== 'F'"
          label="菜单图标"
        >
          <IconPicker v-model:modelValue="form.icon" />
        </Form.Item>

        <!-- 显示排序（当菜单类型为“按钮”时必填） -->
        <Form.Item
          label="显示排序"
          :rules="form.menuType === 'F' ? [{ required: true, message: '显示排序不能为空' }] : []"
        >
          <InputNumber v-model:value="form.orderNum" :min="0" class="w-full" />
        </Form.Item>

        <!-- 菜单名称 -->
        <Form.Item label="菜单名称" required>
          <Input v-model:value="form.menuName" placeholder="请输入菜单名称" />
        </Form.Item>

        <!-- 路由名称（菜单） -->
        <Form.Item
          v-if="form.menuType === 'C'"
          label="路由名称"
        >
          <Input v-model:value="form.routeName" placeholder="请输入路由名称" />
        </Form.Item>

        <!-- 是否外链（目录、菜单） -->
        <Form.Item
          v-if="form.menuType !== 'F'"
          label="是否外链"
        >
          <Radio.Group v-model:value="form.isFrame">
            <Radio value="0">是</Radio>
            <Radio value="1">否</Radio>
          </Radio.Group>
        </Form.Item>

        <!-- 路由地址（目录、菜单） -->
        <Form.Item
          v-if="form.menuType !== 'F'"
          label="路由地址"
        >
          <Input v-model:value="form.path" placeholder="请输入路由地址" />
        </Form.Item>

        <!-- 组件路径（菜单） -->
        <Form.Item
          v-if="form.menuType === 'C'"
          label="组件路径"
        >
          <Input v-model:value="form.component" placeholder="请输入组件路径" />
        </Form.Item>

        <!-- 权限字符（菜单、按钮） -->
        <Form.Item
          v-if="form.menuType !== 'M'"
          label="权限字符"
        >
          <Input v-model:value="form.perms" placeholder="请输入权限标识" />
        </Form.Item>

        <!-- 路由参数（菜单） -->
        <Form.Item
          v-if="form.menuType === 'C'"
          label="路由参数"
        >
          <Input v-model:value="form.query" placeholder="请输入路由参数" />
        </Form.Item>

        <!-- 是否缓存（菜单） -->
        <Form.Item
          v-if="form.menuType === 'C'"
          label="是否缓存"
        >
          <Radio.Group v-model:value="form.isCache">
            <Radio value="0">缓存</Radio>
            <Radio value="1">不缓存</Radio>
          </Radio.Group>
        </Form.Item>

        <!-- 显示状态（目录、菜单） -->
        <Form.Item
          v-if="form.menuType !== 'F'"
          label="显示状态"
        >
          <Radio.Group v-model:value="form.visible">
            <Radio value="0">显示</Radio>
            <Radio value="1">隐藏</Radio>
          </Radio.Group>
        </Form.Item>

        <!-- 菜单状态（所有类型） -->
        <Form.Item label="菜单状态">
          <Radio.Group v-model:value="form.status">
            <Radio value="0">正常</Radio>
            <Radio value="1">停用</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Spin>
  </Modal>
</template>

<style scoped>
.menu-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.menu-form :deep(.ant-form-item-label > label) {
  font-size: 13px;
}

.menu-form :deep(.ant-radio-group),
.menu-form :deep(.ant-input),
.menu-form :deep(.ant-input-number),
.menu-form :deep(.ant-select),
.menu-form :deep(.ant-tree-select) {
  width: 100%;
}
</style>
